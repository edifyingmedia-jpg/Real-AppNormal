// frontend/components/builder/toolbar/BuilderToolbar.tsx

"use client";

import UndoButton from "./UndoButton";
import RedoButton from "./RedoButton";
import DeleteButton from "./DeleteButton";
import DuplicateButton from "./DuplicateButton";

export default function BuilderToolbar() {
  return (
    <div className="flex items-center space-x-3 border-b border-gray-200 px-4 py-2 bg-white">
      <UndoButton />
      <RedoButton />
      <DeleteButton />
      <DuplicateButton />
    </div>
  );
}
