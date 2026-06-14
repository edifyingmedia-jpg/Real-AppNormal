import { useState } from "react";
import { usePushProjectToGithub, useUpdateProjectSettings, getGetProjectQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Github, ExternalLink, Loader2, CheckCircle2, AlertCircle, Crown, Zap } from "lucide-react";

interface GitHubPushDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  githubRepo: string | null | undefined;
  autoPushToGithub: boolean | null | undefined;
  hasFiles: boolean;
}

export function GitHubPushDialog({
  open,
  onOpenChange,
  projectId,
  githubRepo,
  autoPushToGithub,
  hasFiles,
}: GitHubPushDialogProps) {
  const [token, setToken] = useState("");
  const [repo, setRepo] = useState(githubRepo ?? "");
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [autoSync, setAutoSync] = useState(autoPushToGithub ?? false);
  const [result, setResult] = useState<{ success: boolean; message: string; repoUrl?: string } | null>(null);
  const queryClient = useQueryClient();

  const updateSettings = useUpdateProjectSettings();
  const pushMutation = usePushProjectToGithub();

  const handlePush = async () => {
    setResult(null);
    setUpgradeRequired(false);
    try {
      if (token || repo !== (githubRepo ?? "") || autoSync !== (autoPushToGithub ?? false)) {
        await updateSettings.mutateAsync({
          id: projectId,
          data: { githubRepo: repo || null, githubToken: token || null, autoPushToGithub: autoSync },
        });
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      }
      const res = await pushMutation.mutateAsync({ id: projectId });
      setResult({ success: true, message: res.message ?? "Push successful", repoUrl: res.repoUrl ?? undefined });
    } catch (err: unknown) {
      const apiErr = (err as { response?: { data?: { error?: string; message?: string }; status?: number } });
      const status = apiErr?.response?.status;
      if (status === 403) {
        setUpgradeRequired(true);
        return;
      }
      const apiMsg = apiErr?.response?.data?.message ?? apiErr?.response?.data?.error;
      const msg = err instanceof Error ? err.message : "Push failed";
      setResult({ success: false, message: apiMsg ?? msg });
    }
  };

  const handleToggleAutoSync = async (checked: boolean) => {
    setAutoSync(checked);
    try {
      await updateSettings.mutateAsync({
        id: projectId,
        data: { autoPushToGithub: checked },
      });
      queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
    } catch {
      setAutoSync(!checked);
    }
  };

  const isPending = updateSettings.isPending || pushMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setResult(null); setUpgradeRequired(false); } }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-4 h-4" />
            Push to GitHub
          </DialogTitle>
          <DialogDescription>
            Push your project files to a GitHub repository. A new repo will be created if it doesn't exist yet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {upgradeRequired && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Crown className="w-4 h-4 shrink-0" />
                <span className="text-sm font-semibold">Creator or Studio plan required</span>
              </div>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                GitHub push is a paid feature. Upgrade to sync your app with a GitHub repository.
              </p>
              <Button
                size="sm"
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-1.5"
                onClick={() => window.location.href = "/#pricing"}
              >
                <Zap className="w-3.5 h-3.5" />
                View Plans
              </Button>
            </div>
          )}

          {!upgradeRequired && (
            <>
              {!hasFiles && (
                <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-sm text-muted-foreground">
                  Generate your app first by chatting with the AI, then push it to GitHub.
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="gh-repo">Repository name</Label>
                  <Input
                    id="gh-repo"
                    placeholder="my-app  or  username/my-app"
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Just the name (e.g. <code className="text-foreground/70">my-app</code>) or full path <code className="text-foreground/70">username/repo</code>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="gh-token">
                    Personal Access Token
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo&description=AI+App+Builder"
                      target="_blank"
                      rel="noreferrer"
                      className="ml-1.5 text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      Create one <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </Label>
                  <Input
                    id="gh-token"
                    type="password"
                    placeholder={githubRepo ? "Leave blank to use saved token" : "ghp_xxxxxxxxxxxx"}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="h-8 text-sm font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Needs <code className="text-foreground/70">repo</code> scope. Stored securely in this project.
                  </p>
                </div>
              </div>

              {githubRepo && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3.5 py-3">
                  <div className="flex items-start gap-2.5">
                    <Zap className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Auto-sync after AI generation</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Automatically push to GitHub whenever the AI builds or updates your app.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={autoSync}
                    onCheckedChange={handleToggleAutoSync}
                    disabled={updateSettings.isPending}
                    className="shrink-0 ml-3"
                  />
                </div>
              )}

              {result && (
                <div className={`flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm ${
                  result.success
                    ? "bg-green-500/10 border border-green-500/20 text-green-400"
                    : "bg-destructive/10 border border-destructive/20 text-destructive"
                }`}>
                  {result.success
                    ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <div>
                    <p>{result.message}</p>
                    {result.repoUrl && (
                      <a
                        href={result.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 mt-1 text-xs underline opacity-80 hover:opacity-100"
                      >
                        View on GitHub <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-1">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handlePush} disabled={isPending || !hasFiles || !repo}>
                  {isPending && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                  <Github className="w-3.5 h-3.5 mr-2" />
                  Push to GitHub
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
