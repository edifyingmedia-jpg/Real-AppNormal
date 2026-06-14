"use client";

import { Suspense } from "react";
import BuilderInner from "./builder-inner";

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="text-white p-6">Loading workspace…</div>}>
      <BuilderInner />
    </Suspense>
  );
}
