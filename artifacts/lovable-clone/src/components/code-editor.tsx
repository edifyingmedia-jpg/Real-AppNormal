import { useState, useEffect, useRef, useCallback } from "react";
import { useUpdateProjectFile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCode, FileText, File, Save, Check, Loader2 } from "lucide-react";

interface ProjectFile {
  id: number;
  projectId: number;
  filename: string;
  content: string;
  language: string;
}

interface CodeEditorProps {
  projectId: number;
  files: ProjectFile[];
  activeFileId: number | null;
  onFileSelect: (id: number) => void;
}

type SaveStatus = "saved" | "unsaved" | "saving";

function getFileIcon(filename: string) {
  if (filename.endsWith(".html")) return <FileText className="w-3.5 h-3.5" />;
  if (
    filename.endsWith(".css") ||
    filename.endsWith(".js") ||
    filename.endsWith(".ts") ||
    filename.endsWith(".tsx")
  )
    return <FileCode className="w-3.5 h-3.5" />;
  return <File className="w-3.5 h-3.5" />;
}

function getLanguageColor(language: string) {
  switch (language) {
    case "html": return "text-orange-400";
    case "css": return "text-blue-400";
    case "javascript": return "text-yellow-400";
    case "typescript": return "text-sky-400";
    default: return "text-muted-foreground";
  }
}

function getLineNumbers(content: string) {
  const lines = content.split("\n");
  return lines.map((_, i) => i + 1).join("\n");
}

export function CodeEditor({ projectId, files, activeFileId, onFileSelect }: CodeEditorProps) {
  const updateFile = useUpdateProjectFile();
  const [localContent, setLocalContent] = useState<Record<number, string>>({});
  const [savedContent, setSavedContent] = useState<Record<number, string>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const debounceRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0] || null;

  useEffect(() => {
    if (activeFile && localContent[activeFile.id] === undefined) {
      setLocalContent((prev) => ({ ...prev, [activeFile.id]: activeFile.content }));
      setSavedContent((prev) => ({ ...prev, [activeFile.id]: activeFile.content }));
    }
  }, [activeFile]);

  // Sync from AI-generated updates
  useEffect(() => {
    for (const file of files) {
      setLocalContent((prev) => {
        if (prev[file.id] !== file.content) {
          return { ...prev, [file.id]: file.content };
        }
        return prev;
      });
      setSavedContent((prev) => {
        if (prev[file.id] !== file.content) {
          return { ...prev, [file.id]: file.content };
        }
        return prev;
      });
    }
  }, [files]);

  const isUnsaved =
    activeFile !== null &&
    activeFile !== undefined &&
    localContent[activeFile.id] !== undefined &&
    savedContent[activeFile.id] !== undefined &&
    localContent[activeFile.id] !== savedContent[activeFile.id];

  useEffect(() => {
    setSaveStatus(isUnsaved ? "unsaved" : "saved");
  }, [isUnsaved]);

  const saveNow = useCallback(
    async (fileId: number, value: string) => {
      if (debounceRef.current[fileId]) {
        clearTimeout(debounceRef.current[fileId]);
        delete debounceRef.current[fileId];
      }
      setSaveStatus("saving");
      try {
        await updateFile.mutateAsync({ id: projectId, fileId, data: { content: value } });
        setSavedContent((prev) => ({ ...prev, [fileId]: value }));
        setSaveStatus("saved");
      } catch {
        setSaveStatus("unsaved");
      }
    },
    [projectId, updateFile]
  );

  const handleContentChange = (fileId: number, value: string) => {
    setLocalContent((prev) => ({ ...prev, [fileId]: value }));
    setSaveStatus("unsaved");

    if (debounceRef.current[fileId]) clearTimeout(debounceRef.current[fileId]);
    debounceRef.current[fileId] = setTimeout(() => {
      saveNow(fileId, value);
    }, 1200);
  };

  const handleManualSave = () => {
    if (activeFile && saveStatus === "unsaved") {
      const value = localContent[activeFile.id] ?? activeFile.content;
      saveNow(activeFile.id, value);
    }
  };

  // Ctrl/Cmd+S shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeFile, saveStatus, localContent]);

  const syncScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const content = activeFile ? (localContent[activeFile.id] ?? activeFile.content) : "";

  if (files.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="h-10 border-b border-border bg-card/50 flex items-center px-4 shrink-0">
          <span className="text-xs text-muted-foreground">No files yet</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <FileCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Start chatting to generate your app</p>
            <p className="text-xs mt-1 opacity-60">Files will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border/60 bg-[#161b22] overflow-x-auto shrink-0 h-10">
        {files.map((file) => (
          <button
            key={file.id}
            data-testid={`tab-file-${file.id}`}
            onClick={() => onFileSelect(file.id)}
            className={`flex items-center gap-1.5 px-4 h-full text-xs font-medium transition-colors whitespace-nowrap border-r border-border/40 relative shrink-0 ${
              file.id === activeFile?.id
                ? "text-foreground bg-[#0d1117] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-[#0d1117]/50"
            }`}
          >
            <span className={getLanguageColor(file.language)}>{getFileIcon(file.filename)}</span>
            {file.filename}
            {/* Unsaved dot */}
            {file.id === activeFile?.id &&
              localContent[file.id] !== undefined &&
              savedContent[file.id] !== undefined &&
              localContent[file.id] !== savedContent[file.id] && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" title="Unsaved changes" />
              )}
          </button>
        ))}

        {/* Spacer + save controls */}
        {activeFile && (
          <div className="ml-auto px-3 flex items-center gap-2 shrink-0">
            {saveStatus === "saving" && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                Saving…
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-[10px] text-emerald-500/80 flex items-center gap-1">
                <Check className="w-2.5 h-2.5" />
                Saved
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleManualSave}
              disabled={saveStatus !== "unsaved"}
              className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
              title="Save (Ctrl+S)"
            >
              <Save className="w-3 h-3" />
              Save
            </Button>
            <Badge variant="outline" className="text-[10px] h-5 border-border/50 text-muted-foreground">
              {activeFile.language}
            </Badge>
          </div>
        )}
      </div>

      {/* Editor area */}
      {activeFile && (
        <div className="flex-1 flex overflow-hidden font-mono text-sm">
          {/* Line numbers */}
          <div
            ref={lineNumbersRef}
            className="text-right pr-4 pl-3 py-4 text-muted-foreground/40 bg-[#0d1117] select-none overflow-hidden text-xs leading-6 shrink-0 min-w-[52px]"
            style={{ overflowY: "hidden" }}
          >
            <pre className="leading-6">{getLineNumbers(content)}</pre>
          </div>

          {/* Code textarea */}
          <textarea
            ref={textareaRef}
            data-testid={`editor-file-${activeFile.id}`}
            value={content}
            onChange={(e) => handleContentChange(activeFile.id, e.target.value)}
            onScroll={syncScroll}
            spellCheck={false}
            className="flex-1 bg-[#0d1117] text-[#e6edf3] resize-none outline-none py-4 pr-4 leading-6 text-xs overflow-auto"
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, monospace",
              tabSize: 2,
            }}
          />
        </div>
      )}
    </div>
  );
}
