// frontend/components/builder/Canvas.tsx

"use client";

import NodeRenderer from "./canvas/NodeRenderer";

export default function BuilderCanvas() {
  return (
    <div className="h-full w-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Canvas</h2>

      <div className="flex-1 border border-gray-200 rounded-lg bg-white shadow-sm p-4 overflow-auto">
        <NodeRenderer />
      </div>
    </div>
  );
}
