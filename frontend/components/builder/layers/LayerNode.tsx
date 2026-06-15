// frontend/components/builder/layers/LayerNode.tsx

"use client";

import { BuilderNode, useBuilderState } from "../state/BuilderState";
import LayerIndent from "./LayerIndent";

export default function LayerNode({
  node,
  depth,
}: {
  node: BuilderNode;
  depth: number;
}) {
  const { selectedNodeId, setSelectedNodeId } = useBuilderState();

  const isSelected = selectedNodeId === node.id;

  return (
    <div>
      <div
        className={`flex items-center px-2 py-1 rounded cursor-pointer ${
          isSelected ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
        }`}
        onClick={() => setSelectedNodeId(node.id)}
      >
        <LayerIndent depth={depth} />
        <span className="text-sm">{node.type}</span>
      </div>

      {node.children?.length > 0 && (
        <div className="ml-2">
          {node.children.map((child) => (
            <LayerNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
