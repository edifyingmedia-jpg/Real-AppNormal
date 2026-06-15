// lib/billing/credits.ts

import { CreditLedgerEntry } from "./types";

/**
 * Add credits to a user's balance.
 */
export function addCredits(
  current: number,
  amount: number
): number {
  return current + amount;
}

/**
 * Subtract credits safely.
 * Prevents negative balances.
 */
export function subtractCredits(
  current: number,
  amount: number
): number {
  return Math.max(0, current - amount);
}

/**
 * Validate whether a user has enough credits.
 */
export function hasEnoughCredits(
  current: number,
  required: number
): boolean {
  return current >= required;
}

/**
 * Create a ledger entry for credit activity.
 */
export function createLedgerEntry(
  userId: string,
  delta: number,
  reason: string
): CreditLedgerEntry {
  return {
    id: crypto.randomUUID(),
    userId,
    delta,
    reason,
    timestamp: Date.now()
  };
}
