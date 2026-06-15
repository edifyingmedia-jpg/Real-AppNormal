// frontend/components/builder/zoom/ZoomProvider.tsx

"use client";

import { createContext, useContext } from "react";
import { useZoom } from "./useZoom";

const ZoomContext = createContext<any>(null);

export function ZoomProvider({ children }: { children: React.ReactNode }) {
  const zoom = useZoom();
  return <ZoomContext.Provider value={zoom}>{children}</ZoomContext.Provider>;
}

export function useZoomContext() {
  return useContext(ZoomContext);
}
