import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface LandlordContext {
  landlordName: string;
  properties: Array<{ id: string; name: string; city: string | null }>;
  subscriptionTier: string | null;
  currentMonth: {
    month: string;
    collectedAmount: number;
    collectedCount: number;
    pendingAmount: number;
    pendingCount: number;
    overdueAmount: number;
    overdueCount: number;
  };
}

interface CacheEntry {
  data: Pick<
    LandlordContext,
    "landlordName" | "properties" | "subscriptionTier"
  >;
  expiresAt: Date;
}

@Injectable()
export class LandlordContextService {
  private readonly logger = new Logger(LandlordContextService.name);
  private cache = new Map<string, CacheEntry>();

  constructor(private readonly prisma: PrismaService) {}

  async buildContext(landlordId: string): Promise<LandlordContext> {
    const [staticData, dynamicData] = await Promise.all([
      this.getStaticData(landlordId),
      this.getDynamicData(landlordId),
    ]);
    return { ...staticData, ...dynamicData };
  }

  private async getStaticData(
    landlordId: string,
  ): Promise<
    Pick<LandlordContext, "landlordName" | "properties" | "subscriptionTier">
  > {
    const cached = this.cache.get(landlordId);
    if (cached && new Date() < cached.expiresAt) {
      return cached.data;
    }

    const [user, properties] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: landlordId },
        select: {
          firstName: true,
          lastName: true,
          subscriptionTier: true,
        },
      }),
      this.prisma.property.findMany({
        where: { ownerId: landlordId },
        select: { id: true, name: true, city: true },
      }),
    ]);

    const data = {
      landlordName:
        `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Landlord",
      properties: properties.map((p) => ({
        id: p.id,
        name: p.name,
        city: p.city,
      })),
      subscriptionTier: user?.subscriptionTier ?? null,
    };

    this.cache.set(landlordId, {
      data,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    return data;
  }

  private async getDynamicData(landlordId: string): Promise<{
    currentMonth: LandlordContext["currentMonth"];
  }> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const landlordPropertyIds = await this.prisma.property
      .findMany({
        where: { ownerId: landlordId },
        select: { id: true },
      })
      .then((ps) => ps.map((p) => p.id));

    const [collected, pending, overdue] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          status: { in: ["PAID", "SUCCEEDED"] },
          dueDate: { gte: monthStart, lt: monthEnd },
          lease: { propertyId: { in: landlordPropertyIds } },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: "PENDING",
          dueDate: { gte: monthStart, lt: monthEnd },
          lease: { propertyId: { in: landlordPropertyIds } },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: "OVERDUE",
          lease: { propertyId: { in: landlordPropertyIds } },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    return {
      currentMonth: {
        month: now.toLocaleString("en-IN", { month: "long", year: "numeric" }),
        collectedAmount: Number(collected._sum.amount ?? 0),
        collectedCount: collected._count._all,
        pendingAmount: Number(pending._sum.amount ?? 0),
        pendingCount: pending._count._all,
        overdueAmount: Number(overdue._sum.amount ?? 0),
        overdueCount: overdue._count._all,
      },
    };
  }

  /** Invalidate cache for a landlord (call after payments recorded) */
  invalidate(landlordId: string): void {
    this.cache.delete(landlordId);
  }
}
