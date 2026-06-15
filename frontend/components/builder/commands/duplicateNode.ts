// frontend/components/builder/commands/duplicateNode.ts

import { BuilderNode } from "../state/BuilderState";

export function duplicateNode(
  tree: BuilderNode[],
  targetId: string
): BuilderNode[] {
  const node = findNode(tree, targetId);
  if (!node) return tree;

  const clone = deepClone(node);

  return [...tree, clone];
}

function findNode(nodes: BuilderNode[], id: string): BuilderNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function deepClone(node: BuilderNode): BuilderNode {
  return {
    ...node,
    id: crypto.randomUUID(),
    children: node.children?.map((c) => deepClone(c)) || [],
  };
}
