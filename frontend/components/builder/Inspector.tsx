// frontend/components/builder/Inspector.tsx

"use client";

export default function BuilderInspector() {
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Inspector</h2>

      <p className="text-gray-500 text-sm mb-4">
        Select an element on the canvas to edit its properties.
      </p>

      {/* Placeholder sections */}
      <div className="space-y-6 text-sm">
        <div>
          <p className="font-medium text-gray-800 mb-2">Layout</p>
          <div className="space-y-1 text-gray-600">
            <p>Width</p>
            <p>Height</p>
            <p>Padding</p>
            <p>Margin</p>
          </div>
        </div>

        <div>
          <p className="font-medium text-gray-800 mb-2">Typography</p>
          <div className="space-y-1 text-gray-600">
            <p>Font Size</p>
            <p>Font Weight</p>
            <p>Color</p>
          </div>
        </div>

        <div>
          <p className="font-medium text-gray-800 mb-2">Appearance</p>
          <div className="space-y-1 text-gray-600">
            <p>Background</p>
            <p>Border</p>
            <p>Shadow</p>
          </div>
        </div>
      </div>
    </div>
  );
}
