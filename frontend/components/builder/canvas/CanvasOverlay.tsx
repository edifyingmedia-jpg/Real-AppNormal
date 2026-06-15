// frontend/components/builder/canvas/CanvasOverlay.tsx

"use client";

import { useBuilderState } from "../state/BuilderState";
import SelectionBox from "./SelectionBox";

export default function CanvasOverlay() {
  const { selectedNodeId } = useBuilderState();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {selectedNodeId && <SelectionBox nodeId={selectedNodeId} />}
    </div>
  );
}
