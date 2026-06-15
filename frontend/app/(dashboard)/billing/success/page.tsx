// frontend/app/(dashboard)/billing/success/page.tsx

export default function BillingSuccessPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-green-600">
        Payment Successful
      </h1>

      <p className="text-gray-700">
        Your subscription has been activated. Your credits and plan benefits are now updated.
      </p>

      <a
        href="/dashboard/billing"
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        Return to Billing
      </a>
    </div>
  );
}
