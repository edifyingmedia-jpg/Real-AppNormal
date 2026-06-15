// frontend/components/dashboard/Topbar.tsx

"use client";

import { useState } from "react";

export default function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <h1 className="text-lg font-semibold text-gray-900">
        AppNormal Dashboard
      </h1>

      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition text-gray-700"
        >
          <span className="font-medium">Account</span>
          <svg
            className={`w-4 h-4 transition-transform ${
              menuOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg py-2 z-20">
            <a
              href="/dashboard/account"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Profile
            </a>
            <a
              href="/dashboard/billing"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Billing
            </a>
            <a
              href="/logout"
              className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Log out
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
