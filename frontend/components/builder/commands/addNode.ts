// frontend/components/builder/commands/addNode.ts

import { BuilderNode } from "../state/BuilderState";

export function addNode(
  tree: BuilderNode[],
  parentId: string | null,
  newNode: BuilderNode
): BuilderNode[] {
  if (!parentId) {
    return [...tree, newNode];
  }

  return tree.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children || []), newNode],
      };
    }

    if (node.children?.length) {
      return { ...node, children: addNode(node.children, parentId, newNode) };
    }

    return node;
  });
}
