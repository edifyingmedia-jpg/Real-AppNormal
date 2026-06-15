// frontend/components/builder/registry/resolve.ts

import { htmlComponents } from "./html";
import { customComponents } from "./custom";
import { ComponentDefinition } from "./types";

const registry: ComponentDefinition[] = [...htmlComponents, ...customComponents];

export function resolveComponent(type: string): ComponentDefinition | null {
  return registry.find((c) => c.type === type) || null;
}
