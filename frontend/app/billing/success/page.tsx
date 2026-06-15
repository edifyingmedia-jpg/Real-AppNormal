"use client";

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-semibold text-lime-400 mb-4">
        Payment Successful
      </h1>

      <p className="text-gray-300 text-sm mb-6">
        Your purchase is complete. Your credits or membership have been updated.
      </p>

      <a
        href="/billing"
        className="px-4 py-2 rounded bg-lime-400 text-black text-sm font-semibold"
      >
        Return to Billing
      </a>
    </div>
  );
}
