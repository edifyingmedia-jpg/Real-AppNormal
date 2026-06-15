# Billing System Overview

This folder contains the full billing engine for AppNormal, including:

- Membership plans
- Credit system
- Free tier logic
- Ledger storage
- Stripe checkout integration
- API utilities
- Frontend hooks

The billing system is intentionally modular so it can scale and swap storage engines easily.

---

## 📦 Ledger Structure

Each user has a ledger stored as JSON:

```ts
interface Ledger {
  userId: string;

  membershipPlan: string | null;
  stripeCustomerId: string | null;

  totalCredits: number;
  usedCredits: number;
  transactions: CreditTransaction[];

  freeTierClaimed: boolean;

  createdAt: number;
  updatedAt: number;
}
