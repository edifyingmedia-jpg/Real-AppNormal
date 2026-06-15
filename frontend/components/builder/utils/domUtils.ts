// frontend/components/builder/utils/domUtils.ts

export function getNodeRect(nodeId: string): DOMRect | null {
  const el = document.querySelector(`[data-node-id="${nodeId}"]`);
  if (!el) return null;
  return el.getBoundingClientRect();
}
