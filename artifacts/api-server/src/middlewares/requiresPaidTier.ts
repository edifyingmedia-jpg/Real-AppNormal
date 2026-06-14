import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const requiresPaidTier = async (req: any, res: any, next: any): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;

  if (!userId) {
    next();
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  if (user && user.tier === "free") {
    res.status(403).json({
      error: "Upgrade required",
      message: "Publish, GitHub push, and code download require a Creator or Studio plan.",
      tier: "free",
    });
    return;
  }

  next();
};
