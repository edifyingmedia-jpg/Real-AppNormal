// frontend/components/builder/history/pushHistory.ts

import { HistoryEntry } from "./types";
import { BuilderNode } from "../state/BuilderState";

export function pushHistory(
  history: HistoryEntry[],
  tree: BuilderNode[]
): HistoryEntry[] {
  return [...history, { tree: JSON.parse(JSON.stringify(tree)) }];
}
