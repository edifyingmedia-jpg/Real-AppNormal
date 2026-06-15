// frontend/app/(dashboard)/builder/editor/page.tsx

"use client";

import { useSearchParams } from "next/navigation";
import EditorShell from "@/frontend/components/builder/EditorShell";

export default function BuilderEditorPage() {
  const params = useSearchParams();
  const appName = params.get("name") || "Untitled App";

  return (
    <div className="h-full w-full">
      <EditorShell appName={appName} />
    </div>
  );
}
