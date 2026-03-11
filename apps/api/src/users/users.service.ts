import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, User, UserRole } from "@prisma/client";
import { AuthClaims } from "../common/auth/auth-claims";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateMeDto } from "./dto/update-me.dto";
import { UpdateNriSettingsDto } from "./dto/update-nri-settings.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertFromAuthClaims(claims: AuthClaims): Promise<User> {
    const createRole = claims.role ?? UserRole.TENANT;
    const createData: Prisma.UserUncheckedCreateInput = {
      authUserId: claims.sub,
      email: claims.email,
      role: createRole,
    };
    const updateData: Prisma.UserUncheckedUpdateInput = {
      email: claims.email,
      isActive: true,
      ...(claims.role ? { role: claims.role } : {}),
    };

    return this.prisma.user.upsert({
      where: { authUserId: claims.sub },
      create: createData,
      update: updateData,
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        landlordProfile: true,
        tenantProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User profile not found");
    }

    return user;
  }

  async updateMe(userId: string, payload: UpdateMeDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        landlordProfile: true,
        tenantProfile: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("User profile not found");
    }

    const userData: Prisma.UserUpdateInput = {};

    if (payload.firstName !== undefined) {
      userData.firstName = payload.firstName.trim();
    }
    if (payload.lastName !== undefined) {
      userData.lastName = payload.lastName.trim();
    }
    if (payload.phone !== undefined) {
      userData.phone = payload.phone.trim();
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: userData,
    });

    if (
      existing.role === UserRole.LANDLORD &&
      payload.companyName !== undefined
    ) {
      await this.prisma.landlordProfile.upsert({
        where: { userId },
        create: {
          userId,
          companyName: payload.companyName.trim(),
        },
        update: {
          companyName: payload.companyName.trim(),
        },
      });
    }

    if (
      existing.role === UserRole.TENANT &&
      (payload.emergencyContactName !== undefined ||
        payload.emergencyContactPhone !== undefined)
    ) {
      await this.prisma.tenantProfile.upsert({
        where: { userId },
        create: {
          userId,
          emergencyContactName: payload.emergencyContactName?.trim(),
          emergencyContactPhone: payload.emergencyContactPhone?.trim(),
        },
        update: {
          emergencyContactName:
            payload.emergencyContactName !== undefined
              ? payload.emergencyContactName.trim()
              : undefined,
          emergencyContactPhone:
            payload.emergencyContactPhone !== undefined
              ? payload.emergencyContactPhone.trim()
              : undefined,
        },
      });
    }

    return this.getMe(userId);
  }

  async updateNriSettings(userId: string, payload: UpdateNriSettingsDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      throw new NotFoundException("User profile not found");
    }

    const userData: Prisma.UserUpdateInput = {};

    if (payload.isNRI !== undefined) userData.isNRI = payload.isNRI;
    if (payload.country !== undefined)
      userData.country = payload.country.trim();
    if (payload.timezone !== undefined)
      userData.timezone = payload.timezone.trim();
    if (payload.currency !== undefined)
      userData.currency = payload.currency.trim();
    if (payload.nroAccountFlag !== undefined)
      userData.nroAccountFlag = payload.nroAccountFlag;
    if (payload.poaHolderPhone !== undefined) {
      const phoneStr = payload.poaHolderPhone.trim();
      userData.poaHolderPhone = phoneStr;

      if (phoneStr) {
        const existingContact = await this.prisma.user.findFirst({
          where: { phone: phoneStr },
        });
        if (!existingContact) {
          await this.prisma.user.create({
            data: {
              authUserId: `proxy_${Date.now()}_${phoneStr}`,
              phone: phoneStr,
              role: "LOCAL_CONTACT",
              isActive: true,
              firstName: "Local",
              lastName: "Contact",
            },
          });
        }
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: userData,
    });

    return this.getMe(userId);
  }

  async setOnboardingRole(userId: string, role: UserRole) {
    if (role !== UserRole.LANDLORD && role !== UserRole.TENANT) {
      throw new ForbiddenException("Only landlord or tenant roles are allowed");
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        landlordProfile: true,
        tenantProfile: true,
        _count: {
          select: {
            propertiesOwned: true,
            leasesAsLandlord: true,
            leasesAsTenant: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException("User profile not found");
    }

    const hasExistingDomainLinks =
      existing._count.propertiesOwned > 0 ||
      existing._count.leasesAsLandlord > 0 ||
      existing._count.leasesAsTenant > 0;

    if (hasExistingDomainLinks && existing.role !== role) {
      throw new ForbiddenException(
        "Role cannot be changed after domain relationships exist",
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    if (role === UserRole.LANDLORD && !existing.landlordProfile) {
      await this.prisma.landlordProfile.create({
        data: {
          userId: userId,
        },
      });
    }

    if (role === UserRole.TENANT && !existing.tenantProfile) {
      await this.prisma.tenantProfile.create({
        data: {
          userId: userId,
        },
      });
    }

    return updated;
  }
}
