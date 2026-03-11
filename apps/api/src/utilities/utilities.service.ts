import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUtilityDto } from "./dto/create-utility.dto";
import { UtilitySplitMethod } from "@prisma/client";

@Injectable()
export class UtilitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async createUtility(userId: string, payload: CreateUtilityDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: payload.propertyId },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    if (property.ownerId !== userId) {
      throw new ForbiddenException(
        "You do not have permission to add utilities to this property",
      );
    }

    const utility = await this.prisma.utility.create({
      data: {
        propertyId: payload.propertyId,
        unitId: payload.unitId,
        type: payload.type,
        amount: payload.amount,
        billingMonth: payload.billingMonth,
        splitMethod: payload.splitMethod,
      },
    });

    if (payload.splitMethod === UtilitySplitMethod.PER_TENANT) {
      const tenants = await this.prisma.tenant.findMany({
        where: {
          isActive: true,
          unitId: payload.unitId ? payload.unitId : undefined,
          unit: payload.unitId ? undefined : { propertyId: payload.propertyId },
        },
      });

      if (tenants.length > 0) {
        const splitAmount = Number(payload.amount) / tenants.length;
        const splitsData = tenants.map((t) => ({
          utilityId: utility.id,
          tenantId: t.id,
          amount: splitAmount,
        }));
        await this.prisma.utilitySplit.createMany({
          data: splitsData,
        });
      }
    }

    return this.prisma.utility.findUnique({
      where: { id: utility.id },
      include: { splits: true },
    });
  }

  async listUtilities(userId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    if (property.ownerId !== userId) {
      throw new ForbiddenException(
        "You do not have permission to view utilities for this property",
      );
    }

    return this.prisma.utility.findMany({
      where: { propertyId },
      include: { splits: { include: { tenant: true } }, unit: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
