// frontend/components/builder/layout/BuilderLeftSidebar.tsx

"use client";

import LayerPanel from "../layers/LayerPanel";
import AIPanel from "../ai/AIPanel";

export default function BuilderLeftSidebar() {
  return (
    <div className="w-64 h-full border-r border-gray-200 bg-white flex flex-col overflow-auto">
      <LayerPanel />
      <div className="border-t border-gray-200 mt-4 pt-4">
        <AIPanel />
      </div>
    </div>
  );
}
