"use client";

export default function FreeTierCard({
  freeTierClaimed,
  loading,
  onClaim,
}: {
  freeTierClaimed: boolean;
  loading: boolean;
  onClaim: () => void;
}) {
  return (
    <section className="mb-10 p-6 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]">
      <h2 className="text-xl font-semibold mb-4">Free Tier</h2>

      {freeTierClaimed ? (
        <p className="text-sm text-lime-400 font-semibold">
          You already claimed your free credits.
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">
            Claim your one‑time 10 free credits.
          </p>

          <button
            onClick={onClaim}
            disabled={loading}
            className="px-4 py-2 rounded bg-lime-400 text-black text-sm font-semibold disabled:opacity-40"
          >
            {loading ? "Claiming…" : "Claim Free Credits"}
          </button>
        </>
      )}
    </section>
  );
}
