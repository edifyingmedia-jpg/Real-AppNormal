// frontend/components/builder/Sidebar.tsx

"use client";

export default function BuilderSidebar() {
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Components</h2>

      <div className="space-y-3 text-sm text-gray-700">
        <p className="text-gray-500">Component list will appear here.</p>

        {/* Placeholder groups */}
        <div className="border-t border-gray-200 pt-3">
          <p className="font-medium text-gray-800 mb-2">Basic Elements</p>
          <ul className="space-y-1 text-gray-600">
            <li>Button</li>
            <li>Text</li>
            <li>Image</li>
            <li>Input</li>
          </ul>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <p className="font-medium text-gray-800 mb-2">Layouts</p>
          <ul className="space-y-1 text-gray-600">
            <li>Section</li>
            <li>Card</li>
            <li>Grid</li>
          </ul>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <p className="font-medium text-gray-800 mb-2">Screens</p>
          <ul className="space-y-1 text-gray-600">
            <li>Login Screen</li>
            <li>Dashboard Screen</li>
            <li>Profile Screen</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
