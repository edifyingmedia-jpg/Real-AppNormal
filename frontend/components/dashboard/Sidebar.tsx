// frontend/components/dashboard/Sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Billing", href: "/dashboard/billing" },
  { label: "Builder", href: "/dashboard/builder" },
  { label: "Workspace", href: "/dashboard/workspace" },
  { label: "Account", href: "/dashboard/account" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-8">AppNormal</h2>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-md text-sm font-medium transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
