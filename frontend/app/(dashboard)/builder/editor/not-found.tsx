// frontend/app/(dashboard)/builder/editor/not-found.tsx

export default function BuilderEditorNotFound() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          Editor Page Not Found
        </h2>

        <p className="text-gray-600 text-sm max-w-md mx-auto">
          The requested editor page does not exist or the project name is missing.
        </p>

        <a
          href="/dashboard/builder"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Return to Builder Dashboard
        </a>
      </div>
    </div>
  );
}
