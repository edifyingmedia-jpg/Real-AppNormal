// frontend/app/(dashboard)/billing/history/page.tsx

export default function BillingHistoryPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-gray-900">
        Billing History
      </h1>

      <p className="text-gray-600">
        View your past invoices, payments, and subscription activity.
      </p>

      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
        <p className="text-gray-500 text-sm">
          Billing history will appear here once Stripe webhooks are connected.
        </p>
      </div>
    </div>
  );
}
