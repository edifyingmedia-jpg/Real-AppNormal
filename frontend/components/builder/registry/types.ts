// frontend/components/builder/registry/types.ts

export interface ComponentDefinition {
  type: string;
  render: (props: any, children: React.ReactNode) => JSX.Element;
}
