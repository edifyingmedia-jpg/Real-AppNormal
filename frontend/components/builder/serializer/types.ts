// frontend/components/builder/serializer/types.ts

import { BuilderNode } from "../state/BuilderState";

export interface SerializedNode {
  id: string;
  type: string;
  props: Record<string, any>;
  children: SerializedNode[];
}

export interface SerializedTree {
  root: SerializedNode[];
}
