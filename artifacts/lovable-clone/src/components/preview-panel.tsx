import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Monitor, ExternalLink } from "lucide-react";

interface ProjectFile {
  id: number;
  filename: string;
  content: string;
  language: string;
}

interface PreviewPanelProps {
  files: ProjectFile[];
}

function buildPreviewDocument(files: ProjectFile[]): string {
  const htmlFile = files.find((f) => f.filename === "index.html" || f.language === "html");
  const cssFiles = files.filter((f) => f.language === "css");
  const jsFiles = files.filter((f) => f.language === "javascript" || f.language === "js");

  if (!htmlFile) {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0d1117; color: #8b949e; flex-direction: column; gap: 12px; }
  p { font-size: 14px; }
</style></head>
<body>
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
  <p>No HTML file yet. Chat to generate your app.</p>
</body>
</html>`;
  }

  let doc = htmlFile.content;

  // Inject CSS before </head>
  if (cssFiles.length > 0) {
    const styleTag = `<style>\n${cssFiles.map((f) => f.content).join("\n\n")}\n</style>`;
    if (doc.includes("</head>")) {
      doc = doc.replace("</head>", `${styleTag}\n</head>`);
    } else {
      doc = styleTag + doc;
    }
  }

  // Inject JS before </body>
  if (jsFiles.length > 0) {
    const scriptTag = `<script>\n${jsFiles.map((f) => f.content).join("\n\n")}\n</script>`;
    if (doc.includes("</body>")) {
      doc = doc.replace("</body>", `${scriptTag}\n</body>`);
    } else {
      doc = doc + scriptTag;
    }
  }

  return doc;
}

export function PreviewPanel({ files }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refreshPreview = () => {
    setIsLoading(true);
    setKey((k) => k + 1);
    setTimeout(() => setIsLoading(false), 500);
  };

  const openInNewTab = () => {
    const doc = buildPreviewDocument(files);
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  // Auto-refresh when files change
  useEffect(() => {
    setKey((k) => k + 1);
  }, [files]);

  const previewDoc = buildPreviewDocument(files);

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Toolbar */}
      <div className="h-10 border-b border-border/60 flex items-center px-3 gap-2 shrink-0 bg-[#161b22]">
        <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground flex-1 font-medium">Preview</span>
        <Button
          size="sm"
          variant="ghost"
          data-testid="btn-refresh-preview"
          onClick={refreshPreview}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          title="Refresh preview"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          data-testid="btn-open-preview"
          onClick={openInNewTab}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          title="Open in new tab"
        >
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 relative overflow-hidden bg-white">
        {files.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]">
            <div className="text-center text-muted-foreground">
              <Monitor className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Preview will appear here</p>
              <p className="text-xs mt-1 opacity-60">Chat to generate your app</p>
            </div>
          </div>
        ) : (
          <iframe
            key={key}
            ref={iframeRef}
            data-testid="iframe-preview"
            srcDoc={previewDoc}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
            title="App Preview"
            onLoad={() => setIsLoading(false)}
          />
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
