// frontend/components/builder/history/undo.ts

import { HistoryEntry } from "./types";
import { BuilderNode } from "../state/BuilderState";

export function undo(
  history: HistoryEntry[],
  currentTree: BuilderNode[]
): { history: HistoryEntry[]; tree: BuilderNode[] } {
  if (history.length === 0) {
    return { history, tree: currentTree };
  }

  const last = history[history.length - 1];
  const newHistory = history.slice(0, -1);

  return {
    history: newHistory,
    tree: JSON.parse(JSON.stringify(last.tree)),
  };
}
