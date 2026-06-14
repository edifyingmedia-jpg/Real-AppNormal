import { useParams, Link } from "wouter";
import { useGetProject, useListProjectFiles } from "@workspace/api-client-react";
import { ChatPanel } from "@/components/chat-panel";
import { CodeEditor } from "@/components/code-editor";
import { PreviewPanel } from "@/components/preview-panel";
import { PublishDialog } from "@/components/publish-dialog";
import { GitHubPushDialog } from "@/components/github-push-dialog";
import { ProjectSettingsDialog } from "@/components/project-settings-dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, TerminalSquare, Globe, Github, Settings } from "lucide-react";
import { useState } from "react";

export default function Builder() {
  const params = useParams();
  const projectId = parseInt(params.id || "0", 10);

  const { data: project, isLoading: projectLoading } = useGetProject(projectId);
  const { data: files, isLoading: filesLoading } = useListProjectFiles(projectId);

  const [activeFileId, setActiveFileId] = useState<number | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (projectLoading || filesLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (!project) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-destructive">Project not found</div>;
  }

  const currentActiveFileId = activeFileId || (files && files.length > 0 ? files[0].id : null);
  const hasFiles = (files?.length ?? 0) > 0;

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

        {/* Toolbar actions */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setSettingsOpen(true)}
            title="Integrations (Supabase, Stripe)"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Integrations</span>
            {(project.supabaseUrl || project.stripePublishableKey) && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setGithubOpen(true)}
            title="Push to GitHub"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">GitHub</span>
            {project.githubRepo && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </Button>

          <Button
            size="sm"
            className="h-7 px-3 text-xs gap-1.5"
            variant={project.isPublished ? "outline" : "default"}
            onClick={() => setPublishOpen(true)}
          >
            <Globe className="w-3.5 h-3.5" />
            {project.isPublished ? "Published" : "Publish"}
          </Button>
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

      {/* Dialogs */}
      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        projectId={projectId}
        isPublished={project.isPublished}
        hasFiles={hasFiles}
      />

      <GitHubPushDialog
        open={githubOpen}
        onOpenChange={setGithubOpen}
        projectId={projectId}
        githubRepo={project.githubRepo}
        hasFiles={hasFiles}
      />

      <ProjectSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        projectId={projectId}
        supabaseUrl={project.supabaseUrl}
        stripePublishableKey={project.stripePublishableKey}
      />
    </div>
  );
}
