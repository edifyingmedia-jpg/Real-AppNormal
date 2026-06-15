// frontend/components/builder/layout/BuilderShell.tsx

"use client";

import BuilderToolbar from "../toolbar/BuilderToolbar";
import BuilderLeftSidebar from "./BuilderLeftSidebar";
import BuilderRightSidebar from "./BuilderRightSidebar";
import BuilderMain from "./BuilderMain";

export default function BuilderShell() {
  return (
    <div className="w-full h-full flex flex-col">
      <BuilderToolbar />

      <div className="flex flex-1 overflow-hidden">
        <BuilderLeftSidebar />
        <BuilderMain />
        <BuilderRightSidebar />
      </div>
    </div>
  );
}
