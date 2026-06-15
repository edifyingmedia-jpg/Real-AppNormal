// frontend/app/(dashboard)/billing/page.tsx

"use client";

import { PLANS } from "@/frontend/lib/billing/plans";
import { displayMonthlyPrice, displayYearlyPrice } from "@/frontend/lib/billing/utils";
import Link from "next/link";

export default function BillingPage() {
  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-semibold text-gray-900">Billing</h1>

      <p className="text-gray-600">
        Manage your subscription, credits, and payment details.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.values(PLANS).map((plan) => (
          <div
            key={plan.id}
            className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm"
          >
            <h2 className="text-xl font-semibold mb-2">{plan.name}</h2>

            <p className="text-gray-600 mb-4">{plan.description}</p>

            <div className="mb-4">
              <p className="text-lg font-medium text-gray-900">
                {displayMonthlyPrice(plan.id)} / month
              </p>
              <p className="text-sm text-gray-500">
                {displayYearlyPrice(plan.id)} / year (with bonus)
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700">
                {plan.monthlyCredits.toLocaleString()} credits / month
              </p>
            </div>

            <Link
              href={`/dashboard/billing/upgrade?plan=${plan.id}`}
              className="block text-center bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              Select Plan
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
