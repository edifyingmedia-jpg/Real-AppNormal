"use client";

export default function BundleCard({
  title,
  price,
  loading,
  onClick,
}: {
  title: string;
  price: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <div className="p-4 rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] hover:border-lime-400/40 transition">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-gray-400 mb-4">{price}</p>

      <button
        onClick={onClick}
        disabled={loading}
        className="px-3 py-1 rounded bg-lime-400 text-black text-xs font-semibold disabled:opacity-40"
      >
        {loading ? "Loading…" : "Buy Credits"}
      </button>
    </div>
  );
}
