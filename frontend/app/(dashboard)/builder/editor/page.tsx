// frontend/app/(dashboard)/builder/editor/page.tsx

"use client";

import { useSearchParams } from "next/navigation";

export default function BuilderEditorPage() {
  const params = useSearchParams();
  const appName = params.get("name") || "Untitled App";

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Builder — {appName}
        </h1>

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Save Project
        </button>
      </div>

      {/* Main Editor Layout */}
      <div className="flex flex-1 gap-4">
        {/* Left Sidebar */}
        <div className="w-64 border border-gray-200 rounded-lg bg-white shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-4">Components</h2>
          <p className="text-gray-500 text-sm">
            Component list will appear here.
          </p>
        </div>

        {/* Canvas */}
        <div className="flex-1 border border-gray-200 rounded-lg bg-white shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-4">Canvas</h2>
          <p className="text-gray-500 text-sm">
            The visual builder canvas will render here.
          </p>
        </div>

        {/* Inspector */}
        <div className="w-80 border border-gray-200 rounded-lg bg-white shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-4">Inspector</h2>
          <p className="text-gray-500 text-sm">
            Property editor will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
