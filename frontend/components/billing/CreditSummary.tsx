"use client";

export default function CreditSummary({
  remaining,
  total,
  used,
  loading,
}: {
  remaining: number;
  total: number;
  used: number;
  loading: boolean;
}) {
  return (
    <section className="mb-10 p-6 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]">
      <h2 className="text-xl font-semibold mb-4">Your Credits</h2>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading credits…</p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-lime-400">{remaining}</span>{" "}
            credits remaining
          </p>
          <p className="text-xs text-gray-500">
            Total: {total} • Used: {used}
          </p>
        </div>
      )}
    </section>
  );
}
