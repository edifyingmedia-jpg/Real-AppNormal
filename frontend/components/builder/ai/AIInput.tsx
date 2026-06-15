// frontend/components/builder/ai/AIInput.tsx

"use client";

import { useState } from "react";

export default function AIInput() {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (!value.trim()) return;
    console.log("AI request:", value);
    setValue("");
  };

  return (
    <div className="flex flex-col space-y-2">
      <textarea
        className="border border-gray-300 rounded-md p-2 text-sm"
        rows={3}
        placeholder="Ask AI to modify or generate components..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
      >
        Send to AI
      </button>
    </div>
  );
}
