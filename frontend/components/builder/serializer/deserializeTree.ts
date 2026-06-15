// frontend/components/builder/serializer/deserializeTree.ts

import { BuilderNode } from "../state/BuilderState";
import { SerializedNode, SerializedTree } from "./types";

export function deserializeTree(data: SerializedTree): BuilderNode[] {
  return data.root.map(deserializeNode);
}

function deserializeNode(node: SerializedNode): BuilderNode {
  return {
    id: node.id,
    type: node.type,
    props: node.props || {},
    children: (node.children || []).map(deserializeNode),
  };
}
