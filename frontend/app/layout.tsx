import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "AppNormal Builder",
  description: "Build full‑stack apps with AI"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-appnormal-bg text-white">{children}</body>
    </html>
  );
}
