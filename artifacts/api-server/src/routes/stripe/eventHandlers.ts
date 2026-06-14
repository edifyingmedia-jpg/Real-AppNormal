import Stripe from "stripe";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getStripeCredentialsPublic } from "./stripeClient";
import { logger } from "../../lib/logger";

export async function handleStripeBusinessEvent(payload: Buffer, signature: string): Promise<void> {
  // ... (credentials logic remains the same)

  const stripe = new Stripe(creds.secretKey);

  // CORRECT: Use Stripe.Event
  let event: Stripe.Event; 
  try {
    event = stripe.webhooks.constructEvent(payload, signature, creds.webhookSecret);
  } catch (err: any) {
    // ...
  }

  switch (event.type) {
    case "checkout.session.completed": {
      // CORRECT: Use Stripe.Checkout.Session
      const session = event.data.object as Stripe.Checkout.Session;
      // ...
    }

    case "customer.subscription.deleted": {
      // CORRECT: Use Stripe.Subscription
      const subscription = event.data.object as Stripe.Subscription;
      // ...
    }

    case "customer.subscription.updated": {
      // CORRECT: Use Stripe.Subscription
      const subscription = event.data.object as Stripe.Subscription;
      // ...
    }
  }
}
