// frontend/components/builder/toolbar/RedoButton.tsx

"use client";

import { redo } from "../history/redo";

export default function RedoButton() {
  const handleRedo = () => {
    redo(); // placeholder
  };

  return (
    <button
      onClick={handleRedo}
      className="px-2 py-1 text-sm border rounded-md hover:bg-gray-100 opacity-50 cursor-not-allowed"
    >
      Redo
    </button>
  );
}
