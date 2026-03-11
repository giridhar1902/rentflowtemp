import { SetMetadata } from "@nestjs/common";
import { SubscriptionTier } from "@prisma/client";
import { REQUIRE_TIER_KEY } from "./subscription.guard";

export const RequireTier = (tier: SubscriptionTier) =>
  SetMetadata(REQUIRE_TIER_KEY, tier);
