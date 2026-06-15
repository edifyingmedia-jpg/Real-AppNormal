// frontend/lib/billing/types.ts

// ===============================
// CREDIT TRANSACTIONS
// ===============================

export interface CreditTransaction {
  id: string;
  type: "add" | "use";
  amount: number;
  timestamp: number;
  reason?: string;
}

// ===============================
// LEDGER (USER CREDIT HISTORY)
// ===============================

export interface Ledger {
  userId: string;

  // Membership
  membershipPlan: string | null; // creator, studio, free_tier, etc.
  stripeCustomerId: string | null;

  // Credits
  totalCredits: number;
  usedCredits: number;
  transactions: CreditTransaction[];

  // Free tier
  freeTierClaimed: boolean;

  // Metadata
  createdAt: number;
  updatedAt: number;
}

// ===============================
// MEMBERSHIP PLAN (MATCHES PLANS IN plans.ts)
// ===============================

export interface MembershipPlan {
  id: string;
  name: string;
  description: string;          // ⭐ REQUIRED BY billing/upgrade/page.tsx
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  monthlyCredits: number;
  yearlyCredits: number;
  priceIdMonthly: string | null;
  priceIdYearly: string | null;
  isFree?: boolean;
}

// ===============================
// FREE TIER STATE
// ===============================

export interface FreeTierState {
  claimed: boolean;
  creditsGiven: number;
  timestamp: number;
}
