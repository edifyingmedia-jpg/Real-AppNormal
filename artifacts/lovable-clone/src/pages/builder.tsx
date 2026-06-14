import { useParams, Link } from "wouter";
import { useGetProject, useListProjectFiles, useUpdateProjectSettings, getGetProjectQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChatPanel } from "@/components/chat-panel";
import { CodeEditor } from "@/components/code-editor";
import { PreviewPanel, type PreviewError } from "@/components/preview-panel";
import { PublishDialog } from "@/components/publish-dialog";
import { GitHubPushDialog } from "@/components/github-push-dialog";
import { ProjectSettingsDialog } from "@/components/project-settings-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, TerminalSquare, Globe, Github, Settings, ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";

const AI_MODELS = [
  { id: "claude-opus-4-5", label: "Claude Opus 4", provider: "Anthropic", color: "text-orange-400" },
  { id: "gpt-4.1", label: "GPT-4.1", provider: "OpenAI", color: "text-green-400" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google", color: "text-blue-400" },
] as const;

type AiModelId = typeof AI_MODELS[number]["id"];

export default function Builder() {
  const params = useParams();
  const projectId = parseInt(params.id || "0", 10);
  const queryClient = useQueryClient();

  const { data: project, isLoading: projectLoading } = useGetProject(projectId);
  const { data: files, isLoading: filesLoading } = useListProjectFiles(projectId);
  const updateSettings = useUpdateProjectSettings();

  const [activeFileId, setActiveFileId] = useState<number | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewErrors, setPreviewErrors] = useState<PreviewError[]>([]);
  const [modelSwitching, setModelSwitching] = useState(false);

  if (projectLoading || filesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-destructive">
        Project not found
      </div>
    );
  }

  const currentActiveFileId = activeFileId || (files && files.length > 0 ? files[0].id : null);
  const hasFiles = (files?.length ?? 0) > 0;

  const currentModel = AI_MODELS.find((m) => m.id === (project.aiModel ?? "claude-opus-4-5")) ?? AI_MODELS[0];

  const handleModelChange = async (modelId: AiModelId) => {
    if (modelId === project.aiModel || modelSwitching) return;
    setModelSwitching(true);
    try {
      await updateSettings.mutateAsync({ id: projectId, data: { aiModel: modelId } });
      queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
    } finally {
      setModelSwitching(false);
    }
  };

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 border-b border-border bg-card flex items-center px-4 shrink-0 justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="h-4 w-px bg-border mx-1 shrink-0" />
          <TerminalSquare className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium text-sm truncate max-w-[180px]">{project.name}</span>
          {project.isPublished && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400 shrink-0">
              <Globe className="w-2.5 h-2.5" />
              Live
            </span>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 shrink-0">
          {/* AI Model Picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                disabled={modelSwitching}
              >
                <Sparkles className={`w-3.5 h-3.5 ${currentModel.color}`} />
                <span className="hidden sm:inline">{currentModel.label}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">AI Model</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {AI_MODELS.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => handleModelChange(model.id)}
                  className="flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div>
                    <div className={`text-xs font-medium ${model.color}`}>{model.label}</div>
                    <div className="text-[10px] text-muted-foreground">{model.provider}</div>
                  </div>
                  {currentModel.id === model.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setSettingsOpen(true)}
            title="Integrations & Settings"
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
            {project.githubRepo && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          </Button>

          <Button
            size="sm"
            className="h-7 px-3 text-xs gap-1.5"
            variant={project.isPublished ? "outline" : "default"}
            onClick={() => setPublishOpen(true)}
          >
            <Globe className="w-3.5 h-3.5" />
            {project.isPublished ? "Published ✓" : "Publish"}
          </Button>
        </div>
      </header>

      {/* 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat */}
        <div className="w-[320px] lg:w-[380px] border-r border-border bg-sidebar shrink-0 flex flex-col">
          {project.conversationId ? (
            <ChatPanel
              projectId={projectId}
              conversationId={project.conversationId}
              previewErrors={previewErrors}
              onErrorsFixed={() => setPreviewErrors([])}
              autoPushToGithub={project.autoPushToGithub}
              githubRepo={project.githubRepo}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-6 text-center text-sm">
              No conversation associated with this project.
            </div>
          )}
        </div>

        {/* Center: Code Editor */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          <CodeEditor
            projectId={projectId}
            files={files || []}
            activeFileId={currentActiveFileId}
            onFileSelect={setActiveFileId}
          />
        </div>

        {/* Right: Live Preview */}
        <div className="w-[40%] xl:w-[45%] border-l border-border bg-card shrink-0 flex flex-col">
          <PreviewPanel
            files={files || []}
            projectId={projectId}
            isPublished={project.isPublished}
            onErrors={setPreviewErrors}
          />
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
        autoPushToGithub={project.autoPushToGithub}
        hasFiles={hasFiles}
      />
      <ProjectSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        projectId={projectId}
        supabaseUrl={project.supabaseUrl}
        stripePublishableKey={project.stripePublishableKey}
        customDomain={project.customDomain}
        aiModel={(project.aiModel ?? "claude-opus-4-5") as AiModelId}
      />
    </div>
  );
}
