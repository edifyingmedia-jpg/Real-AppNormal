// frontend/components/builder/canvas/CanvasEvents.tsx

"use client";

import { useBuilderState } from "../state/BuilderState";

export default function CanvasEvents() {
  const { setSelectedNodeId } = useBuilderState();

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const id = target.getAttribute("data-node-id");
    if (id) {
      setSelectedNodeId(id);
    }
  };

  return (
    <div
      className="absolute inset-0"
      onClick={handleClick}
      style={{ pointerEvents: "auto" }}
    />
  );
}
