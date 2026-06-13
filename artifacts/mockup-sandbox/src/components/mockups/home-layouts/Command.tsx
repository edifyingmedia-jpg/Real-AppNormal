import React, { useState } from "react";
import { Search, TerminalSquare, Plus, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Command() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const projects = [
    {
      id: 1,
      name: "Test Calculator",
      description: "A calculator app",
      time: "2 hours ago",
      active: true,
    },
    {
      id: 2,
      name: "Weather Dashboard",
      description: "Real-time weather data visualization",
      time: "1 day ago",
      active: false,
    },
    {
      id: 3,
      name: "Todo List",
      description: "Simple task management with categories",
      time: "3 days ago",
      active: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-200 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-[#070a0f] sticky top-0 z-10">
        <div className="flex items-center gap-2 text-slate-100">
          <TerminalSquare className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm tracking-tight">AI App Builder</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-8 border-white/10 bg-transparent text-xs hover:bg-white/5 hover:text-white">
            New Project
          </Button>
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 cursor-pointer hover:text-slate-200 transition-colors">
            <User className="w-4 h-4" />
          </div>
        </div>
      </header>

      {/* Hero input area */}
      <div className="bg-[#0c1018] py-8 border-b border-white/5 px-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full bg-white/5 border border-white/10 rounded-lg py-4 pl-12 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-lg shadow-sm"
              placeholder="Search or create a project..."
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <div className="flex gap-1">
                <kbd className="inline-flex items-center justify-center rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-slate-500 h-5">⌘</kbd>
                <kbd className="inline-flex items-center justify-center rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-slate-500 h-5">K</kbd>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium border border-white/5 transition-colors hover:bg-white/15">All</button>
            <button className="px-3 py-1 rounded-full bg-transparent text-slate-400 text-xs font-medium border border-transparent transition-colors hover:bg-white/5 hover:text-slate-300">Recent</button>
            <button className="px-3 py-1 rounded-full bg-transparent text-slate-400 text-xs font-medium border border-transparent transition-colors hover:bg-white/5 hover:text-slate-300">Starred</button>
          </div>
        </div>
      </div>

      {/* Project list */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-3xl mx-auto flex flex-col">
          <div className="flex flex-col border border-white/5 rounded-lg overflow-hidden bg-[#0c1018]/50">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className={`group flex items-center px-4 py-3 border-b border-white/5 transition-colors cursor-pointer ${
                  hoveredRow === index ? 'bg-white/5' : ''
                }`}
                onMouseEnter={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <div className="w-6 flex shrink-0 items-center justify-center">
                  <div className={`w-2 h-2 rounded-full ${project.active ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-white/10'}`} />
                </div>
                
                <div className="flex flex-col min-w-0 flex-1 ml-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className={`font-medium truncate ${project.active ? 'text-slate-200' : 'text-slate-300'}`}>
                      {project.name}
                    </span>
                    <span className="font-mono text-xs text-slate-500 shrink-0 tabular-nums">
                      {project.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 mt-0.5">
                    <span className="text-sm text-slate-500 truncate">
                      {project.description}
                    </span>
                    <div className={`flex items-center text-xs font-medium text-emerald-400 transition-opacity duration-200 ${hoveredRow === index ? 'opacity-100' : 'opacity-0'}`}>
                      Open <ArrowRight className="ml-1 w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex items-center justify-center px-4 py-4 border-b border-transparent text-sm text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors cursor-pointer border-dashed border-t border-white/10">
              <Plus className="w-4 h-4 mr-2" />
              Create a new project
            </div>
          </div>
        </div>
      </main>

      {/* Keyboard hints footer */}
      <footer className="h-10 border-t border-white/5 flex items-center justify-center shrink-0 bg-[#070a0f]">
        <div className="flex gap-4 text-[11px] font-medium text-slate-500 font-mono">
          <span><kbd className="font-sans">↵</kbd> Open</span>
          <span className="text-white/10">·</span>
          <span><kbd className="font-sans">N</kbd> New project</span>
          <span className="text-white/10">·</span>
          <span><kbd className="font-sans">⌘K</kbd> Command palette</span>
        </div>
      </footer>
    </div>
  );
}
