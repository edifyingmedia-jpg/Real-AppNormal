// frontend/app/(dashboard)/billing/upgrade/page.tsx

"use client";

import { useSearchParams } from "next/navigation";
import { getPlan, getStripePriceId } from "@/frontend/lib/billing/utils";
import { PLANS } from "@/frontend/lib/billing/plans";

export default function UpgradePage() {
  const params = useSearchParams();
  const planId = params.get("plan");

  const plan = getPlan(planId);

  if (!plan) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Upgrade</h1>
        <p className="text-gray-600">Invalid plan selected.</p>
      </div>
    );
  }

  const monthlyPriceId = getStripePriceId(plan.id, "monthly");
  const yearlyPriceId = getStripePriceId(plan.id, "yearly");

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-gray-900">
        Upgrade to {plan.name}
      </h1>

      <p className="text-gray-600">{plan.description}</p>

      <div className="space-y-4">
        <form action="/api/checkout" method="POST">
          <input type="hidden" name="priceId" value={monthlyPriceId ?? ""} />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition"
          >
            Subscribe Monthly – ${(plan.monthlyPriceCents / 100).toFixed(2)}
          </button>
        </form>

        <form action="/api/checkout" method="POST">
          <input type="hidden" name="priceId" value={yearlyPriceId ?? ""} />
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition"
          >
            Subscribe Yearly – Save 20%
          </button>
        </form>
      </div>

      <p className="text-sm text-gray-500">
        You can cancel anytime. Your credits will update immediately after
        upgrading.
      </p>
    </div>
  );
}
