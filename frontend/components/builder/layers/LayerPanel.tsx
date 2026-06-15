// frontend/components/builder/layers/LayerPanel.tsx

"use client";

import LayerTree from "./LayerTree";

export default function LayerPanel() {
  return (
    <div className="w-full h-full overflow-auto p-3 space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">Layers</h2>
      <LayerTree />
    </div>
  );
}
