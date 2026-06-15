"use client";

import { useBuilderState } from "../state/BuilderState";
import { duplicateNode } from "../commands/duplicateNode";
import { pushHistory } from "../history/pushHistory";

export default function DuplicateButton() {
  const { tree, setTree, selectedNodeId, history, setHistory } = useBuilderState();

  const handleDuplicate = () => {
    if (!selectedNodeId) return;

    // 1. Get the new history stack (HistoryEntry[])
    const updatedHistoryEntries = pushHistory(
      history.map(nodes => ({ tree: nodes })), 
      tree
    );

    // 2. Map back to BuilderNode[][] to satisfy setHistory's type requirements
    setHistory(updatedHistoryEntries.map(entry => entry.tree));
    
    setTree(duplicateNode(tree, selectedNodeId));
  };

  return (
    <button
      onClick={handleDuplicate}
      className="px-2 py-1 text-sm border rounded-md hover:bg-green-50 text-green-600"
    >
      Duplicate
    </button>
  );
}
