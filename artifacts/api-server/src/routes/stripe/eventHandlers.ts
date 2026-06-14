import Stripe from "stripe";
// Explicitly import the type definitions to avoid namespace resolution issues
import type { Event, Checkout, Subscription } from "stripe";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getStripeCredentialsPublic } from "./stripeClient";
import { logger } from "../../lib/logger";

export async function handleStripeBusinessEvent(payload: Buffer, signature: string): Promise<void> {
  let creds: { secretKey: string; webhookSecret?: string };
  try {
    creds = await getStripeCredentialsPublic();
  } catch {
    logger.warn("Stripe not configured — skipping business event handling");
    return;
  }

  if (!creds.webhookSecret) {
    logger.warn("No webhook secret configured — skipping signature verification");
    return;
  }

  const stripe = new Stripe(creds.secretKey);

  // Using the explicitly imported 'Event' type
  let event: Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, creds.webhookSecret);
  } catch (err: any) {
    logger.error({ err: err.message }, "Webhook signature verification failed");
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      // Using the explicitly imported 'Checkout' type
      const session = event.data.object as Checkout.Session;
      const userId = session.client_reference_id ?? session.metadata?.userId;
      const tier = session.metadata?.tier;
      const credits = parseInt(session.metadata?.credits ?? "0", 10);

      if (!userId || !tier || !credits) {
        logger.warn({ userId, tier, credits }, "Missing metadata on completed checkout session");
        break;
      }

      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

      const updateFields: Record<string, any> = {
        creditsRemaining: sql`${usersTable.creditsRemaining} + ${credits}`,
      };
      if (tier !== "bundle") updateFields.tier = tier;
      if (customerId) updateFields.stripeCustomerId = customerId;
      if (subscriptionId) updateFields.stripeSubscriptionId = subscriptionId;

      await db.update(usersTable).set(updateFields).where(eq(usersTable.id, userId));
      break;
    }

    case "customer.subscription.deleted": {
      // Using the explicitly imported 'Subscription' type
      const subscription = event.data.object as Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

      await db
        .update(usersTable)
        .set({ tier: "free", stripeSubscriptionId: null })
        .where(eq(usersTable.stripeCustomerId, customerId));
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

      const metadata = subscription.metadata;
      const newTier = metadata?.tier;

      if (newTier && (newTier === "creator" || newTier === "studio")) {
        await db
          .update(usersTable)
          .set({ tier: newTier })
          .where(eq(usersTable.stripeCustomerId, customerId));
      }
      break;
    }
  }
}
