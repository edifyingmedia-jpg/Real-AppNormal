"use client";

import { useBuilderState } from "../state/BuilderState";
import { undo } from "../history/undo"; // Assuming this is your undo command

export default function UndoButton() {
  const { history, setHistory, tree, setTree } = useBuilderState();

  const handleUndo = () => {
    // 1. Transform your BuilderNode[][] history into the HistoryEntry[] format
    const historyAsEntries = history.map((nodes) => ({ tree: nodes }));

    // 2. Perform the undo
    const result = undo(historyAsEntries, tree);

    // 3. Update state
    setTree(result.tree);
    
    // 4. Map back to BuilderNode[][] to satisfy setHistory type requirements
    setHistory(result.history.map((entry) => entry.tree));
  };

  return (
    <button
      onClick={handleUndo}
      className="px-2 py-1 text-sm border rounded-md hover:bg-gray-100"
    >
      Undo
    </button>
  );
}
