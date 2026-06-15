// frontend/components/builder/inspector/InspectorInputBoolean.tsx

"use client";

export default function InspectorInputBoolean({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
    </div>
  );
}
