import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUnitDto } from "./dto/create-unit.dto";

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async createUnit(userId: string, payload: CreateUnitDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: payload.propertyId },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    if (property.ownerId !== userId) {
      throw new ForbiddenException(
        "You do not have permission to add units to this property",
      );
    }

    return this.prisma.unit.create({
      data: {
        propertyId: payload.propertyId,
        name: payload.name,
        floor: payload.floor,
        meterNumber: payload.meterNumber,
        status: "VACANT",
        monthlyRent: 0,
      },
    });
  }

  async listUnits(userId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    if (property.ownerId !== userId) {
      throw new ForbiddenException(
        "You do not have permission to view units for this property",
      );
    }

    return this.prisma.unit.findMany({
      where: { propertyId },
      orderBy: { createdAt: "asc" },
    });
  }
}
