// frontend/components/builder/commands/moveNode.ts

import { BuilderNode } from "../state/BuilderState";
import { deleteNode } from "./deleteNode";

export function moveNode(
  tree: BuilderNode[],
  nodeId: string,
  newParentId: string | null
): BuilderNode[] {
  const node = findNode(tree, nodeId);
  if (!node) return tree;

  const withoutNode = deleteNode(tree, nodeId);

  return addToParent(withoutNode, newParentId, node);
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

function addToParent(
  tree: BuilderNode[],
  parentId: string | null,
  node: BuilderNode
): BuilderNode[] {
  if (!parentId) return [...tree, node];

  return tree.map((n) => {
    if (n.id === parentId) {
      return { ...n, children: [...(n.children || []), node] };
    }
    if (n.children?.length) {
      return { ...n, children: addToParent(n.children, parentId, node) };
    }
    return n;
  });
}
