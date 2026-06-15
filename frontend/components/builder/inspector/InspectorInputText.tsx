// frontend/components/builder/inspector/InspectorInputText.tsx

"use client";

export default function InspectorInputText({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type="text"
        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
