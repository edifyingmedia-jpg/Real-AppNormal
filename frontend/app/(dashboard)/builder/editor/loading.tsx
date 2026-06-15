// frontend/app/(dashboard)/builder/editor/loading.tsx

export default function BuilderEditorLoading() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent"></div>

        <p className="text-gray-600 text-sm">
          Loading AppNormal Builder…
        </p>
      </div>
    </div>
  );
}
