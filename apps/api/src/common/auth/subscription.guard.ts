import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { SubscriptionTier } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

const TIER_HIERARCHY = {
  [SubscriptionTier.FREE]: 0,
  [SubscriptionTier.LOCAL_PRO]: 1,
  [SubscriptionTier.NRI_ESSENTIAL]: 2,
  [SubscriptionTier.NRI_PREMIUM]: 3,
};

export const REQUIRE_TIER_KEY = "requireTier";

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredTier = this.reflector.getAllAndOverride<SubscriptionTier>(
      REQUIRE_TIER_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredTier) {
      return true; // No specific tier required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by AuthGuard

    if (!user || (!user.id && !user.sub)) {
      return false; // Authentication is required first
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id || user.sub },
    });

    if (!dbUser) {
      return false;
    }

    const userTier = dbUser.subscriptionTier;

    // Check if user's tier is greater than or equal to required tier
    if (TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier]) {
      return true;
    }

    // If tier is too low, throw 402 Payment Required
    throw new HttpException(
      {
        error: "UPGRADE_REQUIRED",
        message: `This feature requires ${requiredTier} plan`,
        upgradeUrl: `${process.env.APP_BASE_URL || "http://localhost:5173"}/upgrade`,
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
