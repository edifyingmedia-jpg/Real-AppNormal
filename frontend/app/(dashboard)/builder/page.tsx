// frontend/app/(dashboard)/builder/page.tsx

"use client";

import Link from "next/link";

export default function BuilderDashboardPage() {
  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-semibold text-gray-900">
        App Builder
      </h1>

      <p className="text-gray-600">
        Create new apps, continue existing projects, and explore your workspace.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create New App */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Create a New App</h2>
          <p className="text-gray-500 mb-4">
            Start a fresh project using the AppNormal Builder.
          </p>

          <Link
            href="/dashboard/builder/new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Start Building
          </Link>
        </div>

        {/* Open Workspace */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Your Workspace</h2>
          <p className="text-gray-500 mb-4">
            Access your saved apps, drafts, and generated screens.
          </p>

          <Link
            href="/dashboard/workspace"
            className="inline-block px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition"
          >
            Open Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
