// frontend/app/(dashboard)/billing/canceled/page.tsx

export default function BillingCanceledPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-red-600">
        Payment Canceled
      </h1>

      <p className="text-gray-700">
        Your checkout session was canceled. No changes were made to your
        subscription.
      </p>

      <a
        href="/dashboard/billing"
        className="inline-block px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition"
      >
        Return to Billing
      </a>
    </div>
  );
}
