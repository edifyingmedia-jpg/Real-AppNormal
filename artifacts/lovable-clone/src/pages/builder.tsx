import { useParams, Link } from "wouter";
import { useGetProject, useGetAnthropicConversation, useListProjectFiles } from "@workspace/api-client-react";
import { ChatPanel } from "@/components/chat-panel";
import { CodeEditor } from "@/components/code-editor";
import { PreviewPanel } from "@/components/preview-panel";
import { ChevronLeft, TerminalSquare } from "lucide-react";
import { useState } from "react";

export default function Builder() {
  const params = useParams();
  const projectId = parseInt(params.id || "0", 10);

  const { data: project, isLoading: projectLoading } = useGetProject(projectId);
  const { data: files, isLoading: filesLoading } = useListProjectFiles(projectId);

  const [activeFileId, setActiveFileId] = useState<number | null>(null);

  if (projectLoading || filesLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (!project) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-destructive">Project not found</div>;
  }

  // Ensure active file is valid
  const currentActiveFileId = activeFileId || (files && files.length > 0 ? files[0].id : null);

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 border-b border-border bg-card flex items-center px-4 shrink-0 justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="h-4 w-px bg-border mx-1" />
          <TerminalSquare className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm truncate max-w-[200px]">{project.name}</span>
        </div>
      </header>

      {/* 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Chat */}
        <div className="w-[320px] lg:w-[380px] border-r border-border bg-sidebar shrink-0 flex flex-col">
          {project.conversationId ? (
            <ChatPanel projectId={projectId} conversationId={project.conversationId} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-6 text-center text-sm">
              No conversation associated with this project.
            </div>
          )}
        </div>

        {/* Center Panel: Code Editor */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          <CodeEditor 
            projectId={projectId} 
            files={files || []} 
            activeFileId={currentActiveFileId} 
            onFileSelect={setActiveFileId} 
          />
        </div>

        {/* Right Panel: Live Preview */}
        <div className="w-[40%] xl:w-[45%] border-l border-border bg-card shrink-0 flex flex-col">
          <PreviewPanel files={files || []} />
        </div>
      </div>
    </div>
  );
}
