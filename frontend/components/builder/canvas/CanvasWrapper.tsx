// frontend/components/builder/canvas/CanvasWrapper.tsx

"use client";

import CanvasOverlay from "./CanvasOverlay";
import CanvasGrid from "./CanvasGrid";
import CanvasEvents from "./CanvasEvents";

export default function CanvasWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full h-full bg-white overflow-hidden">
      <CanvasGrid />
      <CanvasEvents />
      <CanvasOverlay />
      {children}
    </div>
  );
}
