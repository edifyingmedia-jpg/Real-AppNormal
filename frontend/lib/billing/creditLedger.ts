// frontend/lib/billing/creditLedger.ts

import { FREE_TIER_CREDITS } from "./credits";

export interface CreditLedger {
  userId: string;
  stripeCustomerId: string | null;
  totalCredits: number;
  usedCredits: number;
  freeTierClaimed: boolean;
  membershipPlan: string | null; // creator_monthly, studio_monthly, etc.
  updatedAt: number;
}

// =====================================
// INITIAL LEDGER FOR NEW USERS
// =====================================

export function createInitialLedger(userId: string): CreditLedger {
  return {
    userId,
    stripeCustomerId: null,
    totalCredits: 0,
    usedCredits: 0,
    freeTierClaimed: false,
    membershipPlan: null,
    updatedAt: Date.now(),
  };
}

// =====================================
// APPLY FREE TIER (ONE TIME ONLY)
// =====================================

export function applyFreeTier(ledger: CreditLedger): CreditLedger {
  if (ledger.freeTierClaimed) return ledger;

  return {
    ...ledger,
    totalCredits: ledger.totalCredits + FREE_TIER_CREDITS,
    freeTierClaimed: true,
    updatedAt: Date.now(),
  };
}

// =====================================
// ADD CREDITS (FROM STRIPE)
// =====================================

export function addCredits(
  ledger: CreditLedger,
  amount: number,
  membershipPlan: string | null = null
): CreditLedger {
  return {
    ...ledger,
    totalCredits: ledger.totalCredits + amount,
    membershipPlan: membershipPlan ?? ledger.membershipPlan,
    updatedAt: Date.now(),
  };
}

// =====================================
// USE CREDITS
// =====================================

export function useCredits(
  ledger: CreditLedger,
  amount: number
): { ledger: CreditLedger; success: boolean } {
  const remaining = ledger.totalCredits - ledger.usedCredits;

  if (remaining < amount) {
    return { ledger, success: false };
  }

  return {
    ledger: {
      ...ledger,
      usedCredits: ledger.usedCredits + amount,
      updatedAt: Date.now(),
    },
    success: true,
  };
}

// =====================================
// GET REMAINING CREDITS
// =====================================

export function getRemainingCredits(ledger: CreditLedger): number {
  return ledger.totalCredits - ledger.usedCredits;
}
