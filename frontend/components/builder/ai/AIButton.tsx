// frontend/components/builder/ai/AIButton.tsx

"use client";

export default function AIButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 text-sm border rounded-md hover:bg-gray-100"
    >
      AI
    </button>
  );
}
