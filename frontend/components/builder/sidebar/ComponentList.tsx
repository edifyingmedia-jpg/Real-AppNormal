// frontend/components/builder/sidebar/ComponentList.tsx

"use client";

import { useBuilderState } from "../state/BuilderState";

export default function ComponentList() {
  const { tree, setTree, history, setHistory } = useBuilderState();

  const addComponent = (type: string) => {
    const newNode = {
      id: crypto.randomUUID(),
      type,
      props: { className: "p-4 border rounded-md" },
      children: [],
    };

    // Save history for undo
    setHistory([...history, tree]);

    // Add new node to root for now
    setTree([...tree, newNode]);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-md font-semibold text-gray-800">Add Component</h3>

      <div className="space-y-2">
        <button
          onClick={() => addComponent("div")}
          className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-left"
        >
          Container (div)
        </button>

        <button
          onClick={() => addComponent("p")}
          className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-left"
        >
          Text (p)
        </button>

        <button
          onClick={() => addComponent("button")}
          className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-left"
        >
          Button
        </button>

        <button
          onClick={() => addComponent("img")}
          className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-left"
        >
          Image
        </button>
      </div>
    </div>
  );
}
