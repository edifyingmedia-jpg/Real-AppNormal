// frontend/components/builder/inspector/InspectorInputSelect.tsx

"use client";

export default function InspectorInputSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-xs text-gray-500">{label}</label>
      <select
        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
