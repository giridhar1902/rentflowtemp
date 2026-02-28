import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  InvitationStatus,
  LeaseStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
import { RequestUser } from "../common/auth/request-user";
import { PrismaService } from "../prisma/prisma.service";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { CreateLeaseDto } from "./dto/create-lease.dto";
import { UpdateLeaseDto } from "./dto/update-lease.dto";

@Injectable()
export class LeasesService {
  constructor(private readonly prisma: PrismaService) {}

  async listLeases(user: RequestUser) {
    if (user.role === UserRole.ADMIN) {
      return this.prisma.lease.findMany({
        orderBy: { createdAt: "desc" },
        include: leaseInclude,
      });
    }

    if (user.role === UserRole.LANDLORD) {
      return this.prisma.lease.findMany({
        where: { landlordId: user.id },
        orderBy: { createdAt: "desc" },
        include: leaseInclude,
      });
    }

    return this.prisma.lease.findMany({
      where: { tenantId: user.id },
      orderBy: { createdAt: "desc" },
      include: leaseInclude,
    });
  }

  async listMyInvitations(user: RequestUser) {
    if (user.role !== UserRole.TENANT) {
      throw new ForbiddenException("Only tenants can list invitations");
    }

    if (!user.email) {
      return [];
    }

    const normalizedEmail = user.email.trim().toLowerCase();

    return this.prisma.tenantInvitation.findMany({
      where: {
        status: InvitationStatus.PENDING,
        expiresAt: { gte: new Date() },
        OR: [
          {
            inviteeEmail: {
              equals: normalizedEmail,
              mode: "insensitive",
            },
          },
          { inviteeUserId: user.id },
        ],
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
            monthlyRent: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getLeaseById(user: RequestUser, leaseId: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
      include: leaseInclude,
    });

    if (!lease) {
      throw new NotFoundException("Lease not found");
    }

    this.assertCanAccessLease(user, lease.landlordId, lease.tenantId);
    return lease;
  }

  async createLease(user: RequestUser, payload: CreateLeaseDto) {
    if (user.role !== UserRole.LANDLORD && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only landlords can create leases");
    }

    const property = await this.prisma.property.findUnique({
      where: { id: payload.propertyId },
      select: { id: true, ownerId: true },
    });
    if (!property) {
      throw new NotFoundException("Property not found");
    }

    if (user.role === UserRole.LANDLORD && property.ownerId !== user.id) {
      throw new ForbiddenException(
        "You cannot create leases for another landlord's property",
      );
    }

    const unit = await this.prisma.unit.findUnique({
      where: { id: payload.unitId },
      select: { id: true, propertyId: true },
    });
    if (!unit || unit.propertyId !== property.id) {
      throw new NotFoundException("Unit not found for this property");
    }

    const tenant = await this.prisma.user.findUnique({
      where: { id: payload.tenantUserId },
      select: { id: true, role: true },
    });
    if (!tenant) {
      throw new NotFoundException("Tenant user not found");
    }

    if (tenant.role !== UserRole.TENANT) {
      throw new ForbiddenException("Lease tenant must have tenant role");
    }

    const lease = await this.prisma.lease.create({
      data: {
        propertyId: property.id,
        unitId: unit.id,
        landlordId: property.ownerId,
        tenantId: tenant.id,
        status: payload.status ?? LeaseStatus.DRAFT,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        monthlyRent: payload.monthlyRent,
        securityDeposit: payload.securityDeposit,
        dueDay: payload.dueDay,
        partialPaymentsAllowed: payload.partialPaymentsAllowed ?? false,
        cashPaymentsAllowed: payload.cashPaymentsAllowed ?? false,
        cashApprovalRequired: payload.cashApprovalRequired ?? true,
        autoRemindersEnabled: payload.autoRemindersEnabled ?? true,
      },
    });

    return this.getLeaseById(user, lease.id);
  }

  async updateLease(
    user: RequestUser,
    leaseId: string,
    payload: UpdateLeaseDto,
  ) {
    const existing = await this.prisma.lease.findUnique({
      where: { id: leaseId },
    });
    if (!existing) {
      throw new NotFoundException("Lease not found");
    }

    if (user.role !== UserRole.ADMIN && existing.landlordId !== user.id) {
      throw new ForbiddenException("Only lease landlord can update this lease");
    }

    const data: Prisma.LeaseUpdateInput = {};

    if (payload.status !== undefined) {
      data.status = payload.status;
    }
    if (payload.startDate !== undefined) {
      data.startDate = new Date(payload.startDate);
    }
    if (payload.endDate !== undefined) {
      data.endDate = new Date(payload.endDate);
    }
    if (payload.monthlyRent !== undefined) {
      data.monthlyRent = payload.monthlyRent;
    }
    if (payload.securityDeposit !== undefined) {
      data.securityDeposit = payload.securityDeposit;
    }
    if (payload.dueDay !== undefined) {
      data.dueDay = payload.dueDay;
    }
    if (payload.partialPaymentsAllowed !== undefined) {
      data.partialPaymentsAllowed = payload.partialPaymentsAllowed;
    }
    if (payload.cashPaymentsAllowed !== undefined) {
      data.cashPaymentsAllowed = payload.cashPaymentsAllowed;
    }
    if (payload.cashApprovalRequired !== undefined) {
      data.cashApprovalRequired = payload.cashApprovalRequired;
    }
    if (payload.autoRemindersEnabled !== undefined) {
      data.autoRemindersEnabled = payload.autoRemindersEnabled;
    }

    await this.prisma.lease.update({
      where: { id: leaseId },
      data,
    });

    return this.getLeaseById(user, leaseId);
  }

  async acceptInvitation(user: RequestUser, payload: AcceptInvitationDto) {
    if (user.role !== UserRole.TENANT) {
      throw new ForbiddenException("Only tenants can accept invitations");
    }

    if (!user.email) {
      throw new ForbiddenException(
        "Tenant account email is required to accept invitation",
      );
    }

    const code = payload.code.toUpperCase().trim();
    const invitation = await this.prisma.tenantInvitation.findUnique({
      where: { code },
      include: {
        property: true,
        unit: true,
        lease: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException("Invitation code is invalid");
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ForbiddenException("Invitation is no longer pending");
    }

    if (invitation.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException("Invitation has expired");
    }

    if (
      invitation.inviteeEmail.trim().toLowerCase() !==
      user.email.trim().toLowerCase()
    ) {
      throw new ForbiddenException(
        "Invitation email does not match authenticated user",
      );
    }

    if (invitation.inviteeUserId && invitation.inviteeUserId !== user.id) {
      throw new ForbiddenException(
        "Invitation is linked to a different tenant account",
      );
    }

    if (!invitation.propertyId || !invitation.unitId) {
      throw new ForbiddenException(
        "Invitation is missing property/unit linkage for acceptance",
      );
    }

    const accepted = await this.prisma.$transaction(async (tx) => {
      let leaseId = invitation.leaseId ?? null;
      if (!leaseId) {
        const existingLease = await tx.lease.findFirst({
          where: {
            propertyId: invitation.propertyId!,
            unitId: invitation.unitId!,
            tenantId: user.id,
            status: {
              in: [LeaseStatus.DRAFT, LeaseStatus.ACTIVE, LeaseStatus.EXPIRED],
            },
          },
          select: { id: true },
        });

        if (existingLease) {
          leaseId = existingLease.id;
        } else {
          if (!invitation.property || !invitation.unit) {
            throw new ForbiddenException("Invitation relations are incomplete");
          }

          const createdLease = await tx.lease.create({
            data: {
              propertyId: invitation.property.id,
              unitId: invitation.unit.id,
              landlordId: invitation.property.ownerId,
              tenantId: user.id,
              status: LeaseStatus.ACTIVE,
              startDate: new Date(),
              endDate: oneYearFromNow(),
              monthlyRent: invitation.unit.monthlyRent,
              securityDeposit: invitation.unit.securityDeposit,
              dueDay: 1,
              partialPaymentsAllowed: false,
              cashPaymentsAllowed: false,
              cashApprovalRequired: true,
              autoRemindersEnabled: true,
            },
            select: { id: true },
          });
          leaseId = createdLease.id;
        }
      }

      return tx.tenantInvitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
          inviteeUserId: user.id,
          leaseId,
        },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
            },
          },
          unit: {
            select: {
              id: true,
              name: true,
              monthlyRent: true,
            },
          },
          lease: {
            include: leaseInclude,
          },
        },
      });
    });

    return accepted;
  }

  private assertCanAccessLease(
    user: RequestUser,
    landlordId: string,
    tenantId: string,
  ) {
    if (user.role === UserRole.ADMIN) {
      return;
    }
    if (user.role === UserRole.LANDLORD && landlordId === user.id) {
      return;
    }
    if (user.role === UserRole.TENANT && tenantId === user.id) {
      return;
    }
    throw new ForbiddenException("You do not have access to this lease");
  }
}

const leaseInclude = {
  property: {
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      addressLine1: true,
      postalCode: true,
    },
  },
  unit: {
    select: {
      id: true,
      name: true,
      monthlyRent: true,
      bedrooms: true,
      bathrooms: true,
      occupancy: true,
    },
  },
  landlord: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
  tenant: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
} satisfies Prisma.LeaseInclude;

const oneYearFromNow = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date;
};
