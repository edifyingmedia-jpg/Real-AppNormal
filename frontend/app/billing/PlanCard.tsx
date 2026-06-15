"use client";

export default function PlanCard({
  title,
  price,
  credits,
  active,
  loading,
  onClick,
}: {
  title: string;
  price: string;
  credits: string;
  active: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`p-4 rounded-lg border transition ${
        active
          ? "border-lime-400 bg-[#111]"
          : "border-[#1a1a1a] bg-[#0d0d0d] hover:border-lime-400/40"
      }`}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-gray-400">{price}</p>
      <p className="text-xs text-gray-500 mb-4">{credits}</p>

      {!active && (
        <button
          onClick={onClick}
          disabled={loading}
          className="px-3 py-1 rounded bg-lime-400 text-black text-xs font-semibold disabled:opacity-40"
        >
          {loading ? "Loading…" : "Upgrade"}
        </button>
      )}

      {active && (
        <p className="text-xs text-lime-400 font-semibold">Current Plan</p>
      )}
    </div>
  );
}
