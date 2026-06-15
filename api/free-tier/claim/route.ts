// frontend/app/api/free-tier/claim/route.ts

import { NextResponse } from "next/server";
import { loadLedger, saveLedger, markFreeTierClaimed } from "@/lib/billing/saveLedger";
import { applyFreeTier } from "@/lib/billing/creditLedger";
import { getRemainingCredits } from "@/lib/billing/creditLedger";

// NOTE:
// Replace this with your real auth system.
// For now, we simulate a logged-in user.
async function getUserIdFromAuth(): Promise<string | null> {
  // TODO: Replace with real authentication
  return "demo-user-123";
}

export async function POST() {
  try {
    const userId = await getUserIdFromAuth();

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    let ledger = await loadLedger(userId);

    if (ledger.freeTierClaimed) {
      return NextResponse.json(
        { error: "Free tier already claimed" },
        { status: 409 }
      );
    }

    // Apply free tier credits
    ledger = applyFreeTier(ledger);

    // Mark as claimed
    await markFreeTierClaimed(userId);

    // Save updated ledger
    await saveLedger(ledger);

    return NextResponse.json({
      success: true,
      remaining: getRemainingCredits(ledger),
      total: ledger.totalCredits,
      used: ledger.usedCredits,
      freeTierClaimed: true,
    });
  } catch (err: any) {
    console.error("Free tier claim error:", err);
    return NextResponse.json(
      { error: "Failed to claim free tier" },
      { status: 500 }
    );
  }
}
