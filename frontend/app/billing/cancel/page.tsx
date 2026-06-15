"use client";

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-semibold text-red-400 mb-4">
        Payment Canceled
      </h1>

      <p className="text-gray-300 text-sm mb-6">
        Your payment was canceled. No charges were made.
      </p>

      <a
        href="/billing"
        className="px-4 py-2 rounded bg-white text-black text-sm font-semibold"
      >
        Return to Billing
      </a>
    </div>
  );
}
