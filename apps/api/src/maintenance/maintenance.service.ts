import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  LeaseStatus,
  MaintenancePriority,
  MaintenanceStatus,
  NotificationType,
  Prisma,
  UserRole,
} from "@prisma/client";
import { RequestUser } from "../common/auth/request-user";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { AddMaintenanceCommentDto } from "./dto/add-maintenance-comment.dto";
import { CreateMaintenanceRequestDto } from "./dto/create-maintenance-request.dto";
import { ListMaintenanceRequestsDto } from "./dto/list-maintenance-requests.dto";
import { UpdateMaintenanceStatusDto } from "./dto/update-maintenance-status.dto";

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listRequests(user: RequestUser, query: ListMaintenanceRequestsDto) {
    const where = this.buildListWhere(user, query);

    return this.prisma.maintenanceRequest.findMany({
      where,
      include: maintenanceRequestInclude,
      orderBy: [{ emergency: "desc" }, { submittedAt: "desc" }],
      take: query.limit ?? 100,
    });
  }

  async getRequestById(user: RequestUser, requestId: string) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: maintenanceRequestInclude,
    });

    if (!request) {
      throw new NotFoundException("Maintenance request not found");
    }

    this.assertCanAccessRequest(user, request);
    return request;
  }

  async createRequest(user: RequestUser, payload: CreateMaintenanceRequestDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: payload.propertyId },
      select: {
        id: true,
        ownerId: true,
        name: true,
      },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    if (user.role === UserRole.LANDLORD && property.ownerId !== user.id) {
      throw new ForbiddenException(
        "You cannot create maintenance requests for another landlord's property",
      );
    }

    const relation = await this.resolveRequestRelation(
      user,
      payload,
      property.id,
    );
    const emergency = payload.emergency ?? false;

    const created = await this.prisma.$transaction(async (tx) => {
      const request = await tx.maintenanceRequest.create({
        data: {
          propertyId: property.id,
          unitId: relation.unitId,
          leaseId: relation.leaseId,
          requesterId: user.id,
          title: payload.title.trim(),
          category: payload.category.trim(),
          details: payload.details.trim(),
          priority:
            payload.priority ??
            (emergency
              ? MaintenancePriority.EMERGENCY
              : MaintenancePriority.MEDIUM),
          emergency,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entityType: "MAINTENANCE_REQUEST",
          entityId: request.id,
          action: "MAINTENANCE_REQUEST_CREATED",
          metadata: {
            propertyId: property.id,
            leaseId: relation.leaseId,
            unitId: relation.unitId,
            emergency,
          },
        },
      });

      return request;
    });

    const notificationUserIds: string[] = [];
    if (property.ownerId !== user.id) {
      notificationUserIds.push(property.ownerId);
    }
    if (relation.leaseTenantId && relation.leaseTenantId !== user.id) {
      notificationUserIds.push(relation.leaseTenantId);
    }

    await this.notificationsService.createInAppNotifications({
      userIds: notificationUserIds,
      type: NotificationType.MAINTENANCE_UPDATE,
      title: "New maintenance request",
      body: `${payload.title.trim()} - ${property.name}`,
      data: {
        requestId: created.id,
        propertyId: property.id,
        status: created.status,
      },
    });

    return this.getRequestById(user, created.id);
  }

  async updateStatus(
    user: RequestUser,
    requestId: string,
    payload: UpdateMaintenanceStatusDto,
  ) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        property: {
          select: {
            id: true,
            ownerId: true,
            name: true,
          },
        },
        lease: {
          select: {
            id: true,
            tenantId: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException("Maintenance request not found");
    }

    this.assertCanManageStatus(
      user,
      request.requesterId,
      request.property.ownerId,
    );
    this.assertStatusTransition(
      user,
      request.status,
      payload.status,
      request.requesterId,
    );

    if (
      payload.status === MaintenanceStatus.SCHEDULED &&
      !payload.scheduledAt
    ) {
      throw new BadRequestException(
        "scheduledAt is required when status is SCHEDULED",
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.maintenanceRequest.update({
        where: { id: request.id },
        data: {
          status: payload.status,
          scheduledAt:
            payload.status === MaintenanceStatus.SCHEDULED
              ? new Date(payload.scheduledAt!)
              : request.scheduledAt,
          resolvedAt: this.resolveResolvedAt(payload.status),
        },
      });

      if (payload.note?.trim()) {
        await tx.maintenanceComment.create({
          data: {
            requestId: request.id,
            authorId: user.id,
            comment: payload.note.trim(),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entityType: "MAINTENANCE_REQUEST",
          entityId: request.id,
          action: "MAINTENANCE_STATUS_UPDATED",
          metadata: {
            fromStatus: request.status,
            toStatus: payload.status,
            noteProvided: Boolean(payload.note?.trim()),
          },
        },
      });

      return next;
    });

    const recipients = Array.from(
      new Set(
        [request.requesterId, request.property.ownerId, request.lease?.tenantId]
          .filter((value): value is string => Boolean(value))
          .filter((userId) => userId !== user.id),
      ),
    );

    await this.notificationsService.createInAppNotifications({
      userIds: recipients,
      type: NotificationType.MAINTENANCE_UPDATE,
      title: "Maintenance request updated",
      body: `${request.title} is now ${payload.status.replaceAll("_", " ")}`,
      data: {
        requestId: request.id,
        status: updated.status,
      },
    });

    return this.getRequestById(user, request.id);
  }

  async listComments(user: RequestUser, requestId: string) {
    await this.getRequestById(user, requestId);

    return this.prisma.maintenanceComment.findMany({
      where: { requestId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async addComment(
    user: RequestUser,
    requestId: string,
    payload: AddMaintenanceCommentDto,
  ) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        property: {
          select: {
            id: true,
            ownerId: true,
          },
        },
        lease: {
          select: {
            tenantId: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException("Maintenance request not found");
    }

    this.assertCanAccessRequest(user, request);

    const created = await this.prisma.maintenanceComment.create({
      data: {
        requestId,
        authorId: user.id,
        comment: payload.comment.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const recipients = Array.from(
      new Set(
        [request.requesterId, request.property.ownerId, request.lease?.tenantId]
          .filter((value): value is string => Boolean(value))
          .filter((userId) => userId !== user.id),
      ),
    );

    await this.notificationsService.createInAppNotifications({
      userIds: recipients,
      type: NotificationType.MAINTENANCE_UPDATE,
      title: "New maintenance comment",
      body: payload.comment.trim().slice(0, 120),
      data: {
        requestId,
        commentId: created.id,
      },
    });

    return created;
  }

  private buildListWhere(
    user: RequestUser,
    query: ListMaintenanceRequestsDto,
  ): Prisma.MaintenanceRequestWhereInput {
    const where: Prisma.MaintenanceRequestWhereInput = {
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.unitId ? { unitId: query.unitId } : {}),
      ...(query.leaseId ? { leaseId: query.leaseId } : {}),
      ...(query.requesterId ? { requesterId: query.requesterId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
    };

    if (user.role === UserRole.ADMIN) {
      return where;
    }

    if (user.role === UserRole.LANDLORD) {
      return {
        ...where,
        property: {
          ownerId: user.id,
        },
      };
    }

    if (query.requesterId && query.requesterId !== user.id) {
      throw new ForbiddenException(
        "Tenants can only filter by their own requesterId",
      );
    }

    return {
      ...where,
      OR: [{ requesterId: user.id }, { lease: { tenantId: user.id } }],
    };
  }

  private async resolveRequestRelation(
    user: RequestUser,
    payload: CreateMaintenanceRequestDto,
    propertyId: string,
  ) {
    let unitId = payload.unitId;
    let leaseId = payload.leaseId;
    let leaseTenantId: string | undefined;

    if (payload.unitId) {
      const unit = await this.prisma.unit.findUnique({
        where: { id: payload.unitId },
        select: {
          id: true,
          propertyId: true,
        },
      });
      if (!unit || unit.propertyId !== propertyId) {
        throw new NotFoundException("Unit not found for selected property");
      }
      unitId = unit.id;
    }

    if (payload.leaseId) {
      const lease = await this.prisma.lease.findUnique({
        where: { id: payload.leaseId },
        select: {
          id: true,
          propertyId: true,
          unitId: true,
          tenantId: true,
        },
      });
      if (!lease || lease.propertyId !== propertyId) {
        throw new NotFoundException("Lease not found for selected property");
      }
      if (unitId && lease.unitId !== unitId) {
        throw new BadRequestException(
          "Provided unitId does not match selected lease",
        );
      }
      leaseId = lease.id;
      unitId = lease.unitId;
      leaseTenantId = lease.tenantId;
    }

    if (user.role === UserRole.TENANT) {
      const tenantLease = await this.prisma.lease.findFirst({
        where: {
          tenantId: user.id,
          propertyId,
          status: {
            in: [LeaseStatus.DRAFT, LeaseStatus.ACTIVE, LeaseStatus.EXPIRED],
          },
          ...(unitId ? { unitId } : {}),
          ...(leaseId ? { id: leaseId } : {}),
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          unitId: true,
          tenantId: true,
        },
      });

      if (!tenantLease) {
        throw new ForbiddenException(
          "You can only create requests for units linked to your lease",
        );
      }

      leaseId = tenantLease.id;
      unitId = tenantLease.unitId;
      leaseTenantId = tenantLease.tenantId;
    }

    return {
      unitId,
      leaseId,
      leaseTenantId,
    };
  }

  private assertCanAccessRequest(
    user: RequestUser,
    request: {
      requesterId: string;
      lease: { tenantId: string } | null;
      property: { ownerId: string };
    },
  ) {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (
      user.role === UserRole.LANDLORD &&
      request.property.ownerId === user.id
    ) {
      return;
    }

    if (
      user.role === UserRole.TENANT &&
      (request.requesterId === user.id || request.lease?.tenantId === user.id)
    ) {
      return;
    }

    throw new ForbiddenException(
      "You do not have access to this maintenance request",
    );
  }

  private assertCanManageStatus(
    user: RequestUser,
    requesterId: string,
    ownerId: string,
  ) {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role === UserRole.LANDLORD && ownerId === user.id) {
      return;
    }

    if (user.role === UserRole.TENANT && requesterId === user.id) {
      return;
    }

    throw new ForbiddenException("You cannot update status for this request");
  }

  private assertStatusTransition(
    user: RequestUser,
    current: MaintenanceStatus,
    next: MaintenanceStatus,
    requesterId: string,
  ) {
    if (current === next) {
      return;
    }

    if (user.role === UserRole.TENANT) {
      if (requesterId !== user.id || next !== MaintenanceStatus.CANCELED) {
        throw new ForbiddenException(
          "Tenants can only cancel their own requests",
        );
      }
      if (
        current === MaintenanceStatus.COMPLETED ||
        current === MaintenanceStatus.CANCELED
      ) {
        throw new BadRequestException("Closed requests cannot be modified");
      }
      return;
    }

    const allowed = maintenanceTransitionMap[current] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid maintenance transition from ${current} to ${next}`,
      );
    }
  }

  private resolveResolvedAt(status: MaintenanceStatus) {
    if (
      status === MaintenanceStatus.COMPLETED ||
      status === MaintenanceStatus.CANCELED
    ) {
      return new Date();
    }
    return null;
  }
}

const maintenanceTransitionMap: Record<MaintenanceStatus, MaintenanceStatus[]> =
  {
    SUBMITTED: [
      MaintenanceStatus.REVIEWING,
      MaintenanceStatus.COMPLETED,
      MaintenanceStatus.CANCELED,
    ],
    REVIEWING: [
      MaintenanceStatus.SCHEDULED,
      MaintenanceStatus.IN_PROGRESS,
      MaintenanceStatus.COMPLETED,
      MaintenanceStatus.CANCELED,
    ],
    SCHEDULED: [
      MaintenanceStatus.IN_PROGRESS,
      MaintenanceStatus.COMPLETED,
      MaintenanceStatus.CANCELED,
    ],
    IN_PROGRESS: [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELED],
    COMPLETED: [],
    CANCELED: [],
  };

const maintenanceRequestInclude = {
  property: {
    select: {
      id: true,
      ownerId: true,
      name: true,
      city: true,
      state: true,
    },
  },
  unit: {
    select: {
      id: true,
      name: true,
    },
  },
  lease: {
    select: {
      id: true,
      tenantId: true,
      landlordId: true,
      status: true,
      tenant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      landlord: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  },
  requester: {
    select: {
      id: true,
      role: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  comments: {
    take: 1,
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  },
  documents: {
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      type: true,
      sizeBytes: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.MaintenanceRequestInclude;
