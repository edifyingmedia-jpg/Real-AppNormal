// frontend/app/api/membership/update/route.ts

import { NextResponse } from "next/server";
import {
  loadLedger,
  saveLedger,
  updateMembershipPlan,
  attachStripeCustomerId,
} from "@/lib/billing/saveLedger";

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

    const { planId, stripeCustomerId } = await req.json();

    if (!planId && !stripeCustomerId) {
      return NextResponse.json(
        { error: "Missing planId or stripeCustomerId" },
        { status: 400 }
      );
    }

    let ledger = await loadLedger(userId);

    // Attach Stripe customer ID if provided
    if (stripeCustomerId) {
      await attachStripeCustomerId(userId, stripeCustomerId);
      ledger.stripeCustomerId = stripeCustomerId;
    }

    // Update membership plan if provided
    if (planId !== undefined) {
      await updateMembershipPlan(userId, planId);
      ledger.membershipPlan = planId;
    }

    await saveLedger(ledger);

    return NextResponse.json({
      success: true,
      membershipPlan: ledger.membershipPlan,
      stripeCustomerId: ledger.stripeCustomerId,
    });
  } catch (err: any) {
    console.error("Membership update error:", err);
    return NextResponse.json(
      { error: "Failed to update membership" },
      { status: 500 }
    );
  }
}
