// frontend/app/(dashboard)/builder/workspace/page.tsx

"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function BuilderWorkspacePage() {
  const params = useSearchParams();
  const appName = params.get("name") || "Untitled App";

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-semibold text-gray-900">
        Workspace: {appName}
      </h1>

      <p className="text-gray-600">
        This is your project workspace. Soon you’ll be able to generate screens,
        edit layouts, and build your full application using the AppNormal Builder.
      </p>

      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm max-w-2xl">
        <h2 className="text-xl font-semibold mb-2">Project Overview</h2>
        <p className="text-gray-500 mb-4">
          Your project <span className="font-medium">{appName}</span> is ready.
          Continue to the Builder to start creating screens and components.
        </p>

        <Link
          href={`/dashboard/builder/editor?name=${encodeURIComponent(appName)}`}
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Open Builder
        </Link>
      </div>
    </div>
  );
}
