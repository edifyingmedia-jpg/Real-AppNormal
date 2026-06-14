import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { stripeService } from "./stripeService";
import { requireAuth } from "../../middlewares/requireAuth";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

router.get("/stripe/products-with-prices", async (_req, res) => {
  try {
    const result = await db.execute(sql`
      WITH paginated_products AS (
        SELECT id, name, description, metadata, active
        FROM stripe.products
        WHERE active = true
        ORDER BY id
      )
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.metadata as product_metadata,
        pr.id as price_id,
        pr.unit_amount,
        pr.currency,
        pr.recurring,
        pr.active as price_active,
        pr.metadata as price_metadata
      FROM paginated_products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      ORDER BY p.id, pr.unit_amount
    `);

    const productsMap = new Map<string, any>();
    for (const row of result.rows as any[]) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          metadata: row.product_metadata,
          prices: [],
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
          metadata: row.price_metadata,
        });
      }
    }

    res.json({ data: Array.from(productsMap.values()) });
  } catch (err) {
    logger.error({ err }, "Failed to fetch products");
    res.json({ data: [] });
  }
});

router.post("/stripe/checkout", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;
  const { priceId, returnOrigin } = req.body;

  if (!priceId) {
    res.status(400).json({ error: "priceId is required" });
    return;
  }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer(user.email, userId);
      await db
        .update(usersTable)
        .set({ stripeCustomerId: customer.id })
        .where(eq(usersTable.id, userId));
      customerId = customer.id;
    }

    const stripePrice = await stripeService.getPrice(priceId);
    const isRecurring = stripePrice.type === "recurring";
    const mode: "subscription" | "payment" = isRecurring ? "subscription" : "payment";

    const priceMeta = (stripePrice.metadata as Record<string, string>) ?? {};
    const tier = priceMeta.tier ?? "bundle";
    const credits = parseInt(priceMeta.credits ?? "0", 10);

    const origin =
      returnOrigin ??
      (process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : `${req.protocol}://${req.get("host")}`);

    const session = await stripeService.createCheckoutSession({
      customerId,
      priceId,
      mode,
      successUrl: `${origin}/checkout/success`,
      cancelUrl: `${origin}/`,
      userId,
      tier,
      credits,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    logger.error({ err: err.message }, "Checkout session creation failed");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.post("/stripe/portal", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;
  const { returnOrigin } = req.body;

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user?.stripeCustomerId) {
      res.status(400).json({ error: "No billing account found" });
      return;
    }

    const origin =
      returnOrigin ??
      (process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : `${req.protocol}://${req.get("host")}`);

    const portalSession = await stripeService.createCustomerPortalSession(
      user.stripeCustomerId,
      origin,
    );

    res.json({ url: portalSession.url });
  } catch (err: any) {
    logger.error({ err: err.message }, "Portal session creation failed");
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

router.get("/stripe/subscription", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user?.stripeSubscriptionId) { res.json({ subscription: null }); return; }

    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${user.stripeSubscriptionId}`,
    );
    res.json({ subscription: result.rows[0] ?? null });
  } catch {
    res.json({ subscription: null });
  }
});

export default router;
