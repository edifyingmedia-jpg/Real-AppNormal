import { htmlComponents } from "./html";
import { ComponentDefinition } from "./types";

// Registry now only includes htmlComponents
const registry: ComponentDefinition[] = [...htmlComponents];

export function resolveComponent(type: string): ComponentDefinition | null {
  return registry.find((c) => c.type === type) || null;
}
