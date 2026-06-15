// ===============================
// MEMBERSHIP PLANS (PAID + FREE)
// ===============================

export const YEARLY_BONUS_MULTIPLIER = 1.2; // 20% bonus

export const PLANS = {
  free_tier: {
    id: "free_tier",
    name: "Free Tier",
    description: "Basic access with 10 one-time credits",
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    monthlyCredits: 0,
    yearlyCredits: 10,
    priceIdMonthly: null,
    priceIdYearly: null,
    isFree: true,
  },

  creator: {
    id: "creator",
    name: "Creator",
    description: "For individual creators",
    monthlyPriceCents: 1299,
    yearlyPriceCents: 12900,
    monthlyCredits: 100,
    yearlyCredits: 1440, // 12 months + 20%
    priceIdMonthly: process.env.STRIPE_PRICE_CREATOR_MONTHLY!,
    priceIdYearly: process.env.STRIPE_PRICE_CREATOR_YEARLY!,
  },

  studio: {
    id: "studio",
    name: "Studio",
    description: "For teams and power users",
    monthlyPriceCents: 2999,
    yearlyPriceCents: 29900,
    monthlyCredits: 500,
    yearlyCredits: 7200, // 12 months + 20%
    priceIdMonthly: process.env.STRIPE_PRICE_STUDIO_MONTHLY!,
    priceIdYearly: process.env.STRIPE_PRICE_STUDIO_YEARLY!,
  },
};

// ===============================
// CREDIT BUNDLES
// ===============================

export const CREDIT_BUNDLES = [
  {
    id: "credits_100",
    credits: 100,
    price: 7.99,
    priceId: process.env.STRIPE_PRICE_CREDITS_100!,
  },
  {
    id: "credits_200",
    credits: 200,
    price: 14.99,
    priceId: process.env.STRIPE_PRICE_CREDITS_200!,
  },
  {
    id: "credits_300",
    credits: 300,
    price: 21.99,
    priceId: process.env.STRIPE_PRICE_CREDITS_300!,
  },
];

// ===============================
// CREDIT GRANTING LOGIC
// ===============================

export function getCreditsForPriceId(priceId: string | null) {
  if (!priceId) return 0;

  switch (priceId) {
    case process.env.STRIPE_PRICE_CREATOR_MONTHLY:
      return 100;

    case process.env.STRIPE_PRICE_CREATOR_YEARLY:
      return 1440;

    case process.env.STRIPE_PRICE_STUDIO_MONTHLY:
      return 500;

    case process.env.STRIPE_PRICE_STUDIO_YEARLY:
      return 7200;

    case process.env.STRIPE_PRICE_CREDITS_100:
      return 100;

    case process.env.STRIPE_PRICE_CREDITS_200:
      return 200;

    case process.env.STRIPE_PRICE_CREDITS_300:
      return 300;

    default:
      return 0;
  }
}

// ===============================
// FREE TIER LOGIC
// ===============================

export function getFreeTierCredits(userHasClaimedFreeTier: boolean) {
  return userHasClaimedFreeTier ? 0 : 10;
}
