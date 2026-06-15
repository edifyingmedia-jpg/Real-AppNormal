// frontend/app/(dashboard)/layout.tsx

import "@/app/globals.css";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export const metadata = {
  title: "Dashboard – AppNormal",
  description: "Your AppNormal dashboard",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1">
        <Topbar />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
