import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./routes/stripe/stripeClient";
import app from "./app";
import { logger } from "./lib/logger";

// Run Stripe initialization once per cold start
let stripeInitialized = false;

async function initStripeOnce() {
  if (stripeInitialized) return;
  stripeInitialized = true;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.warn("DATABASE_URL not set — skipping Stripe init");
    return;
  }

  try {
    logger.info("Initializing Stripe schema...");
    await runMigrations({ databaseUrl });
    logger.info("Stripe schema ready");

    const stripeSync = await getStripeSync();

    const webhookBaseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : null;

    if (webhookBaseUrl) {
      logger.info("Setting up managed webhook...");
      const webhookResult = await stripeSync.findOrCreateManagedWebhook(
        `${webhookBaseUrl}/api/stripe/webhook`,
      );
      logger.info({ url: webhookResult?.url }, "Webhook configured");
    }

    logger.info("Syncing Stripe data...");
    stripeSync
      .syncBackfill()
      .then(() => logger.info("Stripe data synced"))
      .catch((err: any) =>
        logger.error({ err }, "Error syncing Stripe data"),
      );
  } catch (error) {
    logger.warn(
      { err: String(error) },
      "Stripe init skipped (integration may not be connected yet)",
    );
  }
}

// ⭐ Vercel Serverless Handler
export default async function handler(req, res) {
  await initStripeOnce();
  return app(req, res);
}
