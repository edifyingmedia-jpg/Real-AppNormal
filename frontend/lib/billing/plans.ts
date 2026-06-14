// ===============================
// MEMBERSHIP PLANS (PAID + FREE)
// ===============================

export const MEMBERSHIP_PLANS = [
  {
    id: "free_tier",
    name: "Free Tier",
    price: 0,
    interval: "one_time",
    credits: 10, // one-time only
    priceId: null, // no Stripe checkout for free tier
    isFree: true,
  },
  {
    id: "creator_monthly",
    name: "Creator Monthly",
    price: 12.99,
    interval: "month",
    credits: 100,
    priceId: process.env.STRIPE_PRICE_CREATOR_MONTHLY!,
  },
  {
    id: "creator_yearly",
    name: "Creator Yearly",
    price: 129,
    interval: "year",
    credits: 1440, // 12 months + 20%
    priceId: process.env.STRIPE_PRICE_CREATOR_YEARLY!,
  },
  {
    id: "studio_monthly",
    name: "Studio Monthly",
    price: 29.99,
    interval: "month",
    credits: 500, // UPDATED
    priceId: process.env.STRIPE_PRICE_STUDIO_MONTHLY!,
  },
  {
    id: "studio_yearly",
    name: "Studio Yearly",
    price: 299,
    interval: "year",
    credits: 7200, // 12 months + 20%
    priceId: process.env.STRIPE_PRICE_STUDIO_YEARLY!,
  },
];

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
      return 500; // UPDATED

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
  if (userHasClaimedFreeTier) return 0;
  return 10; // one-time only
}
