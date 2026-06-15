"use client";

import { useBuilderState } from "../state/BuilderState";
import { deleteNode } from "../commands/deleteNode";
import { pushHistory } from "../history/pushHistory";

export default function DeleteButton() {
  const { tree, setTree, selectedNodeId, history, setHistory } = useBuilderState();

  const handleDelete = () => {
    if (!selectedNodeId) return;

    // 1. Transform your current BuilderNode[][] history into HistoryEntry[] 
    //    if necessary, or simply pass a mapped version if pushHistory expects objects.
    // 2. Wrap your current 'tree' in the structure pushHistory expects.
    
    // Assuming history is BuilderNode[][] and pushHistory expects HistoryEntry[]:
    const historyAsEntries = history.map(nodes => ({ tree: nodes }));
    
    // Add the current tree as a new entry
    const newHistoryEntries = pushHistory(historyAsEntries, tree);

    // 3. Extract the trees back out to satisfy your setHistory(BuilderNode[][]) requirement
    setHistory(newHistoryEntries.map(entry => entry.tree));
    
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
