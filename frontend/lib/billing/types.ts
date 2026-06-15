// frontend/lib/billing/types.ts

export interface CreditTransaction {
  id: string;
  type: "add" | "use";
  amount: number;
  timestamp: number;
  reason?: string;
}

export interface Ledger {
  userId: string;

  // Membership
  membershipPlan: string | null; // creator_monthly, studio_monthly, etc.
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

export interface MembershipPlan {
  id: string;
  name: string;
  priceId: string; // Stripe price ID
  credits: number;
  interval: "month" | "year";
}

export interface FreeTierState {
  claimed: boolean;
  creditsGiven: number;
  timestamp: number;
}
