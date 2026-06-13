import { useState, useRef, useEffect, useCallback } from "react";
import {
  useGetAnthropicConversation,
  useCreateProjectFile,
  useUpdateProjectFile,
  getGetAnthropicConversationQueryKey,
  getGetProjectQueryKey,
  getListProjectFilesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";

interface ParsedFile {
  filename: string;
  language: string;
  content: string;
}

interface ParsedAIResponse {
  explanation: string;
  files: ParsedFile[];
}

interface ChatPanelProps {
  projectId: number;
  conversationId: number;
}

/**
 * Robustly extract a JSON object from AI output.
 * Handles: raw JSON, ```json ... ``` fences, ``` ... ``` fences, partial JSON during streaming.
 */
function extractJSON(text: string): ParsedAIResponse | null {
  // Strip markdown fences if present
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  // Try the stripped version first, then the original
  for (const candidate of [stripped, text]) {
    // Find the outermost { ... }
    const start = candidate.indexOf("{");
    if (start === -1) continue;
    // Walk backwards from the end to find the last }
    const end = candidate.lastIndexOf("}");
    if (end === -1 || end <= start) continue;
    const json = candidate.slice(start, end + 1);
    try {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.files)) {
        return parsed as ParsedAIResponse;
      }
    } catch {
      // not valid yet — might be partial during streaming
    }
  }
  return null;
}

/**
 * Extract just the explanation from partial streaming JSON.
 * Returns null if we can't find one yet.
 */
function extractStreamingExplanation(text: string): string | null {
  // Try full parse first
  const full = extractJSON(text);
  if (full?.explanation) return full.explanation;

  // Partial: look for "explanation": "..." even if JSON isn't closed
  const match = text.match(/"explanation"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (match) {
    try {
      return JSON.parse(`"${match[1]}"`);
    } catch {
      return match[1];
    }
  }
  return null;
}

export function ChatPanel({ projectId, conversationId }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingExplanation, setStreamingExplanation] = useState<string | null>(null);
  const [streamingPhase, setStreamingPhase] = useState<"thinking" | "writing" | "applying">("thinking");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const { data: conversation, isLoading } = useGetAnthropicConversation(conversationId, {
    query: { queryKey: getGetAnthropicConversationQueryKey(conversationId) },
  });

  const createFile = useCreateProjectFile();
  const updateFile = useUpdateProjectFile();

  const messages = conversation?.messages ?? [];

  // Scroll to bottom whenever messages or streaming content changes
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (el) {
      const viewport = el.querySelector("[data-radix-scroll-area-viewport]");
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages.length, streamingExplanation, isStreaming]);

  const applyFilesToProject = useCallback(
    async (files: ParsedFile[]) => {
      const currentFiles =
        queryClient.getQueryData<{ id: number; filename: string }[]>(
          getListProjectFilesQueryKey(projectId)
        ) || [];

      for (const file of files) {
        const existing = currentFiles.find((f) => f.filename === file.filename);
        if (existing) {
          await updateFile.mutateAsync({
            id: projectId,
            fileId: existing.id,
            data: { content: file.content, language: file.language },
          });
        } else {
          await createFile.mutateAsync({
            id: projectId,
            data: {
              filename: file.filename,
              content: file.content,
              language: file.language,
            },
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: getListProjectFilesQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
    },
    [projectId, createFile, updateFile, queryClient]
  );

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setIsStreaming(true);
    setStreamingExplanation(null);
    setStreamingPhase("thinking");

    try {
      const response = await fetch(
        `/api/anthropic/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: trimmed }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) break;
            if (data.content) {
              fullText += data.content;
              // Update streaming phase and extract partial explanation
              if (streamingPhase === "thinking") setStreamingPhase("writing");
              const expl = extractStreamingExplanation(fullText);
              if (expl) setStreamingExplanation(expl);
            }
          } catch {
            // skip malformed SSE chunk
          }
        }
      }

      // Apply files to project
      setStreamingPhase("applying");
      const parsed = extractJSON(fullText);
      if (parsed?.files?.length) {
        await applyFilesToProject(parsed.files);
      }

      queryClient.invalidateQueries({
        queryKey: getGetAnthropicConversationQueryKey(conversationId),
      });
    } catch (err) {
      setStreamingExplanation(
        err instanceof Error ? `Error: ${err.message}` : "Failed to get response."
      );
    } finally {
      setIsStreaming(false);
      setStreamingExplanation(null);
      setStreamingPhase("thinking");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /** Display text for a stored assistant message — strip the raw JSON, show explanation */
  const displayAssistantMessage = (content: string) => {
    const parsed = extractJSON(content);
    if (parsed?.explanation) return parsed.explanation;
    // Fallback: show raw content but strip obvious JSON bulk
    if (content.trim().startsWith("{")) return "Generated your app files.";
    return content;
  };

  const phaseLabel = {
    thinking: "Thinking...",
    writing: "Writing code...",
    applying: "Applying files...",
  }[streamingPhase];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-sidebar-border shrink-0">
        <h2 className="text-sm font-semibold text-sidebar-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          AI Chat
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Describe what you want to build</p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-4" ref={scrollAreaRef as any}>
        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading conversation...
            </div>
          )}

          {messages.length === 0 && !isLoading && !isStreaming && (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Ready to build</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Describe any web app — todo list, dashboard, game, landing page — and I'll generate it instantly.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted border border-border text-muted-foreground"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-3 h-3" />
                ) : (
                  <Bot className="w-3 h-3" />
                )}
              </div>
              <div
                className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-secondary/60 text-foreground border border-border/50 rounded-tl-sm"
                }`}
              >
                {msg.role === "assistant"
                  ? displayAssistantMessage(msg.content)
                  : msg.content}
              </div>
            </div>
          ))}

          {/* Streaming bubble */}
          {isStreaming && (
            <div className="flex gap-2.5 flex-row">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-muted border border-border text-muted-foreground">
                <Bot className="w-3 h-3" />
              </div>
              <div className="max-w-[84%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed bg-secondary/60 text-foreground border border-border/50 rounded-tl-sm">
                {streamingExplanation ? (
                  <span>
                    {streamingExplanation}
                    {streamingPhase === "writing" && (
                      <span className="inline-block w-1.5 h-3.5 bg-primary ml-0.5 animate-pulse rounded-sm align-middle" />
                    )}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                    <span className="text-xs">{phaseLabel}</span>
                  </span>
                )}
                {streamingPhase === "applying" && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-primary">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving files...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-sidebar-border shrink-0">
        <div className="flex gap-2 items-end bg-secondary/40 rounded-xl border border-border/60 px-3 py-2 focus-within:border-primary/50 transition-colors">
          <textarea
            ref={textareaRef}
            data-testid="input-chat-message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the app you want to build..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground min-h-[24px] max-h-[120px] leading-6 py-0.5 disabled:opacity-50"
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />
          <Button
            size="sm"
            data-testid="btn-send-message"
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="h-7 w-7 p-0 shrink-0 rounded-lg"
          >
            {isStreaming ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground/60 mt-1.5 px-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
