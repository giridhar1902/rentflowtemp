import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBedDto } from "./dto/create-bed.dto";

@Injectable()
export class BedsService {
  constructor(private readonly prisma: PrismaService) {}

  async createBed(userId: string, payload: CreateBedDto) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: payload.unitId },
      include: { property: true },
    });

    if (!unit) {
      throw new NotFoundException("Unit not found");
    }

    if (unit.property.ownerId !== userId) {
      throw new ForbiddenException(
        "You do not have permission to add beds to this unit",
      );
    }

    return this.prisma.bed.create({
      data: {
        unitId: payload.unitId,
        label: payload.label,
      },
    });
  }

  async listBeds(userId: string, unitId: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: { property: true },
    });

    if (!unit) {
      throw new NotFoundException("Unit not found");
    }

    if (unit.property.ownerId !== userId) {
      throw new ForbiddenException(
        "You do not have permission to view beds in this unit",
      );
    }

    return this.prisma.bed.findMany({
      where: { unitId },
      orderBy: { createdAt: "asc" },
    });
  }
}
