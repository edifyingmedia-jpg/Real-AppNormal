// frontend/components/builder/layout/BuilderMain.tsx

"use client";

import { ZoomProvider } from "../zoom/ZoomProvider";
import CanvasWrapper from "../canvas/CanvasWrapper";
import NodeRenderer from "../canvas/NodeRenderer";

export default function BuilderMain() {
  return (
    <div className="flex-1 relative bg-gray-50">
      <ZoomProvider>
        <CanvasWrapper>
          <NodeRenderer />
        </CanvasWrapper>
      </ZoomProvider>
    </div>
  );
}
