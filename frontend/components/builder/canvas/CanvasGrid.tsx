// frontend/components/builder/canvas/CanvasGrid.tsx

"use client";

export default function CanvasGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundSize: "20px 20px",
        backgroundImage:
          "linear-gradient(to right, #f3f3f3 1px, transparent 1px), linear-gradient(to bottom, #f3f3f3 1px, transparent 1px)",
      }}
    />
  );
}
