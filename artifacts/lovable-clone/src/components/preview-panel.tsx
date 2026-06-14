import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Monitor, ExternalLink, Smartphone, Tablet, Download, Copy, Check, Globe, Lock, AlertCircle } from "lucide-react";

export interface PreviewError {
  message: string;
  line: number;
  col: number;
  source: string;
}

interface ProjectFile {
  id: number;
  filename: string;
  content: string;
  language: string;
}

interface PreviewPanelProps {
  files: ProjectFile[];
  projectId?: number;
  isPublished?: boolean;
  onErrors?: (errors: PreviewError[]) => void;
}

type ViewportMode = "desktop" | "tablet" | "mobile";

const VIEWPORT_SIZES: Record<ViewportMode, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

const ERROR_CAPTURE_SCRIPT = `<script>(function(){var n=0,errs=[];function send(m,l,c,s){if(n++>7)return;window.parent.postMessage({type:'preview-error',message:String(m),line:l||0,col:c||0,source:String(s||'').replace(/blob:[^/]*/,'[page]')},'*');}window.onerror=function(m,s,l,c){send(m,l,c,s);return false;};window.addEventListener('unhandledrejection',function(e){send('Unhandled Promise: '+(e.reason&&e.reason.message||String(e.reason)),0,0,'async');});})()</scr` + `ipt>`;

function buildPreviewDocument(files: ProjectFile[]): string {
  const htmlFile = files.find(
    (f) => f.filename === "index.html" || f.language === "html"
  );

  if (!htmlFile) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0d1117;color:#8b949e;flex-direction:column;gap:16px}.icon{opacity:.3}p{font-size:14px;margin:0}small{font-size:12px;opacity:.6}</style></head><body><svg class="icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 9 6 6m0-6-6 6"/></svg><p>No app generated yet</p><small>Chat to generate your app →</small></body></html>`;
  }

  let doc = htmlFile.content;
  const cssFiles = files.filter((f) => f.language === "css");
  const jsFiles = files.filter((f) => f.language === "javascript" || f.language === "js");

  for (const cssFile of cssFiles) {
    doc = doc.replace(
      new RegExp(`<link[^>]+href=["']${escapeRegex(cssFile.filename)}["'][^>]*>`, "gi"),
      `<style>\n${cssFile.content}\n</style>`
    );
  }

  for (const jsFile of jsFiles) {
    doc = doc.replace(
      new RegExp(`<script[^>]+src=["']${escapeRegex(jsFile.filename)}["'][^>]*><\\/script>`, "gi"),
      `<script>\n${jsFile.content}\n</script>`
    );
  }

  const unreferencedCSS = cssFiles.filter((f) => !doc.toLowerCase().includes(f.filename.toLowerCase()));
  if (unreferencedCSS.length > 0) {
    const styleBlock = unreferencedCSS.map((f) => `<style>\n${f.content}\n</style>`).join("\n");
    doc = doc.includes("</head>") ? doc.replace("</head>", `${styleBlock}\n</head>`) : styleBlock + "\n" + doc;
  }

  const unreferencedJS = jsFiles.filter((f) => !doc.toLowerCase().includes(f.filename.toLowerCase()));
  if (unreferencedJS.length > 0) {
    const scriptBlock = unreferencedJS.map((f) => `<script>\n${f.content}\n</script>`).join("\n");
    doc = doc.includes("</body>") ? doc.replace("</body>", `${scriptBlock}\n</body>`) : doc + "\n" + scriptBlock;
  }

  // Inject error capture script after <head> opens (or at document start)
  if (doc.includes("<head>")) {
    doc = doc.replace("<head>", `<head>\n${ERROR_CAPTURE_SCRIPT}`);
  } else if (doc.includes("<html")) {
    doc = doc.replace(/(<html[^>]*>)/i, `$1\n${ERROR_CAPTURE_SCRIPT}`);
  } else {
    doc = ERROR_CAPTURE_SCRIPT + "\n" + doc;
  }

  return doc;
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function URLBar({ projectId, isPublished, onCopy }: { projectId?: number; isPublished?: boolean; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);
  const publishedUrl = projectId ? `${window.location.origin}/api/published/${projectId}` : null;
  const showUrl = isPublished && publishedUrl;

  const handleCopy = () => {
    if (publishedUrl) {
      navigator.clipboard.writeText(publishedUrl).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy();
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0 mx-2">
      <div
        className={`flex items-center gap-1.5 flex-1 h-6 px-2.5 rounded-md text-[11px] font-mono cursor-pointer transition-colors truncate ${
          showUrl
            ? "bg-[#0d1117] border border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40"
            : "bg-[#0d1117] border border-border/30 text-muted-foreground/50"
        }`}
        onClick={showUrl ? handleCopy : undefined}
        title={showUrl ? publishedUrl : "Publish this app to get a shareable URL"}
      >
        {showUrl ? (
          <Globe className="w-2.5 h-2.5 shrink-0 text-emerald-500" />
        ) : (
          <Lock className="w-2.5 h-2.5 shrink-0 opacity-40" />
        )}
        <span className="truncate">
          {showUrl ? publishedUrl : "Not published — click Publish in toolbar"}
        </span>
      </div>
      {showUrl && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-emerald-400 shrink-0"
          title="Copy URL"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </Button>
      )}
    </div>
  );
}

