// frontend/app/(dashboard)/billing/settings/page.tsx

export default function BillingSettingsPage() {
  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-semibold text-gray-900">
        Billing Settings
      </h1>

      <p className="text-gray-600">
        Manage your payment method, billing email, and subscription settings.
      </p>

      {/* Payment Method */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Payment Method</h2>
        <p className="text-gray-500 mb-4">
          Update your credit card or payment details.
        </p>

        <form action="/api/billing/portal" method="POST">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Open Billing Portal
          </button>
        </form>
      </div>

      {/* Subscription */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Subscription</h2>
        <p className="text-gray-500 mb-4">
          View or change your current subscription plan.
        </p>

        <a
          href="/dashboard/billing"
          className="inline-block px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition"
        >
          Manage Subscription
        </a>
      </div>
    </div>
  );
}
