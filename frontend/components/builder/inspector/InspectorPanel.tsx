// frontend/components/builder/inspector/InspectorPanel.tsx

"use client";

import { useBuilderState } from "../state/BuilderState";

export default function InspectorPanel() {
  const { selectedNodeId, tree, setTree, history, setHistory } = useBuilderState();

  const selectedNode = findNode(tree, selectedNodeId);

  const updateProp = (key: string, value: string) => {
    if (!selectedNodeId) return;

    // Save history for undo
    setHistory([...history, tree]);

    const updated = updateNode(tree, selectedNodeId, (node) => ({
      ...node,
      props: { ...node.props, [key]: value },
    }));

    setTree(updated);
  };

  if (!selectedNode) {
    return (
      <div className="text-gray-400 text-sm">
        Select a component on the canvas to edit its properties.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Inspector</h2>
        <p className="text-xs text-gray-500">Editing: {selectedNode.type}</p>
      </div>

      {/* Props Editor */}
      <div className="space-y-4">
        <h3 className="text-md font-semibold text-gray-700">Properties</h3>

        {Object.entries(selectedNode.props || {}).map(([key, value]) => (
          <div key={key} className="flex flex-col space-y-1">
            <label className="text-xs text-gray-500">{key}</label>
            <input
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              value={String(value)}
              onChange={(e) => updateProp(key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* -----------------------------
   Helpers
------------------------------ */

function findNode(nodes, id) {
  if (!id) return null;
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function updateNode(nodes, id, updater) {
  return nodes.map((node) => {
    if (node.id === id) {
      return updater(node);
    }
    if (node.children?.length) {
      return { ...node, children: updateNode(node.children, id, updater) };
    }
    return node;
  });
}
