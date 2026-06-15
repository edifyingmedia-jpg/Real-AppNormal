// frontend/components/builder/commands/deleteNode.ts

import { BuilderNode } from "../state/BuilderState";

export function deleteNode(
  tree: BuilderNode[],
  targetId: string
): BuilderNode[] {
  return tree
    .filter((node) => node.id !== targetId)
    .map((node) => {
      if (node.children?.length) {
        return { ...node, children: deleteNode(node.children, targetId) };
      }
      return node;
    });
}
