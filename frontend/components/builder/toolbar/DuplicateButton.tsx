// frontend/components/builder/toolbar/DuplicateButton.tsx

"use client";

import { useBuilderState } from "../state/BuilderState";
import { duplicateNode } from "../commands/duplicateNode";
import { pushHistory } from "../history/pushHistory";

export default function DuplicateButton() {
  const { tree, setTree, selectedNodeId, history, setHistory } = useBuilderState();

  const handleDuplicate = () => {
    if (!selectedNodeId) return;

    setHistory(pushHistory(history, tree));
    setTree(duplicateNode(tree, selectedNodeId));
  };

  return (
    <button
      onClick={handleDuplicate}
      className="px-2 py-1 text-sm border rounded-md hover:bg-gray-100"
    >
      Duplicate
    </button>
  );
}
