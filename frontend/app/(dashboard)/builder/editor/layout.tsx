// frontend/app/(dashboard)/builder/editor/layout.tsx

export default function BuilderEditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* The editor uses a full-bleed layout separate from dashboard padding */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
