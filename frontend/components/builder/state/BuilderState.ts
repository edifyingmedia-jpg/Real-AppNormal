// frontend/components/builder/state/BuilderState.ts

"use client";

import { createContext, useContext, useState } from "react";

export type BuilderNode = {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: BuilderNode[];
};

type BuilderStateType = {
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  tree: BuilderNode[];
  setTree: (nodes: BuilderNode[]) => void;

  history: BuilderNode[][];
  setHistory: (h: BuilderNode[][]) => void;

  undo: () => void;
  redo: () => void;
};

const BuilderStateContext = createContext<BuilderStateType | null>(null);

export function BuilderStateProvider({ children }: { children: React.ReactNode }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [tree, setTree] = useState<BuilderNode[]>([]);
  const [history, setHistory] = useState<BuilderNode[][]>([]);
  const [future, setFuture] = useState<BuilderNode[][]>([]);

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setFuture([tree, ...future]);
    setTree(prev);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(future.slice(1));
    setHistory([...history, tree]);
    setTree(next);
  };

  return (
    <BuilderStateContext.Provider
      value={{
        selectedNodeId,
        setSelectedNodeId,
        tree,
        setTree,
        history,
        setHistory,
        undo,
        redo,
      }}
    >
      {children}
    </BuilderStateContext.Provider>
  );
}

export function useBuilderState() {
  const ctx = useContext(BuilderStateContext);
  if (!ctx) {
    throw new Error("useBuilderState must be used inside BuilderStateProvider");
  }
  return ctx;
}
