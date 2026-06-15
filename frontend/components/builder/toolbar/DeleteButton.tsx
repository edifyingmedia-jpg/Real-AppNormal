// frontend/components/builder/toolbar/DeleteButton.tsx

"use client";

import { useBuilderState } from "../state/BuilderState";
import { deleteNode } from "../commands/deleteNode";
import { pushHistory } from "../history/pushHistory";

export default function DeleteButton() {
  const { tree, setTree, selectedNodeId, history, setHistory } = useBuilderState();

  const handleDelete = () => {
    if (!selectedNodeId) return;

    setHistory(pushHistory(history, tree));
    setTree(deleteNode(tree, selectedNodeId));
  };

  return (
    <button
      onClick={handleDelete}
      className="px-2 py-1 text-sm border rounded-md hover:bg-red-50 text-red-600"
    >
      Delete
    </button>
  );
}
