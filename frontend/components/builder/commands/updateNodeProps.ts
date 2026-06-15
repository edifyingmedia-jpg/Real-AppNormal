// frontend/components/builder/commands/updateNodeProps.ts

import { BuilderNode } from "../state/BuilderState";

export function updateNodeProps(
  tree: BuilderNode[],
  targetId: string,
  newProps: Record<string, any>
): BuilderNode[] {
  return tree.map((node) => {
    if (node.id === targetId) {
      return { ...node, props: { ...node.props, ...newProps } };
    }

    if (node.children?.length) {
      return {
        ...node,
        children: updateNodeProps(node.children, targetId, newProps),
      };
    }

    return node;
  });
}
