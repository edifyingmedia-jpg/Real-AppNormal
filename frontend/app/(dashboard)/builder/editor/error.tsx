// frontend/app/(dashboard)/builder/editor/error.tsx

"use client";

export default function BuilderEditorError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-red-600">
          Builder Error
        </h2>

        <p className="text-gray-600 text-sm max-w-md mx-auto">
          Something went wrong while loading the AppNormal Builder.
        </p>

        <pre className="text-xs text-red-500 bg-red-50 p-4 rounded-md max-w-lg mx-auto overflow-auto">
          {error.message}
        </pre>

        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
