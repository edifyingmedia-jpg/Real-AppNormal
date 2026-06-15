// frontend/components/builder/zoom/useZoom.ts

"use client";

import { useState } from "react";

export function useZoom() {
  const [zoom, setZoom] = useState(1);

  const zoomIn = () => setZoom((z) => Math.min(z + 0.1, 3));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.3));
  const resetZoom = () => setZoom(1);

  return { zoom, zoomIn, zoomOut, resetZoom };
}
