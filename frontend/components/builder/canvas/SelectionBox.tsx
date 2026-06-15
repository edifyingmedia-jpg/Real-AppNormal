// frontend/components/builder/canvas/SelectionBox.tsx

"use client";

import { useEffect, useState } from "react";

export default function SelectionBox({ nodeId }: { nodeId: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const el = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (!el) return;

    const update = () => setRect(el.getBoundingClientRect());
    update();

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [nodeId]);

  if (!rect) return null;

  return (
    <div
      className="absolute border-2 border-blue-500 pointer-events-none"
      style={{
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      }}
    />
  );
}
