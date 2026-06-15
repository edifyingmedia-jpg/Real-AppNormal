// frontend/components/builder/layers/LayerTree.tsx

"use client";

import { useBuilderState } from "../state/BuilderState";
import LayerNode from "./LayerNode";

export default function LayerTree() {
  const { tree } = useBuilderState();

  return (
    <div className="space-y-1">
      {tree.map((node) => (
        <LayerNode key={node.id} node={node} depth={0} />
      ))}
    </div>
  );
}
