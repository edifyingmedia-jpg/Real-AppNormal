export default function BillingLayout({ children }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto py-12 px-6">
        {children}
      </div>
    </div>
  );
}
