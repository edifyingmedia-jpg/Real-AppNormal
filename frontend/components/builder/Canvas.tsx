// frontend/components/builder/Canvas.tsx

"use client";

export default function BuilderCanvas() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-gray-500">
      <div className="text-center space-y-3">
        <h2 className="text-xl font-semibold text-gray-800">Canvas</h2>
        <p className="text-sm">
          Your generated screens and layouts will appear here.
        </p>

        <div className="mt-4 border border-dashed border-gray-300 rounded-lg p-10">
          <p className="text-gray-400 text-sm">
            Canvas is currently empty.
          </p>
        </div>
      </div>
    </div>
  );
}
