export const MEMBERSHIP_PLANS = [
  {
    id: "creator_monthly",
    name: "Creator Monthly",
    price: 12.99,
    interval: "month",
    priceId: process.env.STRIPE_PRICE_CREATOR_MONTHLY!,
  },
  {
    id: "creator_yearly",
    name: "Creator Yearly",
    price: 129,
    interval: "year",
    priceId: process.env.STRIPE_PRICE_CREATOR_YEARLY!,
  },
  {
    id: "studio_monthly",
    name: "Studio Monthly",
    price: 29.99,
    interval: "month",
    priceId: process.env.STRIPE_PRICE_STUDIO_MONTHLY!,
  },
  {
    id: "studio_yearly",
    name: "Studio Yearly",
    price: 299,
    interval: "year",
    priceId: process.env.STRIPE_PRICE_STUDIO_YEARLY!,
  },
];

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
