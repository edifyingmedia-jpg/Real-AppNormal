// frontend/components/builder/utils/useHotkeys.ts

"use client";

import { useEffect } from "react";

export function useHotkeys(map: Record<string, () => void>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = [];

      if (e.metaKey) key.push("Meta");
      if (e.ctrlKey) key.push("Ctrl");
      if (e.shiftKey) key.push("Shift");

      key.push(e.key);

      const combo = key.join("+");

      if (map[combo]) {
        e.preventDefault();
        map[combo]();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [map]);
}
