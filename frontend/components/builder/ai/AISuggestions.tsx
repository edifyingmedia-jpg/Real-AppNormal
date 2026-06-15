// frontend/components/builder/ai/AISuggestions.tsx

"use client";

import { useState } from "react";

export default function AISuggestions() {
  const [suggestions] = useState<string[]>([
    "Add a hero section",
    "Insert a call-to-action button",
    "Improve layout spacing",
    "Generate a responsive grid",
  ]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">Suggestions</h3>

      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <div
            key={i}
            className="px-3 py-2 bg-gray-100 rounded-md text-sm cursor-pointer hover:bg-gray-200"
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}
