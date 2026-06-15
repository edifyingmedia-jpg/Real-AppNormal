// frontend/components/builder/EditorShell.tsx

"use client";

import BuilderSidebar from "./Sidebar";
import BuilderCanvas from "./Canvas";
import BuilderInspector from "./Inspector";

export default function EditorShell({ appName }: { appName: string }) {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-white">
        <h1 className="text-xl font-semibold text-gray-900">
          Builder — {appName}
        </h1>

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Save Project
        </button>
      </div>

      {/* Main Editor Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-white p-4 overflow-y-auto">
          <BuilderSidebar />
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gray-50 p-4 overflow-auto">
          <BuilderCanvas />
        </div>

        {/* Inspector */}
        <div className="w-80 border-l border-gray-200 bg-white p-4 overflow-y-auto">
          <BuilderInspector />
        </div>
      </div>
    </div>
  );
}