export function PreviewPanel({ files, projectId, isPublished, onErrors }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [errors, setErrors] = useState<PreviewError[]>([]);
  const errorsRef = useRef<PreviewError[]>([]);

  const refreshPreview = () => {
    setIsLoading(true);
    setErrors([]);
    errorsRef.current = [];
    onErrors?.([]);
    setKey((k) => k + 1);
  };

  const openInNewTab = () => {
    const doc = buildPreviewDocument(files);
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const downloadCode = () => {
    const doc = buildPreviewDocument(files);
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "app.html";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5_000);
  };

  // Auto-refresh when files change
  useEffect(() => {
    if (files.length > 0) {
      setIsLoading(true);
      setErrors([]);
      errorsRef.current = [];
      onErrors?.([]);
      setKey((k) => k + 1);
    }
  }, [files]);

  // Listen for errors from the iframe
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data?.type !== "preview-error") return;
      const err: PreviewError = {
        message: event.data.message || "Unknown error",
        line: event.data.line || 0,
        col: event.data.col || 0,
        source: event.data.source || "",
      };
      const next = [...errorsRef.current, err];
      errorsRef.current = next;
      setErrors([...next]);
      onErrors?.([...next]);
    },
    [onErrors]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const previewDoc = buildPreviewDocument(files);
  const hasFiles = files.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="h-10 border-b border-border/60 flex items-center px-3 gap-1 shrink-0 bg-[#161b22]">
        <Monitor className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

        <URLBar projectId={projectId} isPublished={isPublished} onCopy={() => {}} />

        {/* Viewport toggles */}
        <div className="flex items-center gap-0.5">
          {(["desktop", "tablet", "mobile"] as ViewportMode[]).map((v) => (
            <Button
              key={v}
              size="sm"
              variant="ghost"
              onClick={() => setViewport(v)}
              className={`h-6 w-6 p-0 ${viewport === v ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
              title={v.charAt(0).toUpperCase() + v.slice(1)}
            >
              {v === "desktop" ? <Monitor className="w-3 h-3" /> : v === "tablet" ? <Tablet className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
            </Button>
          ))}
        </div>

        <div className="w-px h-4 bg-border/40 mx-0.5" />

        <Button
          size="sm"
          variant="ghost"
          data-testid="btn-refresh-preview"
          onClick={refreshPreview}
          disabled={!hasFiles}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
          title="Refresh preview"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          data-testid="btn-open-preview"
          onClick={openInNewTab}
          disabled={!hasFiles}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
          title="Open in new tab"
        >
          <ExternalLink className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={downloadCode}
          disabled={!hasFiles}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
          title="Download as HTML"
        >
          <Download className="w-3 h-3" />
        </Button>
      </div>

      {/* Error banner */}
      {errors.length > 0 && hasFiles && (
        <div className="px-3 py-1.5 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2 shrink-0">
          <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
          <span className="text-[11px] text-destructive flex-1 truncate">
            {errors.length === 1
              ? errors[0].message
              : `${errors.length} errors detected — use Fix Errors in chat`}
          </span>
          <button
            onClick={refreshPreview}
            className="text-[11px] text-destructive/70 hover:text-destructive underline shrink-0"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Preview area */}
      <div className="flex-1 relative overflow-hidden bg-[#1c1c1e] flex items-start justify-center">
        {!hasFiles ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground px-6">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-8 h-8 opacity-30" />
              </div>
              <p className="text-sm font-medium mb-1">No preview yet</p>
              <p className="text-xs opacity-60">Chat to generate your app</p>
            </div>
          </div>
        ) : (
          <div
            className="h-full transition-all duration-300 relative bg-white"
            style={{
              width: VIEWPORT_SIZES[viewport],
              maxWidth: "100%",
              boxShadow:
                viewport !== "desktop"
                  ? "0 0 0 1px rgba(255,255,255,0.08), 4px 0 20px rgba(0,0,0,0.4), -4px 0 20px rgba(0,0,0,0.4)"
                  : "none",
            }}
          >
            <iframe
              key={key}
              ref={iframeRef}
              data-testid="iframe-preview"
              srcDoc={previewDoc}
              className="w-full h-full border-0 block"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
              title="App Preview"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && hasFiles && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm pointer-events-none">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
