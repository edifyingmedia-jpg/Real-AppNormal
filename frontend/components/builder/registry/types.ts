import React from 'react';

export interface ComponentDefinition {
  type: string;
  // Use React.ReactElement to avoid relying on the global JSX namespace
  render: (props: any, children: React.ReactNode) => React.ReactElement;
}
