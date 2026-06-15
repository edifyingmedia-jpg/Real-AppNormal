// frontend/components/builder/zoom/ResetZoomButton.tsx

"use client";

import { useZoomContext } from "./ZoomProvider";

export default function ResetZoomButton() {
  const { resetZoom } = useZoomContext();

  return (
    <button
      onClick={resetZoom}
      className="px-2 py-1 text-sm border rounded-md hover:bg-gray-100"
    >
      Reset
    </button>
  );
}
