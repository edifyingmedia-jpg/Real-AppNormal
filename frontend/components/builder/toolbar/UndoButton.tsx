// frontend/components/builder/toolbar/UndoButton.tsx

"use client";

import { useBuilderState } from "../state/BuilderState";
import { undo } from "../history/undo";

export default function UndoButton() {
  const { tree, setTree, history, setHistory } = useBuilderState();

  const handleUndo = () => {
    const result = undo(history, tree);
    setTree(result.tree);
    setHistory(result.history);
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
