// frontend/components/builder/BuilderContext.tsx

"use client";

import { createContext, useContext, useState } from "react";

const BuilderContext = createContext<any>(null);

export function BuilderProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"build" | "ai">("build");

  return (
    <BuilderContext.Provider value={{ mode, setMode }}>
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilderContext() {
  return useContext(BuilderContext);
}
