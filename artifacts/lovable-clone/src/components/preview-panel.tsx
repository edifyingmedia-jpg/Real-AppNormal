import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Monitor, ExternalLink, Smartphone, Tablet } from "lucide-react";

interface ProjectFile {
  id: number;
  filename: string;
  content: string;
  language: string;
}

interface PreviewPanelProps {
  files: ProjectFile[];
}

type ViewportMode = "desktop" | "tablet" | "mobile";

const VIEWPORT_SIZES: Record<ViewportMode, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

/**
 * Build a complete HTML document for the preview iframe.
 *
 * Strategy:
 * 1. If there's an index.html, use it as the base.
 * 2. Replace any <link href="style.css"> references with inline <style> content.
 * 3. Replace any <script src="script.js"> references with inline <script> content.
 * 4. If there are CSS/JS files that are NOT already referenced in the HTML, inject them.
 */
function buildPreviewDocument(files: ProjectFile[]): string {
  const htmlFile = files.find(
    (f) => f.filename === "index.html" || f.language === "html"
  );

  if (!htmlFile) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body {
    font-family: system-ui, -apple-system, sans-serif;
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh; margin: 0;
    background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
    color: #8b949e; flex-direction: column; gap: 16px;
  }
  .icon { opacity: 0.3; }
  p { font-size: 14px; margin: 0; }
  small { font-size: 12px; opacity: 0.6; }
</style>
</head>
<body>
  <svg class="icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 9 6 6m0-6-6 6"/>
  </svg>
  <p>No app generated yet</p>
  <small>Chat to generate your app &rarr;</small>
</body>
</html>`;
  }

  let doc = htmlFile.content;
  const cssFiles = files.filter((f) => f.language === "css");
  const jsFiles = files.filter((f) => f.language === "javascript" || f.language === "js");

  // Replace <link rel="stylesheet" href="filename"> with inline <style> content
  for (const cssFile of cssFiles) {
    // Match both href="style.css" and href='style.css'
    const linkRe = new RegExp(
      `<link[^>]+href=["']${escapeRegex(cssFile.filename)}["'][^>]*>`,
      "gi"
    );
    if (linkRe.test(doc)) {
      doc = doc.replace(
        new RegExp(
          `<link[^>]+href=["']${escapeRegex(cssFile.filename)}["'][^>]*>`,
          "gi"
        ),
        `<style>\n${cssFile.content}\n</style>`
      );
    }
  }

  // Replace <script src="filename"> with inline <script> content
  for (const jsFile of jsFiles) {
    const scriptRe = new RegExp(
      `<script[^>]+src=["']${escapeRegex(jsFile.filename)}["'][^>]*><\\/script>`,
      "gi"
    );
    if (scriptRe.test(doc)) {
      doc = doc.replace(
        new RegExp(
          `<script[^>]+src=["']${escapeRegex(jsFile.filename)}["'][^>]*><\\/script>`,
          "gi"
        ),
        `<script>\n${jsFile.content}\n</script>`
      );
    }
  }

  // Inject any CSS files not already referenced in the HTML
  const unreferencedCSS = cssFiles.filter(
    (f) => !doc.toLowerCase().includes(f.filename.toLowerCase())
  );
  if (unreferencedCSS.length > 0) {
    const styleBlock = unreferencedCSS
      .map((f) => `<style>\n${f.content}\n</style>`)
      .join("\n");
    doc = doc.includes("</head>")
      ? doc.replace("</head>", `${styleBlock}\n</head>`)
      : styleBlock + "\n" + doc;
  }

  // Inject any JS files not already referenced in the HTML
  const unreferencedJS = jsFiles.filter(
    (f) => !doc.toLowerCase().includes(f.filename.toLowerCase())
  );
  if (unreferencedJS.length > 0) {
    const scriptBlock = unreferencedJS
      .map((f) => `<script>\n${f.content}\n</script>`)
      .join("\n");
    doc = doc.includes("</body>")
      ? doc.replace("</body>", `${scriptBlock}\n</body>`)
      : doc + "\n" + scriptBlock;
  }

  return doc;
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function PreviewPanel({ files }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");

  const refreshPreview = () => {
    setIsLoading(true);
    setKey((k) => k + 1);
  };

  const openInNewTab = () => {
    const doc = buildPreviewDocument(files);
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  // Auto-refresh when files change
  useEffect(() => {
    if (files.length > 0) {
      setIsLoading(true);
      setKey((k) => k + 1);
    }
  }, [files]);

  const previewDoc = buildPreviewDocument(files);
  const hasFiles = files.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="h-10 border-b border-border/60 flex items-center px-3 gap-1.5 shrink-0 bg-[#161b22]">
        <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium flex-1">Preview</span>

        {/* Viewport toggles */}
        <div className="flex items-center gap-0.5 mr-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewport("desktop")}
            className={`h-6 w-6 p-0 ${viewport === "desktop" ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
            title="Desktop"
          >
            <Monitor className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewport("tablet")}
            className={`h-6 w-6 p-0 ${viewport === "tablet" ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
            title="Tablet (768px)"
          >
            <Tablet className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewport("mobile")}
            className={`h-6 w-6 p-0 ${viewport === "mobile" ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
            title="Mobile (375px)"
          >
            <Smartphone className="w-3 h-3" />
          </Button>
        </div>

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
      </div>

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
              boxShadow: viewport !== "desktop" ? "0 0 0 1px rgba(255,255,255,0.08), 4px 0 20px rgba(0,0,0,0.4), -4px 0 20px rgba(0,0,0,0.4)" : "none",
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
