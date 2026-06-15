// frontend/components/builder/zoom/ZoomOutButton.tsx

"use client";

import { useZoomContext } from "./ZoomProvider";

export default function ZoomOutButton() {
  const { zoomOut } = useZoomContext();

  return (
    <button
      onClick={zoomOut}
      className="px-2 py-1 text-sm border rounded-md hover:bg-gray-100"
    >
      –
    </button>
  );
}
