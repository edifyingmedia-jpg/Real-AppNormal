// frontend/app/(dashboard)/billing/credits/page.tsx

"use client";

import { useCredits } from "@/frontend/lib/billing/useCredits";
import Link from "next/link";

export default function BillingCreditsPage() {
  const { credits, monthlyCredits, ledger } = useCredits();

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-semibold text-gray-900">Credits</h1>

      <p className="text-gray-600">
        View your available credits, monthly allocation, and usage history.
      </p>

      {/* Current Credit Balance */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Current Balance</h2>
        <p className="text-4xl font-bold text-blue-600">{credits}</p>
        <p className="text-gray-500 mt-1">
          {monthlyCredits.toLocaleString()} credits added monthly
        </p>

        <Link
          href="/dashboard/billing/upgrade"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Buy More Credits
        </Link>
      </div>

      {/* Ledger */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Credit History</h2>

        {ledger.length === 0 ? (
          <p className="text-gray-500 text-sm">No credit activity yet.</p>
        ) : (
          <div className="space-y-3">
            {ledger.map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-gray-100 pb-2"
              >
                <div>
                  <p className="font-medium text-gray-800">{entry.reason}</p>
                  <p className="text-xs text-gray-500">{entry.date}</p>
                </div>

                <p
                  className={`font-semibold ${
                    entry.amount > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {entry.amount > 0 ? "+" : ""}
                  {entry.amount}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
