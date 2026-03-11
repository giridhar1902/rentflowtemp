import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTenant(userId: string, payload: CreateTenantDto) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: payload.unitId },
      include: { property: true },
    });

    if (!unit) {
      throw new NotFoundException("Unit not found");
    }

    if (unit.property.ownerId !== userId) {
      throw new ForbiddenException(
        "You do not have permission to add tenants to this unit",
      );
    }

    if (payload.bedId) {
      const bed = await this.prisma.bed.findUnique({
        where: { id: payload.bedId },
      });
      if (!bed || bed.unitId !== payload.unitId) {
        throw new BadRequestException("Invalid bed for this unit");
      }
      if (bed.tenantId) {
        throw new BadRequestException("Bed is already occupied");
      }
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        unitId: payload.unitId,
        bedId: payload.bedId,
        name: payload.name,
        phone: payload.phone,
        rentAmount: payload.rentAmount,
      },
    });

    if (payload.bedId) {
      await this.prisma.bed.update({
        where: { id: payload.bedId },
        data: { tenantId: tenant.id },
      });
    }

    return tenant;
  }

  async listTenants(userId: string, unitId: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: { property: true },
    });

    if (!unit) {
      throw new NotFoundException("Unit not found");
    }

    if (unit.property.ownerId !== userId) {
      throw new ForbiddenException(
        "You do not have permission to view tenants in this unit",
      );
    }

    return this.prisma.tenant.findMany({
      where: { unitId },
      orderBy: { createdAt: "desc" },
      include: { user: true, bed: true },
    });
  }

  async listTenantPayments(user: any, tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { unit: { include: { property: true } } },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");

    if (user.role === "TENANT" && tenant.userId !== user.id) {
      throw new ForbiddenException("You can only view your own payments");
    }
    if (user.role === "LANDLORD" && tenant.unit.property.ownerId !== user.id) {
      throw new ForbiddenException(
        "You do not have permission to view this tenant",
      );
    }

    if (!tenant.userId) return [];

    return this.prisma.offlineRentPayment.findMany({
      where: { tenantId: tenant.userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async listTenantUtilities(user: any, tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { unit: { include: { property: true } } },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");

    if (user.role === "TENANT" && tenant.userId !== user.id) {
      throw new ForbiddenException("You can only view your own utilities");
    }
    if (user.role === "LANDLORD" && tenant.unit.property.ownerId !== user.id) {
      throw new ForbiddenException(
        "You do not have permission to view this tenant",
      );
    }

    return this.prisma.utilitySplit.findMany({
      where: { tenantId: tenant.id },
      include: { utility: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteTenant(userId: string, tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { unit: { include: { property: true } } },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    if (tenant.unit.property.ownerId !== userId) {
      throw new ForbiddenException(
        "You do not have permission to remove this tenant",
      );
    }

    if (tenant.bedId) {
      await this.prisma.bed.update({
        where: { id: tenant.bedId },
        data: { tenantId: null },
      });
    }

    return this.prisma.tenant.delete({
      where: { id: tenantId },
    });
  }
}
