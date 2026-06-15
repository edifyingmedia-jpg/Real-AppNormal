// frontend/components/builder/canvas/NodeRenderer.tsx

"use client";

import { BuilderNode, useBuilderState } from "../state/BuilderState";

export default function NodeRenderer() {
  const { tree } = useBuilderState();

  return (
    <div className="w-full h-full">
      {tree.length === 0 ? (
        <p className="text-gray-400 text-sm text-center mt-10">
          Canvas is empty. Add components from the sidebar.
        </p>
      ) : (
        tree.map((node) => <RenderNode key={node.id} node={node} />)
      )}
    </div>
  );
}

function RenderNode({ node }: { node: BuilderNode }) {
  const { selectedNodeId, setSelectedNodeId } = useBuilderState();

  const isSelected = selectedNodeId === node.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
  };

  // Basic element mapping (expand later)
  const Element = node.type as keyof JSX.IntrinsicElements;

  return (
    <div
      onClick={handleClick}
      className={`relative ${
        isSelected ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <Element {...node.props}>
        {node.children?.map((child) => (
          <RenderNode key={child.id} node={child} />
        ))}
      </Element>
    </div>
  );
}
