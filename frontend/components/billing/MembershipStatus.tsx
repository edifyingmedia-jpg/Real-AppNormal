"use client";

export default function MembershipStatus({
  membershipPlan,
  freeTierClaimed,
  stripeCustomerId,
  remainingCredits,
  loading,
}: {
  membershipPlan: string | null;
  freeTierClaimed: boolean;
  stripeCustomerId: string | null;
  remainingCredits: number;
  loading: boolean;
}) {
  const planLabel =
    membershipPlan === "creator_monthly"
      ? "Creator (Monthly)"
      : membershipPlan === "studio_monthly"
      ? "Studio (Monthly)"
      : membershipPlan === "creator_yearly"
      ? "Creator (Yearly)"
      : membershipPlan === "studio_yearly"
      ? "Studio (Yearly)"
      : "Free Tier";

  return (
    <section className="mb-10 p-6 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]">
      <h2 className="text-xl font-semibold mb-4">Membership Status</h2>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading membership…</p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-lime-400">{planLabel}</span>
          </p>

          {membershipPlan === null && (
            <p className="text-xs text-gray-500">
              You are currently on the free tier.
            </p>
          )}

          {membershipPlan !== null && (
            <p className="text-xs text-gray-500">
              Stripe Customer ID:{" "}
              {stripeCustomerId ? stripeCustomerId : "Not assigned"}
            </p>
          )}

          <p className="text-xs text-gray-500">
            Remaining Credits:{" "}
            <span className="text-lime-400 font-semibold">
              {remainingCredits}
            </span>
          </p>

          {freeTierClaimed ? (
            <p className="text-xs text-lime-400 font-semibold">
              Free tier claimed
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Free tier not yet claimed
            </p>
          )}
        </div>
      )}
    </section>
  );
}
