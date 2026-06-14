// frontend/lib/billing/saveLedger.ts

import { CreditLedger, createInitialLedger } from "./creditLedger";

// =====================================
// DATABASE ADAPTER (REPLACE WITH REAL DB)
// =====================================

// These are placeholder async functions.
// Replace them with your real DB logic (Supabase, Prisma, Mongo, etc.)

async function dbGetLedger(userId: string): Promise<CreditLedger | null> {
  // TODO: Replace with real DB fetch
  console.log("DB: get ledger for", userId);
  return null;
}

async function dbSaveLedger(ledger: CreditLedger): Promise<void> {
  // TODO: Replace with real DB write
  console.log("DB: save ledger", ledger);
}

// =====================================
// PUBLIC API
// =====================================

// Load or create a ledger
export async function loadLedger(userId: string): Promise<CreditLedger> {
  let ledger = await dbGetLedger(userId);

  if (!ledger) {
    ledger = createInitialLedger(userId);
    await dbSaveLedger(ledger);
  }

  return ledger;
}

// Save ledger after modifications
export async function saveLedger(ledger: CreditLedger): Promise<void> {
  ledger.updatedAt = Date.now();
  await dbSaveLedger(ledger);
}

// Attach Stripe customer ID to user
export async function attachStripeCustomerId(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  const ledger = await loadLedger(userId);

  ledger.stripeCustomerId = stripeCustomerId;
  await saveLedger(ledger);
}

// Update membership plan (creator_monthly, studio_yearly, etc.)
export async function updateMembershipPlan(
  userId: string,
  planId: string | null
): Promise<void> {
  const ledger = await loadLedger(userId);

  ledger.membershipPlan = planId;
  await saveLedger(ledger);
}

// Add credits (from Stripe webhook)
export async function addCreditsToUser(
  userId: string,
  amount: number
): Promise<void> {
  const ledger = await loadLedger(userId);

  ledger.totalCredits += amount;
  await saveLedger(ledger);
}

// Mark free tier as claimed
export async function markFreeTierClaimed(userId: string): Promise<void> {
  const ledger = await loadLedger(userId);

  ledger.freeTierClaimed = true;
  await saveLedger(ledger);
}
