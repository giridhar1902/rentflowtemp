import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  InvitationStatus,
  LeaseStatus,
  NotificationType,
  Prisma,
  Property,
  UserRole,
} from "@prisma/client";
import { RequestUser } from "../common/auth/request-user";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInvitationDto } from "./dto/create-invitation.dto";
import { CreateTenantPayloadDto } from "./dto/create-tenant-payload.dto";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { CreateUnitDto } from "./dto/create-unit.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";
import { UpdateUnitDto } from "./dto/update-unit.dto";

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  async listProperties(user: RequestUser) {
    if (user.role === UserRole.ADMIN) {
      return this.prisma.property.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          units: true,
          leases: {
            select: {
              id: true,
              unitId: true,
              status: true,
            },
          },
          _count: {
            select: { units: true, leases: true, invitations: true },
          },
        },
      });
    }

    if (user.role === UserRole.LANDLORD) {
      return this.prisma.property.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          units: true,
          leases: {
            select: {
              id: true,
              unitId: true,
              status: true,
            },
          },
          _count: {
            select: { units: true, leases: true, invitations: true },
          },
        },
      });
    }

    return this.prisma.property.findMany({
      where: {
        leases: {
          some: {
            tenantId: user.id,
            status: {
              in: [LeaseStatus.DRAFT, LeaseStatus.ACTIVE, LeaseStatus.EXPIRED],
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        units: true,
        leases: {
          select: {
            id: true,
            unitId: true,
            status: true,
          },
        },
        _count: {
          select: { units: true, leases: true },
        },
      },
    });
  }

  async createProperty(user: RequestUser, payload: CreatePropertyDto) {
    if (user.role !== UserRole.LANDLORD && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only landlords can create properties");
    }

    return this.prisma.property.create({
      data: {
        ownerId: user.id,
        name: payload.name.trim(),
        propertyType: payload.propertyType.trim(),
        floors: payload.floors,
        totalUnits: payload.totalUnits,
        amenities: sanitizeAmenities(payload.amenities),
        ownership: payload.ownership,
        status: payload.status,
        addressLine1: payload.addressLine1.trim(),
        addressLine2: payload.addressLine2?.trim(),
        city: payload.city.trim(),
        state: payload.state.trim(),
        postalCode: payload.postalCode.trim(),
        country: payload.country?.toUpperCase() ?? "US",
      },
    });
  }

  async getPropertyById(user: RequestUser, propertyId: string) {
    const leaseWhere =
      user.role === UserRole.TENANT ? { tenantId: user.id } : undefined;

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        units: true,
        leases: {
          ...(leaseWhere ? { where: leaseWhere } : {}),
          orderBy: { createdAt: "desc" },
          include: {
            tenant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    await this.assertCanViewProperty(user, property);
    return property;
  }

  async updateProperty(
    user: RequestUser,
    propertyId: string,
    payload: UpdatePropertyDto,
  ) {
    const property = await this.mustGetManagedProperty(user, propertyId);

    const data: Prisma.PropertyUpdateInput = {};

    if (payload.name !== undefined) {
      data.name = payload.name.trim();
    }
    if (payload.propertyType !== undefined) {
      data.propertyType = payload.propertyType.trim();
    }
    if (payload.floors !== undefined) {
      data.floors = payload.floors;
    }
    if (payload.totalUnits !== undefined) {
      data.totalUnits = payload.totalUnits;
    }
    if (payload.amenities !== undefined) {
      data.amenities = sanitizeAmenities(payload.amenities);
    }
    if (payload.ownership !== undefined) {
      data.ownership = payload.ownership;
    }
    if (payload.status !== undefined) {
      data.status = payload.status;
    }
    if (payload.addressLine1 !== undefined) {
      data.addressLine1 = payload.addressLine1.trim();
    }
    if (payload.addressLine2 !== undefined) {
      data.addressLine2 = payload.addressLine2.trim();
    }
    if (payload.city !== undefined) {
      data.city = payload.city.trim();
    }
    if (payload.state !== undefined) {
      data.state = payload.state.trim();
    }
    if (payload.postalCode !== undefined) {
      data.postalCode = payload.postalCode.trim();
    }
    if (payload.country !== undefined) {
      data.country = payload.country.toUpperCase();
    }

    await this.prisma.property.update({
      where: { id: property.id },
      data,
    });

    return this.getPropertyById(user, property.id);
  }

  async listUnits(user: RequestUser, propertyId: string) {
    await this.mustGetViewableProperty(user, propertyId);
    return this.prisma.unit.findMany({
      where: { propertyId },
      orderBy: { createdAt: "asc" },
    });
  }

  async createUnit(
    user: RequestUser,
    propertyId: string,
    payload: CreateUnitDto,
  ) {
    await this.mustGetManagedProperty(user, propertyId);

    return this.prisma.unit.create({
      data: {
        propertyId,
        name: payload.name.trim(),
        bedrooms: payload.bedrooms,
        bathrooms: payload.bathrooms,
        occupancy: payload.occupancy,
        furnishing: payload.furnishing?.trim(),
        status: payload.status,
        monthlyRent: payload.monthlyRent,
        securityDeposit: payload.securityDeposit,
        maintenanceFee: payload.maintenanceFee,
      },
    });
  }

  async updateUnit(
    user: RequestUser,
    propertyId: string,
    unitId: string,
    payload: UpdateUnitDto,
  ) {
    await this.mustGetManagedProperty(user, propertyId);

    const existing = await this.prisma.unit.findUnique({
      where: { id: unitId },
    });
    if (!existing || existing.propertyId !== propertyId) {
      throw new NotFoundException("Unit not found");
    }

    const data: Prisma.UnitUpdateInput = {};
    if (payload.name !== undefined) {
      data.name = payload.name.trim();
    }
    if (payload.bedrooms !== undefined) {
      data.bedrooms = payload.bedrooms;
    }
    if (payload.bathrooms !== undefined) {
      data.bathrooms = payload.bathrooms;
    }
    if (payload.occupancy !== undefined) {
      data.occupancy = payload.occupancy;
    }
    if (payload.furnishing !== undefined) {
      data.furnishing = payload.furnishing.trim();
    }
    if (payload.status !== undefined) {
      data.status = payload.status;
    }
    if (payload.monthlyRent !== undefined) {
      data.monthlyRent = payload.monthlyRent;
    }
    if (payload.securityDeposit !== undefined) {
      data.securityDeposit = payload.securityDeposit;
    }
    if (payload.maintenanceFee !== undefined) {
      data.maintenanceFee = payload.maintenanceFee;
    }

    return this.prisma.unit.update({
      where: { id: unitId },
      data,
    });
  }

  async listInvitations(user: RequestUser, propertyId: string) {
    await this.mustGetManagedProperty(user, propertyId);
    const invitations = await this.prisma.tenantInvitation.findMany({
      where: { propertyId },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
        invitee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return invitations.map((invitation) => ({
      ...invitation,
      inviteeRegistered: Boolean(invitation.inviteeUserId),
    }));
  }

  async createInvitation(
    user: RequestUser,
    propertyId: string,
    payload: CreateInvitationDto,
  ) {
    const property = await this.mustGetManagedProperty(user, propertyId);

    const inviteeEmail = payload.inviteeEmail.toLowerCase().trim();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: inviteeEmail },
      select: {
        id: true,
        role: true,
      },
    });

    if (
      existingUser &&
      existingUser.role !== UserRole.TENANT &&
      existingUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        "Invitee email already belongs to a non-tenant account",
      );
    }

    let unitId: string | undefined;
    if (payload.unitId) {
      const unit = await this.prisma.unit.findUnique({
        where: { id: payload.unitId },
      });
      if (!unit || unit.propertyId !== propertyId) {
        throw new NotFoundException("Unit not found for this property");
      }
      unitId = unit.id;
    }

    const expiresInDays = payload.expiresInDays ?? 7;
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    );
    const code = await this.generateUniqueInvitationCode();

    const createdInvitation = await this.prisma.tenantInvitation.create({
      data: {
        propertyId,
        unitId,
        invitedById: user.id,
        inviteeEmail,
        inviteeUserId: existingUser?.id,
        code,
        expiresAt,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (existingUser?.id) {
      await this.notificationsService.createInAppNotifications({
        userIds: [existingUser.id],
        type: NotificationType.LEASE_UPDATE,
        title: "New property invitation",
        body: `You were invited to join ${property.name}. Use code ${createdInvitation.code}.`,
        data: {
          invitationId: createdInvitation.id,
          propertyId: createdInvitation.propertyId,
          unitId: createdInvitation.unitId,
          code: createdInvitation.code,
        },
      });
    } else {
      await this.maybeSendSupabaseInviteEmail(
        inviteeEmail,
        createdInvitation.code,
      );
    }

    return {
      ...createdInvitation,
      inviteeRegistered: Boolean(existingUser?.id),
    };
  }

  private async maybeSendSupabaseInviteEmail(
    email: string,
    inviteCode: string,
  ) {
    const supabaseUrl = this.configService.get<string>("SUPABASE_URL")?.trim();
    const serviceRoleKey = this.configService
      .get<string>("SUPABASE_SERVICE_ROLE_KEY")
      ?.trim();
    if (!supabaseUrl || !serviceRoleKey) {
      return;
    }

    const normalizedBaseUrl = supabaseUrl.endsWith("/")
      ? supabaseUrl.slice(0, -1)
      : supabaseUrl;
    const endpoint = `${normalizedBaseUrl}/auth/v1/invite`;
    const redirectBase = this.configService
      .get<string>("TENANT_INVITE_REDIRECT_URL")
      ?.trim();
    const redirectTo = redirectBase
      ? `${redirectBase}${redirectBase.includes("?") ? "&" : "?"}code=${encodeURIComponent(inviteCode)}`
      : undefined;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          ...(redirectTo ? { redirect_to: redirectTo } : {}),
          data: {
            role: "TENANT",
            inviteCode,
          },
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        this.logger.warn(
          `Supabase invite email request failed (${response.status}) for ${email}: ${responseText}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Supabase invite email request error for ${email}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  }

  private async generateUniqueInvitationCode() {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = randomCode(6);
      const existing = await this.prisma.tenantInvitation.findUnique({
        where: { code },
      });
      if (!existing) {
        return code;
      }
    }
    throw new Error("Unable to generate unique invitation code");
  }

  private async mustGetManagedProperty(user: RequestUser, propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) {
      throw new NotFoundException("Property not found");
    }

    if (user.role === UserRole.ADMIN) {
      return property;
    }

    if (user.role !== UserRole.LANDLORD || property.ownerId !== user.id) {
      throw new ForbiddenException(
        "You do not have permission for this property",
      );
    }

    return property;
  }

  private async mustGetViewableProperty(user: RequestUser, propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) {
      throw new NotFoundException("Property not found");
    }

    await this.assertCanViewProperty(user, property);
    return property;
  }

  private async assertCanViewProperty(user: RequestUser, property: Property) {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role === UserRole.LANDLORD && property.ownerId === user.id) {
      return;
    }

    if (user.role === UserRole.TENANT) {
      const tenantLease = await this.prisma.lease.findFirst({
        where: {
          propertyId: property.id,
          tenantId: user.id,
          status: {
            in: [LeaseStatus.DRAFT, LeaseStatus.ACTIVE, LeaseStatus.EXPIRED],
          },
        },
        select: { id: true },
      });

      if (tenantLease) {
        return;
      }

      const acceptedInvitation = await this.prisma.tenantInvitation.findFirst({
        where: {
          propertyId: property.id,
          inviteeUserId: user.id,
          status: InvitationStatus.ACCEPTED,
        },
        select: { id: true },
      });

      if (acceptedInvitation) {
        return;
      }
    }

    throw new ForbiddenException("You do not have access to this property");
  }

  async addTenantAtProperty(
    user: RequestUser,
    propertyId: string,
    payload: CreateTenantPayloadDto,
  ) {
    await this.mustGetManagedProperty(user, propertyId);

    return this.prisma.$transaction(async (tx) => {
      // 1. Find or Create Base User Record
      const phoneToSearch = payload.phone.trim();
      let userRecord = await tx.user.findFirst({
        where: { phone: phoneToSearch },
      });

      if (!userRecord) {
        userRecord = await tx.user.create({
          data: {
            authUserId: `temp_${Date.now()}_${Math.random()
              .toString(36)
              .substring(7)}`,
            role: UserRole.TENANT,
            phone: phoneToSearch,
            email: payload.email?.toLowerCase().trim(),
            firstName: payload.name.trim().split(" ")[0],
            lastName: payload.name.trim().split(" ").slice(1).join(" "),
          },
        });
      }

      // 2. Find or Create Unit
      const unitName = payload.unitLabel.trim();
      let unit = await tx.unit.findFirst({
        where: { propertyId, name: unitName },
      });

      if (!unit) {
        unit = await tx.unit.create({
          data: {
            propertyId,
            name: unitName,
            monthlyRent: payload.rentAmount,
          },
        });
      }

      // 3. Find or Create Bed (Optional)
      let bedId: string | undefined;
      const bedLabel = payload.bedLabel?.trim();
      if (bedLabel) {
        let bed = await tx.bed.findFirst({
          where: { unitId: unit.id, label: bedLabel },
        });

        if (!bed) {
          bed = await tx.bed.create({
            data: {
              unitId: unit.id,
              label: bedLabel,
            },
          });
        }
        bedId = bed.id;
      }

      // 4. Create PG Tenant Specific Record
      const pgTenant = await tx.tenant.create({
        data: {
          userId: userRecord.id,
          unitId: unit.id,
          bedId,
          name: payload.name.trim(),
          phone: phoneToSearch,
          rentAmount: payload.rentAmount,
        },
      });

      if (bedId) {
        await tx.bed.update({
          where: { id: bedId },
          data: { tenantId: pgTenant.id },
        });
      }

      // 5. Create Root Lease connecting to User
      const startDate = new Date(payload.startDate);
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      const landlord = await tx.user.findUnique({ where: { id: user.id } });
      const hasTdsObligation = landlord?.isNRI || false;

      const lease = await tx.lease.create({
        data: {
          landlordId: user.id,
          propertyId,
          unitId: unit.id,
          tenantId: userRecord.id,
          monthlyRent: payload.rentAmount,
          securityDeposit: payload.depositAmount,
          startDate,
          endDate,
          dueDay: 1,
          status: LeaseStatus.ACTIVE,
          hasTdsObligation,
        },
      });

      // 6. Return exact payload required by Week 1 Spec
      return {
        leaseId: lease.id,
        tenant: {
          name: payload.name.trim(),
          phone: phoneToSearch,
        },
        unit: unit.name,
        bed: bedLabel,
        rentAmount: Number(lease.monthlyRent),
        startDate: lease.startDate,
        status: lease.status,
      };
    });
  }
}

const randomCode = (size: number) => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let output = "";
  for (let index = 0; index < size; index += 1) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return output;
};

const sanitizeAmenities = (input: string[] | undefined) =>
  (input ?? [])
    .map((entry) => entry.trim())
    .filter(
      (entry, index, list) => entry.length > 0 && list.indexOf(entry) === index,
    );
