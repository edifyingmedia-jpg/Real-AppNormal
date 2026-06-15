// frontend/app/(dashboard)/builder/new/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";

export default function BuilderNewPage() {
  const [appName, setAppName] = useState("");

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-semibold text-gray-900">
        Create a New App
      </h1>

      <p className="text-gray-600">
        Name your project to begin building with AppNormal.
      </p>

      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm max-w-xl">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          App Name
        </label>

        <input
          type="text"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="My Awesome App"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />

        <Link
          href={
            appName.trim()
              ? `/dashboard/builder/workspace?name=${encodeURIComponent(appName)}`
              : "#"
          }
          className={`inline-block mt-4 px-4 py-2 rounded-md text-white transition ${
            appName.trim()
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Continue
        </Link>
      </div>
    </div>
  );
}
