// frontend/components/builder/utils/treeUtils.ts

import { BuilderNode } from "../state/BuilderState";

export function findNode(nodes: BuilderNode[], id: string): BuilderNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function cloneNode(node: BuilderNode): BuilderNode {
  return {
    ...node,
    id: crypto.randomUUID(),
    children: node.children?.map(cloneNode) || [],
  };
}
