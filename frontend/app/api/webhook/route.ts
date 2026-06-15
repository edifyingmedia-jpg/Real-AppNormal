// frontend/app/api/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getCreditsForPriceId } from "@/lib/billing/credits";

// Required for Stripe webhooks in Next.js App Router
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST(req: NextRequest) {
  // Stripe requires the raw text body
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Stripe webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ============================
  // HANDLE STRIPE EVENTS
  // ============================

  switch (event.type) {
    // ------------------------------------
    // SUBSCRIPTION CREATED / RENEWED
    // ------------------------------------
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;

      const priceId = invoice.lines.data[0]?.price?.id;
      const customerId = invoice.customer?.toString();

      if (!priceId || !customerId) break;

      const credits = getCreditsForPriceId(priceId);

      // TODO: Replace with your DB logic
      console.log(`💰 Adding ${credits} credits to user with Stripe customer ${customerId}`);

      break;
    }

    // ------------------------------------
    // SUBSCRIPTION CANCELED
    // ------------------------------------
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer.toString();

      // TODO: Replace with your DB logic
      console.log(`⚠️ Subscription canceled for customer ${customerId}`);

      break;
    }

    // ------------------------------------
    // ONE-TIME CREDIT PURCHASE
    // ------------------------------------
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "payment") {
        const priceId = session.line_items?.data[0]?.price?.id;
        const customerId = session.customer?.toString();

        if (!priceId || !customerId) break;

        const credits = getCreditsForPriceId(priceId);

        // TODO: Replace with your DB logic
        console.log(`🟢 One-time purchase: ${credits} credits for ${customerId}`);
      }

      break;
    }

    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
