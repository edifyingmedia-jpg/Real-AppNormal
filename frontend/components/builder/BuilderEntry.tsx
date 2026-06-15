// frontend/components/builder/BuilderEntry.tsx

"use client";

import BuilderShell from "./layout/BuilderShell";
import "./utils/builder.css";

export default function BuilderEntry() {
  return (
    <div className="w-full h-screen overflow-hidden builder-scroll">
      <BuilderShell />
    </div>
  );
}
