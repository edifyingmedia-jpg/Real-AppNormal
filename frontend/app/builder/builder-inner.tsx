"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function BuilderInner() {
  const params = useSearchParams();

  const idea = params.get("idea") || "";
  const plan = params.get("plan") || "starter";

  const [code, setCode] = useState("");
  const [previewUrl, setPreviewUrl] = useState("/api/preview");

  useEffect(() => {
    if (idea) {
      setCode(`// AppNormal generated starting point
// Plan: ${plan}
// Idea: ${idea}

export default function App() {
  return (
    <div style={{ padding: 20, color: "white" }}>
      <h1>Your App: ${idea}</h1>
      <p>Plan: ${plan}</p>
    </div>
  );
}
`);
    }
  }, [idea, plan]);

  return (
    <div className="flex flex-col h-screen bg-[#111] text-white">
      {/* Top Bar */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-[#222] bg-[#0d0d0d]">
        <div className="flex items-center gap-3">
          <span className="text-lime-400 font-semibold">AppNormal</span>
          <span className="text-sm text-gray-400">Workspace</span>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-3 py-1 rounded bg-[#222] hover:bg-[#333] text-sm">
            Run
          </button>
          <button className="px-3 py-1 rounded bg-[#222] hover:bg-[#333] text-sm">
            Publish
          </button>
          <button className="px-3 py-1 rounded bg-[#222] hover:bg-[#333] text-sm">
            GitHub
          </button>
          <button className="px-3 py-1 rounded bg-[#222] hover:bg-[#333] text-sm">
            Chat
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Workspace (Left) */}
        <div className="w-[65%] h-full border-r border-[#222] p-4 overflow-auto">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-full bg-[#0d0d0d] text-gray-200 p-4 rounded-lg outline-none resize-none font-mono text-sm"
          />
        </div>

        {/* Preview (Right) */}
        <div className="w-[35%] h-full p-4">
          <iframe
            src={previewUrl}
            className="w-full h-full rounded-lg border border-[#222] bg-black"
          />
        </div>
      </div>
    </div>
  );
}
