"use client";

import { useBuilderState } from "../state/BuilderState";
import { deleteNode } from "../commands/deleteNode";
import { pushHistory } from "../history/pushHistory";

export default function DeleteButton() {
  const { tree, setTree, selectedNodeId, history, setHistory } = useBuilderState();

  const handleDelete = () => {
    if (!selectedNodeId) return;

    // Pass the existing history stack (BuilderNode[][]) and the current tree (BuilderNode[])
    // pushHistory should return the updated stack: BuilderNode[][]
    const newHistory = pushHistory(history, tree);

    setHistory(newHistory);
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
