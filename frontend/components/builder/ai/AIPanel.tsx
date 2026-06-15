// frontend/components/builder/ai/AIPanel.tsx

"use client";

import AISuggestions from "./AISuggestions";
import AIInput from "./AIInput";

export default function AIPanel() {
  return (
    <div className="w-full h-full flex flex-col p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">AI Assist</h2>
      <AISuggestions />
      <AIInput />
    </div>
  );
}
