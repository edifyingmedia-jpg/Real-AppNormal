"use client";

import { useEffect, useState } from "react";
import { useCredits } from "@/lib/billing/useCredits";

export default function BillingPage() {
  const {
    remaining,
    total,
    used,
    membershipPlan,
    freeTierClaimed,
    loading,
    refresh,
  } = useCredits();

  const [isClaiming, setIsClaiming] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);

  // -----------------------------
  // FREE TIER CLAIM
  // -----------------------------
  async function claimFreeTier() {
    try {
      setIsClaiming(true);
      const res = await fetch("/api/free-tier/claim", { method: "POST" });
      await refresh();
    } finally {
      setIsClaiming(false);
    }
  }

  // -----------------------------
  // STRIPE CHECKOUT
  // -----------------------------
  async function startCheckout(priceId: string) {
    try {
      setIsCheckingOut(priceId);

      const res = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setIsCheckingOut(null);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-semibold mb-6">Billing</h1>

      {/* -----------------------------
          CREDITS SUMMARY
      ------------------------------ */}
      <section className="mb-10 p-6 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]">
        <h2 className="text-xl font-semibold mb-4">Your Credits</h2>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading credits…</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-lime-400">{remaining}</span>{" "}
              credits remaining
            </p>
            <p className="text-xs text-gray-500">
              Total: {total} • Used: {used}
            </p>
          </div>
        )}
      </section>

      {/* -----------------------------
          FREE TIER
      ------------------------------ */}
      {!freeTierClaimed && (
        <section className="mb-10 p-6 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]">
          <h2 className="text-xl font-semibold mb-4">Free Tier</h2>
          <p className="text-sm text-gray-400 mb-4">
            Claim your one‑time 10 free credits.
          </p>

          <button
            onClick={claimFreeTier}
            disabled={isClaiming}
            className="px-4 py-2 rounded bg-lime-400 text-black text-sm font-semibold disabled:opacity-40"
          >
            {isClaiming ? "Claiming…" : "Claim Free Credits"}
          </button>
        </section>
      )}

      {/* -----------------------------
          MEMBERSHIP PLANS
      ------------------------------ */}
      <section className="mb-10 p-6 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]">
        <h2 className="text-xl font-semibold mb-4">Membership Plans</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Creator Monthly */}
          <PlanCard
            title="Creator Monthly"
            price="$12.99/mo"
            credits="100 credits"
            active={membershipPlan === "creator_monthly"}
            loading={isCheckingOut === "creator_monthly"}
            onClick={() =>
              startCheckout(process.env.NEXT_PUBLIC_PRICE_CREATOR_MONTHLY!)
            }
          />

          {/* Studio Monthly */}
          <PlanCard
            title="Studio Monthly"
            price="$29.99/mo"
            credits="500 credits"
            active={membershipPlan === "studio_monthly"}
            loading={isCheckingOut === "studio_monthly"}
            onClick={() =>
              startCheckout(process.env.NEXT_PUBLIC_PRICE_STUDIO_MONTHLY!)
            }
          />
        </div>
      </section>

      {/* -----------------------------
          CREDIT BUNDLES
      ------------------------------ */}
      <section className="p-6 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]">
        <h2 className="text-xl font-semibold mb-4">Buy Credits</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BundleCard
            title="100 Credits"
            price="$7.99"
            loading={isCheckingOut === "credits_100"}
            onClick={() =>
              startCheckout(process.env.NEXT_PUBLIC_PRICE_CREDITS_100!)
            }
          />

          <BundleCard
            title="200 Credits"
            price="$14.99"
            loading={isCheckingOut === "credits_200"}
            onClick={() =>
              startCheckout(process.env.NEXT_PUBLIC_PRICE_CREDITS_200!)
            }
          />

          <BundleCard
            title="300 Credits"
            price="$21.99"
            loading={isCheckingOut === "credits_300"}
            onClick={() =>
              startCheckout(process.env.NEXT_PUBLIC_PRICE_CREDITS_300!)
            }
          />
        </div>
      </section>
    </div>
  );
}

// --------------------------------------
// REUSABLE COMPONENTS
// --------------------------------------

function PlanCard({ title, price, credits, active, loading, onClick }) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        active ? "border-lime-400 bg-[#111]" : "border-[#1a1a1a] bg-[#0d0d0d]"
      }`}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-gray-400">{price}</p>
      <p className="text-xs text-gray-500 mb-4">{credits}</p>

      {!active && (
        <button
          onClick={onClick}
          disabled={loading}
          className="px-3 py-1 rounded bg-lime-400 text-black text-xs font-semibold disabled:opacity-40"
        >
          {loading ? "Loading…" : "Upgrade"}
        </button>
      )}

      {active && (
        <p className="text-xs text-lime-400 font-semibold">Current Plan</p>
      )}
    </div>
  );
}

function BundleCard({ title, price, loading, onClick }) {
  return (
    <div className="p-4 rounded-lg border border-[#1a1a1a] bg-[#0d0d0d]">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-gray-400 mb-4">{price}</p>

      <button
        onClick={onClick}
        disabled={loading}
        className="px-3 py-1 rounded bg-lime-400 text-black text-xs font-semibold disabled:opacity-40"
      >
        {loading ? "Loading…" : "Buy Credits"}
      </button>
    </div>
  );
}
