import React from "react";
import { 
  FolderOpen, 
  FileCode2, 
  Clock, 
  Settings, 
  HelpCircle, 
  TerminalSquare, 
  Search, 
  Filter, 
  Plus,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function Sidebar() {
  return (
    <div className="min-h-screen flex text-slate-300 font-sans">
      {/* Left Sidebar */}
      <aside className="w-[240px] bg-[#0f1117] border-r border-slate-800/50 flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-slate-800/50">
          <TerminalSquare className="w-5 h-5 text-blue-400 mr-2" />
          <span className="font-semibold text-slate-100 text-sm tracking-tight">AI App Builder</span>
        </div>

        {/* Nav Sections */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          
          <div className="space-y-1">
            <h3 className="px-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Workspace</h3>
            <button className="w-full flex items-center px-2 py-1.5 text-sm rounded-md bg-blue-500/15 text-blue-400 transition-colors">
              <FolderOpen className="w-4 h-4 mr-3" />
              Projects
            </button>
            <button className="w-full flex items-center px-2 py-1.5 text-sm rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
              <FileCode2 className="w-4 h-4 mr-3" />
              Templates
            </button>
            <button className="w-full flex items-center px-2 py-1.5 text-sm rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
              <Clock className="w-4 h-4 mr-3" />
              Recent
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="px-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">General</h3>
            <button className="w-full flex items-center px-2 py-1.5 text-sm rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </button>
            <button className="w-full flex items-center px-2 py-1.5 text-sm rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
              <HelpCircle className="w-4 h-4 mr-3" />
              Help
            </button>
          </div>

        </div>

        {/* User Area */}
        <div className="p-4 border-t border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8 rounded bg-blue-900 border border-blue-800">
              <AvatarFallback className="text-xs font-medium text-blue-200 bg-transparent">U</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-200 leading-none mb-1">You</span>
              <span className="text-xs text-slate-500 leading-none">Free Plan</span>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-slate-700 text-slate-400 bg-slate-800/50 px-1.5 py-0">Pro</Badge>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-[#080b10] flex flex-col min-w-0">
        
        {/* Top bar */}
        <header className="h-14 px-6 border-b border-slate-800/50 flex items-center justify-between sticky top-0 bg-[#080b10]/95 backdrop-blur z-10">
          <div className="flex items-center space-x-2 flex-1">
            <div className="relative w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input 
                placeholder="Search projects..." 
                className="w-full pl-9 bg-slate-900/50 border-slate-800 h-8 text-sm focus-visible:ring-1 focus-visible:ring-blue-500/50 text-slate-200 placeholder:text-slate-500"
              />
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
          
          <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-3">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Project
          </Button>
        </header>

        {/* Content Body */}
        <div className="p-8 max-w-6xl w-full mx-auto">
          
          <div className="flex items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-100 tracking-tight">Projects</h2>
            <Badge variant="secondary" className="ml-3 bg-slate-800 text-slate-300 hover:bg-slate-800 border-none font-medium px-2 py-0.5 text-xs">
              1
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            
            {/* Project Card */}
            <div className="group relative bg-[#141820] border border-slate-800/60 rounded-xl p-5 hover:border-slate-700 transition-all duration-200 flex flex-col justify-between h-40 overflow-hidden cursor-pointer">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <h3 className="font-medium text-slate-200 text-sm truncate">Test Calculator</h3>
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  A simple web-based calculator app to test layout and logic generation.
                </p>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <span className="text-[11px] text-slate-500 font-medium">Edited 2 hours ago</span>
                
                <button className="opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-200 text-xs font-medium text-blue-400 flex items-center bg-blue-500/10 px-2 py-1 rounded">
                  Open
                  <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              </div>
            </div>

            {/* New Project Dashed Card */}
            <div className="bg-transparent border border-dashed border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:bg-slate-800/20 transition-all duration-200 flex flex-col items-center justify-center h-40 cursor-pointer text-slate-500 hover:text-slate-300 group">
              <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center mb-3 group-hover:bg-slate-700/50 transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">New project</span>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
