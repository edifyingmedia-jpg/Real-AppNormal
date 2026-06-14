import { Router, type IRouter } from "express";
import { clerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../middlewares/requireAuth";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

router.get("/users/me", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;

  try {
    let [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      const email =
        clerkUser.emailAddresses[0]?.emailAddress ?? `${userId}@unknown.local`;

      [user] = await db
        .insert(usersTable)
        .values({ id: userId, email, tier: "free", creditsRemaining: 10 })
        .onConflictDoUpdate({
          target: usersTable.id,
          set: { email },
        })
        .returning();
    }

    res.json({
      id: user.id,
      email: user.email,
      tier: user.tier,
      creditsRemaining: user.creditsRemaining,
      stripeCustomerId: user.stripeCustomerId ?? null,
      stripeSubscriptionId: user.stripeSubscriptionId ?? null,
    });
  } catch (err: any) {
    logger.error({ err: err.message, userId }, "Failed to fetch/provision user");
    res.status(500).json({ error: "Failed to load user" });
  }
});

export default router;
