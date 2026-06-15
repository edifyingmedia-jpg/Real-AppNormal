// frontend/app/api/credits/use/route.ts

import { NextResponse } from "next/server";
import { loadLedger, saveLedger } from "@/lib/billing/saveLedger";
import { useCredits as deductCredits } from "@/lib/billing/creditLedger";

// NOTE:
// Replace this with your real auth system.
// For now, we simulate a logged-in user.
async function getUserIdFromAuth(): Promise<string | null> {
  // TODO: Replace with real authentication
  return "demo-user-123";
}

export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromAuth();

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid credit amount" },
        { status: 400 }
      );
    }

    const ledger = await loadLedger(userId);

    // Attempt to deduct credits
    const { ledger: updatedLedger, success } = deductCredits(ledger, amount);

    if (!success) {
      return NextResponse.json(
        { error: "Not enough credits" },
        { status: 402 } // Payment Required
      );
    }

    await saveLedger(updatedLedger);

    return NextResponse.json({
      success: true,
      remaining: updatedLedger.totalCredits - updatedLedger.usedCredits,
    });
  } catch (err: any) {
    console.error("Credit deduction error:", err);
    return NextResponse.json(
      { error: "Failed to deduct credits" },
      { status: 500 }
    );
  }
}
