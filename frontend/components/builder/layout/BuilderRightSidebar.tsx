// frontend/components/builder/layout/BuilderRightSidebar.tsx

"use client";

import InspectorPanel from "../inspector/InspectorPanel";

export default function BuilderRightSidebar() {
  return (
    <div className="w-72 h-full border-l border-gray-200 bg-white overflow-auto p-4">
      <InspectorPanel />
    </div>
  );
}
