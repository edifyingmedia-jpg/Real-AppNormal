// frontend/lib/billing/utils.ts

import { PLANS, YEARLY_BONUS_MULTIPLIER } from "./plans";
import type { MembershipPlan } from "./types";

/**
 * Format cents → USD string
 * Example: 1299 → "$12.99"
 */
export function formatUSD(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Calculate yearly price with bonus applied.
 * Example: monthly $10 → yearly $96 (20% bonus)
 */
export function calculateYearlyPrice(monthlyCents: number): number {
  return Math.round(monthlyCents * 12 * YEARLY_BONUS_MULTIPLIER);
}

/**
 * Get plan object safely.
 */
export function getPlan(planId: string | null): MembershipPlan | null {
  if (!planId) return null;
  return PLANS[planId] ?? null;
}

/**
 * Determine if a user can upgrade from plan A → B.
 */
export function canUpgrade(current: string | null, target: string): boolean {
  if (!current) return true;
  const currentRank = PLANS[current]?.rank ?? 0;
  const targetRank = PLANS[target]?.rank ?? 0;
  return targetRank > currentRank;
}

/**
 * Determine if a user can downgrade from plan A → B.
 */
export function canDowngrade(current: string | null, target: string): boolean {
  if (!current) return false;
  const currentRank = PLANS[current]?.rank ?? 0;
  const targetRank = PLANS[target]?.rank ?? 0;
  return targetRank < currentRank;
}

/**
 * Calculate remaining credits.
 */
export function calculateRemainingCredits(total: number, used: number): number {
  return Math.max(0, total - used);
}

/**
 * Calculate percentage of credits used.
 */
export function creditUsagePercent(total: number, used: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

/**
 * Get Stripe price ID for a plan (monthly or yearly).
 */
export function getStripePriceId(
  planId: string,
  billingInterval: "monthly" | "yearly"
): string | null {
  const plan = PLANS[planId];
  if (!plan) return null;

  return billingInterval === "monthly"
    ? plan.stripeMonthlyPriceId
    : plan.stripeYearlyPriceId;
}

/**
 * Convert a plan’s monthly price into a readable string.
 */
export function displayMonthlyPrice(planId: string): string {
  const plan = PLANS[planId];
  if (!plan) return "$0.00";
  return formatUSD(plan.monthlyPriceCents);
}

/**
 * Convert a plan’s yearly price into a readable string.
 */
export function displayYearlyPrice(planId: string): string {
  const plan = PLANS[planId];
  if (!plan) return "$0.00";
  return formatUSD(calculateYearlyPrice(plan.monthlyPriceCents));
}

/**
 * Human-readable credit amount.
 */
export function formatCredits(credits: number): string {
  return `${credits.toLocaleString()} credits`;
}

/**
 * Compare two plans and return a diff object.
 */
export function comparePlans(a: string, b: string) {
  const planA = PLANS[a];
  const planB = PLANS[b];

  if (!planA || !planB) return null;

  return {
    priceDifferenceMonthly:
      planB.monthlyPriceCents - planA.monthlyPriceCents,

    priceDifferenceYearly:
      calculateYearlyPrice(planB.monthlyPriceCents) -
      calculateYearlyPrice(planA.monthlyPriceCents),

    creditDifference: planB.monthlyCredits - planA.monthlyCredits,

    rankDifference: planB.rank - planA.rank,
  };
}

/**
 * Determine if a plan is free tier.
 */
export function isFreePlan(planId: string | null): boolean {
  if (!planId) return true;
  return PLANS[planId]?.monthlyPriceCents === 0;
}
