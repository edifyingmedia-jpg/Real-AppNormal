// frontend/app/api/credits/route.ts

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

    return NextResponse.json({
      remaining: getRemainingCredits(ledger),
      total: ledger.totalCredits,
      used: ledger.usedCredits,
      membershipPlan: ledger.membershipPlan,
      freeTierClaimed: ledger.freeTierClaimed,
    });
  } catch (err: any) {
    console.error("Credits API error:", err);
    return NextResponse.json(
      { error: "Failed to load credits" },
      { status: 500 }
    );
  }
}
