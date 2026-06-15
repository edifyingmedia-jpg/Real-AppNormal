// frontend/components/builder/zoom/ZoomInButton.tsx

"use client";

import { useZoomContext } from "./ZoomProvider";

export default function ZoomInButton() {
  const { zoomIn } = useZoomContext();

  return (
    <button
      onClick={zoomIn}
      className="px-2 py-1 text-sm border rounded-md hover:bg-gray-100"
    >
      +
    </button>
  );
}
