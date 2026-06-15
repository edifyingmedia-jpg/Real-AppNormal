// frontend/components/builder/inspector/InspectorInputNumber.tsx

"use client";

export default function InspectorInputNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type="number"
        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
