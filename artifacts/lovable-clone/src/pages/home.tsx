import { useListProjects } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Plus, TerminalSquare, Sparkles, ArrowRight } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { NewProjectDialog } from "@/components/new-project-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const ACCENT_COLORS = [
  "border-t-blue-500",
  "border-t-purple-500",
  "border-t-emerald-500",
  "border-t-amber-500",
  "border-t-pink-500",
  "border-t-cyan-500",
];

const INSPIRATION_PROMPTS = [
  { label: "Todo app", name: "Todo App", description: "A task management app with categories and priorities" },
  { label: "Weather dashboard", name: "Weather Dashboard", description: "A weather app with forecasts and location search" },
  { label: "Chat interface", name: "Chat Interface", description: "A real-time chat UI with message threads" },
  { label: "Expense tracker", name: "Expense Tracker", description: "Track spending by category with charts" },
  { label: "Kanban board", name: "Kanban Board", description: "A drag-and-drop project board with columns" },
];

export default function Home() {
  const { data: projects, isLoading } = useListProjects();
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [prefill, setPrefill] = useState<{ name: string; description: string }>({ name: "", description: "" });
  const [, setLocation] = useLocation();

  const openWithPrefill = (name: string, description: string) => {
    setPrefill({ name, description });
    setIsNewProjectOpen(true);
  };

  const openBlank = () => {
    setPrefill({ name: "", description: "" });
    setIsNewProjectOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#080b10] text-slate-200 selection:bg-blue-500/30">

      {/* Hero Banner */}
      <div className="relative w-full pt-6 pb-16 px-6 lg:px-12 flex flex-col items-center justify-center overflow-hidden min-h-[320px]">
        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1f35] via-[#080b10] to-[#080b10] -z-20" />
        <div
          className="absolute inset-0 opacity-[0.12] -z-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }}
        />

        {/* Logo */}
        <div className="absolute top-6 left-6 lg:left-12 flex items-center gap-2 text-slate-400">
          <TerminalSquare className="w-5 h-5" />
          <span className="text-sm font-medium tracking-tight">AppNormal</span>
        </div>

        {/* Hero Content */}
        <div className="flex flex-col items-center text-center max-w-2xl mt-12 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-slate-400">
            What will you build today?
          </h1>

          <p className="text-lg text-slate-400 mb-8 max-w-xl">
            Describe an app and watch it come to life in seconds. No coding required, just your imagination.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button
              size="lg"
              onClick={openBlank}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 h-12 shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] border-0"
              data-testid="btn-new-project"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={openBlank}
              className="w-full sm:w-auto rounded-full px-8 h-12 border border-slate-700 hover:bg-slate-800 text-slate-300"
            >
              Browse Templates
            </Button>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-white tracking-tight">Recent Projects</h2>
          {projects && projects.length > 0 && (
            <button
              onClick={openBlank}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
            >
              New project <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[200px] bg-[#0f1420] rounded-xl p-6 flex flex-col gap-3">
                <Skeleton className="h-5 w-3/4 bg-slate-800" />
                <Skeleton className="h-4 w-full bg-slate-800" />
                <Skeleton className="h-4 w-2/3 bg-slate-800" />
              </div>
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                data-testid={`link-open-project-${project.id}`}
              >
                <div className={`group relative flex flex-col justify-between h-[200px] bg-[#0f1420] border-t-2 ${ACCENT_COLORS[i % ACCENT_COLORS.length]} border-x border-b border-slate-800/50 rounded-b-xl rounded-t-sm p-6 hover:bg-[#131826] transition-colors cursor-pointer overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-900/5`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-100 transition-colors truncate">
                      {project.name}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                      {project.description || "No description provided."}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/50 z-10">
                    <span className="text-xs text-slate-500 font-medium">
                      {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                    </span>
                    <span className="text-sm text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 flex items-center gap-1">
                      Open <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {/* New project card */}
            <div
              onClick={openBlank}
              className="group flex flex-col items-center justify-center h-[200px] bg-[#0f1420]/50 border-2 border-dashed border-slate-800 rounded-xl p-6 hover:bg-[#0f1420] hover:border-slate-700 transition-colors cursor-pointer text-center"
            >
              <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 group-hover:text-blue-400 text-slate-500 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-300">Start something new</span>
            </div>
          </div>
        ) : (
          /* Empty state — hero-style */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                onClick={openBlank}
                className="group flex flex-col items-center justify-center h-[200px] bg-[#0f1420]/50 border-2 border-dashed border-slate-800 rounded-xl p-6 hover:bg-[#0f1420] hover:border-slate-700 transition-colors cursor-pointer text-center"
              >
                <div className={`w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mb-3 text-slate-500 transition-colors ${i === 0 ? "group-hover:bg-blue-500/20 group-hover:text-blue-400" : i === 1 ? "group-hover:bg-purple-500/20 group-hover:text-purple-400" : "group-hover:bg-emerald-500/20 group-hover:text-emerald-400"}`}>
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-slate-300">Start something new</span>
                {i === 0 && <span className="text-xs text-slate-500 mt-1">Create your first project</span>}
              </div>
            ))}
          </div>
        )}

        {/* Inspiration prompts */}
        <div className="mt-16 pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-center gap-4">
          <span className="text-sm text-slate-500 whitespace-nowrap">Try starting with:</span>
          <div className="flex flex-wrap justify-center gap-2">
            {INSPIRATION_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                onClick={() => openWithPrefill(prompt.name, prompt.description)}
                className="px-4 py-2 rounded-full bg-[#131826] text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800/80"
              >
                {prompt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <NewProjectDialog
        open={isNewProjectOpen}
        onOpenChange={setIsNewProjectOpen}
        defaultName={prefill.name}
        defaultDescription={prefill.description}
      />
    </div>
  );
}
