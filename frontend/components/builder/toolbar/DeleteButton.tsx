"use client";

import { useBuilderState } from "../state/BuilderState";
import { deleteNode } from "../commands/deleteNode";
import { pushHistory } from "../history/pushHistory";

export default function DeleteButton() {
  const { tree, setTree, selectedNodeId, history, setHistory } = useBuilderState();

  const handleDelete = () => {
    if (!selectedNodeId) return;

    // Get the updated history stack
    const updatedHistory = pushHistory(history, tree);

    // FIX: Map the HistoryEntry objects to their inner tree structure 
    // to match the BuilderNode[][] type expected by setHistory.
    // Replace '.tree' with the actual property name if it differs (e.g., .nodes)
    setHistory(updatedHistory.map(entry => entry.tree));

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
