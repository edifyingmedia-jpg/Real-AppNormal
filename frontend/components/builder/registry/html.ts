// frontend/components/builder/registry/html.ts

import { ComponentDefinition } from "./types";

export const htmlComponents: ComponentDefinition[] = [
  {
    type: "div",
    render: (props, children) => <div {...props}>{children}</div>,
  },
  {
    type: "p",
    render: (props, children) => <p {...props}>{children}</p>,
  },
  {
    type: "button",
    render: (props, children) => <button {...props}>{children}</button>,
  },
  {
    type: "img",
    render: (props) => <img {...props} />,
  },
];
