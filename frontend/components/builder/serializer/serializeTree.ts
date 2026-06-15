// frontend/components/builder/serializer/serializeTree.ts

import { BuilderNode } from "../state/BuilderState";
import { SerializedNode, SerializedTree } from "./types";

export function serializeTree(tree: BuilderNode[]): SerializedTree {
  return {
    root: tree.map(serializeNode),
  };
}

function serializeNode(node: BuilderNode): SerializedNode {
  return {
    id: node.id,
    type: node.type,
    props: node.props || {},
    children: (node.children || []).map(serializeNode),
  };
}
