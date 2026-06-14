// =====================================
// CREDIT RULES FOR ALL PLANS + BUNDLES
// =====================================

// Free tier: one-time 10 credits
export const FREE_TIER_CREDITS = 10;

// Membership plan credit amounts
export const MEMBERSHIP_CREDITS: Record<string, number> = {
  creator_monthly: 100,
  creator_yearly: 1440, // 12 months + 20%
  studio_monthly: 500,  // UPDATED
  studio_yearly: 7200,  // 12 months + 20%
};

// Credit bundles
export const BUNDLE_CREDITS: Record<string, number> = {
  credits_100: 100,
  credits_200: 200,
  credits_300: 300,
};

// =====================================
// STRIPE PRICE ID → CREDIT MAPPING
// =====================================

export function getCreditsForPriceId(priceId: string | null): number {
  if (!priceId) return 0;

  switch (priceId) {
    case process.env.STRIPE_PRICE_CREATOR_MONTHLY:
      return MEMBERSHIP_CREDITS.creator_monthly;

    case process.env.STRIPE_PRICE_CREATOR_YEARLY:
      return MEMBERSHIP_CREDITS.creator_yearly;

    case process.env.STRIPE_PRICE_STUDIO_MONTHLY:
      return MEMBERSHIP_CREDITS.studio_monthly;

    case process.env.STRIPE_PRICE_STUDIO_YEARLY:
      return MEMBERSHIP_CREDITS.studio_yearly;

    case process.env.STRIPE_PRICE_CREDITS_100:
      return BUNDLE_CREDITS.credits_100;

    case process.env.STRIPE_PRICE_CREDITS_200:
      return BUNDLE_CREDITS.credits_200;

    case process.env.STRIPE_PRICE_CREDITS_300:
      return BUNDLE_CREDITS.credits_300;

    default:
      return 0;
  }
}

// =====================================
// FREE TIER LOGIC
// =====================================

export function getFreeTierCredits(hasClaimed: boolean): number {
  return hasClaimed ? 0 : FREE_TIER_CREDITS;
}
