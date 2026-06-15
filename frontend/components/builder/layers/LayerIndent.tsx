// frontend/components/builder/layers/LayerIndent.tsx

"use client";

export default function LayerIndent({ depth }: { depth: number }) {
  return (
    <div
      className="mr-2"
      style={{
        width: depth * 12,
        minWidth: depth * 12,
      }}
    />
  );
}
