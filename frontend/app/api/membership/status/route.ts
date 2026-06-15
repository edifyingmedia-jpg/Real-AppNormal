// frontend/app/api/membership/status/route.ts

import { NextResponse } from "next/server";
import { loadLedger } from "@/lib/billing/saveLedger";
import { getRemainingCredits } from "@/lib/billing/creditLedger";

// NOTE:
// Replace this with your real auth system.
// For now, we simulate a logged-in user.
async function getUserIdFromAuth(): Promise<string | null> {
  // TODO: Replace with real authentication
  return "demo-user-123";
}

export async function GET() {
  try {
    const userId = await getUserIdFromAuth();

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const ledger = await loadLedger(userId);

    const remaining = getRemainingCredits(ledger);

    return NextResponse.json({
      membershipPlan: ledger.membershipPlan,       // creator_monthly, studio_yearly, null
      stripeCustomerId: ledger.stripeCustomerId,   // null if free tier only
      freeTierClaimed: ledger.freeTierClaimed,
      remainingCredits: remaining,
      totalCredits: ledger.totalCredits,
      usedCredits: ledger.usedCredits,
      isFreeTierOnly: ledger.membershipPlan === null,
      isActiveMember: ledger.membershipPlan !== null,
    });
  } catch (err: any) {
    console.error("Membership status error:", err);
    return NextResponse.json(
      { error: "Failed to load membership status" },
      { status: 500 }
    );
  }
}
