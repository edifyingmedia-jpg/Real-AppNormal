import { useState } from "react";
import { usePublishProject, getGetProjectQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Globe, Copy, Check, ExternalLink, Lock, Loader2 } from "lucide-react";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  isPublished: boolean;
  hasFiles: boolean;
}

export function PublishDialog({
  open,
  onOpenChange,
  projectId,
  isPublished,
  hasFiles,
}: PublishDialogProps) {
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const publishMutation = usePublishProject();

  const publishedUrl = `${window.location.origin}/api/published/${projectId}`;

  const handlePublish = async () => {
    await publishMutation.mutateAsync({
      id: projectId,
      data: { isPublished: !isPublished },
    });
    queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Publish App
          </DialogTitle>
          <DialogDescription>
            Publish your app to get a shareable public URL.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {!hasFiles && (
            <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-sm text-muted-foreground">
              Generate your app first by chatting with the AI, then publish it here.
            </div>
          )}

          {hasFiles && (
            <>
              <div className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border p-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${isPublished ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                <span className="text-sm text-muted-foreground flex-1 truncate font-mono text-xs">
                  {isPublished ? publishedUrl : "Not published yet"}
                </span>
                {isPublished && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={handleCopy}
                      title="Copy URL"
                    >
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => window.open(publishedUrl, "_blank")}
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {isPublished && (
                <p className="text-xs text-muted-foreground px-1">
                  Your app is live. Anyone with the link can view it. Changes you make are applied immediately — no re-publish needed.
                </p>
              )}
            </>
          )}

          <div className="flex justify-between items-center pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {hasFiles && (
              <Button
                onClick={handlePublish}
                disabled={publishMutation.isPending}
                variant={isPublished ? "outline" : "default"}
                className={isPublished ? "text-destructive border-destructive/30 hover:bg-destructive/10" : ""}
              >
                {publishMutation.isPending && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                {isPublished ? (
                  <><Lock className="w-3.5 h-3.5 mr-2" />Unpublish</>
                ) : (
                  <><Globe className="w-3.5 h-3.5 mr-2" />Publish App</>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
