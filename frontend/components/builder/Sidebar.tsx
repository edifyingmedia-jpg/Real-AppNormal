// frontend/components/builder/Sidebar.tsx

"use client";

import ComponentList from "./sidebar/ComponentList";

export default function BuilderSidebar() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Sidebar</h2>

      <ComponentList />
    </div>
  );
}
