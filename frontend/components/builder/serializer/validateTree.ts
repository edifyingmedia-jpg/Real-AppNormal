// frontend/components/builder/serializer/validateTree.ts

import { SerializedTree, SerializedNode } from "./types";

export function validateTree(tree: SerializedTree): boolean {
  if (!tree || !Array.isArray(tree.root)) return false;

  return tree.root.every(validateNode);
}

function validateNode(node: SerializedNode): boolean {
  if (!node.id || !node.type) return false;
  if (typeof node.props !== "object") return false;
  if (!Array.isArray(node.children)) return false;

  return node.children.every(validateNode);
}
