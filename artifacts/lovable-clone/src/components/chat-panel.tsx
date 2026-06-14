import { useState, useRef, useEffect, useCallback } from "react";
import {
  useGetAnthropicConversation,
  useCreateProjectFile,
  useUpdateProjectFile,
  usePushProjectToGithub,
  getGetAnthropicConversationQueryKey,
  getGetProjectQueryKey,
  getListProjectFilesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Zap,
  AlertTriangle,
  ArrowUp,
  Link2,
  X,
  Wrench,
  Github,
} from "lucide-react";
import type { PreviewError } from "@/components/preview-panel";

interface ParsedFile {
  filename: string;
  language: string;
  content: string;
}

interface ParsedAIResponse {
  explanation: string;
  files: ParsedFile[];
}

interface CreditInfo {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
}

interface ChatPanelProps {
  projectId: number;
  conversationId: number;
  previewErrors?: PreviewError[];
  onErrorsFixed?: () => void;
  autoPushToGithub?: boolean | null;
  githubRepo?: string | null;
}

function extractJSON(text: string): ParsedAIResponse | null {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  for (const candidate of [stripped, text]) {
    const start = candidate.indexOf("{");
    if (start === -1) continue;
    const end = candidate.lastIndexOf("}");
    if (end === -1 || end <= start) continue;
    const json = candidate.slice(start, end + 1);
    try {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.files)) {
        return parsed as ParsedAIResponse;
      }
    } catch {
      // partial during streaming
    }
  }
  return null;
}

function extractStreamingExplanation(text: string): string | null {
  const full = extractJSON(text);
  if (full?.explanation) return full.explanation;
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

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

function CreditMeter({ credits }: { credits: CreditInfo }) {
  const pct = Math.min(100, credits.percentage);
  const remaining = credits.remaining;
  const isLow = remaining / credits.limit <= 0.15;
  const isExhausted = remaining <= 0;

  const barColor = isExhausted ? "bg-destructive" : isLow ? "bg-amber-500" : "bg-primary";

  return (
    <div className="px-3 py-2 border-b border-sidebar-border bg-sidebar/60">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
          <Zap className="w-2.5 h-2.5" />
          AI Credits
        </span>
        <span
          className={`text-[10px] font-medium ${isExhausted ? "text-destructive" : isLow ? "text-amber-500" : "text-muted-foreground"}`}
        >
          {isExhausted ? "Exhausted" : `${formatTokens(remaining)} left`}
        </span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${100 - pct}%` }}
        />
      </div>
      {isLow && !isExhausted && (
        <p className="text-[10px] text-amber-500/80 mt-1">Running low — upgrade for more credits</p>
      )}
      {isExhausted && (
        <p className="text-[10px] text-destructive/80 mt-1">
          Upgrade to continue building
        </p>
      )}
    </div>
  );
}

function UpgradeBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="mx-3 mb-2 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/10 border border-primary/20 p-3 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-foreground mb-0.5 flex items-center gap-1">
            <Zap className="w-3 h-3 text-primary" />
            Upgrade for more credits
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Get 100–300 credits/month plus priority generation and GitHub publishing.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2.5">
        <Button
          size="sm"
          className="h-7 text-xs flex-1 gap-1"
          onClick={() => (window.location.href = "/#pricing")}
        >
          <ArrowUp className="w-3 h-3" />
          View Plans
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onDismiss}>
          Later
        </Button>
      </div>
    </div>
  );
}

function ErrorFixBanner({
  errors,
  onFix,
  onDismiss,
  disabled,
}: {
  errors: PreviewError[];
  onFix: () => void;
  onDismiss: () => void;
  disabled: boolean;
}) {
  const count = errors.length;
  return (
    <div className="mx-3 mb-2 rounded-xl bg-destructive/10 border border-destructive/25 p-3 text-xs">
      <div className="flex items-start gap-2 mb-2">
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-destructive">
            {count === 1 ? "1 error detected" : `${count} errors detected`}
          </p>
          <p className="text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
            {errors[0].message}
            {count > 1 && ` (+${count - 1} more)`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="destructive"
          className="h-7 text-xs flex-1 gap-1.5"
          onClick={onFix}
          disabled={disabled}
        >
          {disabled ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Wrench className="w-3 h-3" />
          )}
          {disabled ? "Fixing…" : "Fix Errors"}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}

export function ChatPanel({
  projectId,
  conversationId,
  previewErrors = [],
  onErrorsFixed,
  autoPushToGithub,
  githubRepo,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingExplanation, setStreamingExplanation] = useState<string | null>(null);
  const [streamingPhase, setStreamingPhase] = useState<"thinking" | "writing" | "applying">("thinking");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamWarning, setStreamWarning] = useState<string | null>(null);
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const [dismissedErrors, setDismissedErrors] = useState(false);
  const [cloneMode, setCloneMode] = useState(false);
  const [cloneUrl, setCloneUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [isAutoPushing, setIsAutoPushing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const { data: conversation, isLoading } = useGetAnthropicConversation(conversationId, {
    query: { queryKey: getGetAnthropicConversationQueryKey(conversationId) },
  });

  const createFile = useCreateProjectFile();
  const updateFile = useUpdateProjectFile();
  const pushToGithub = usePushProjectToGithub();

  const messages = conversation?.messages ?? [];

  // Show errors panel whenever new errors arrive (and not dismissed)
  const activeErrors = dismissedErrors ? [] : previewErrors;
  useEffect(() => {
    if (previewErrors.length > 0) setDismissedErrors(false);
  }, [previewErrors]);

  // Initialize credit display from conversation data
  useEffect(() => {
    if (conversation && credits === null) {
      setCredits({
        used: conversation.tokensUsed,
        limit: conversation.creditLimit,
        remaining: conversation.creditLimit - conversation.tokensUsed,
        percentage: Math.round((conversation.tokensUsed / conversation.creditLimit) * 100),
      });
    }
  }, [conversation, credits]);

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
            data: { filename: file.filename, content: file.content, language: file.language },
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: getListProjectFilesQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
    },
    [projectId, createFile, updateFile, queryClient]
  );

  const isCreditsExhausted = credits !== null && credits.remaining <= 0;

  const handleClone = async () => {
    const url = cloneUrl.trim();
    if (!url || isScraping || isStreaming) return;
    setIsScraping(true);
    setScrapeError(null);
    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
      const data = (await res.json()) as {
        url: string;
        title: string;
        description: string;
        html: string;
        truncated: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to scrape URL");
      const message = `Clone this website faithfully — reproduce the exact layout, colors, typography, and all sections.\nURL: ${data.url}\nTitle: ${data.title}${data.description ? `\nDescription: ${data.description}` : ""}\n\nHTML source:\n${data.html}${data.truncated ? "\n\n[Note: HTML was truncated at 80kb]" : ""}`;
      setCloneMode(false);
      setCloneUrl("");
      await sendMessage(message);
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : "Failed to fetch URL");
    } finally {
      setIsScraping(false);
    }
  };

  const sendMessage = async (overrideContent?: string) => {
    const trimmed = (overrideContent ?? input).trim();
    if (!trimmed || isStreaming || isCreditsExhausted) return;

    if (!overrideContent) {
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
    setIsStreaming(true);
    setStreamingExplanation(null);
    setStreamingPhase("thinking");
    setStreamError(null);
    setStreamWarning(null);

    try {
      const response = await fetch(`/api/anthropic/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      let serverError: string | null = null;
      let serverWarning: string | null = null;

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) break outer;

            if (data.credits) {
              setCredits(data.credits as CreditInfo);
              queryClient.invalidateQueries({
                queryKey: getGetAnthropicConversationQueryKey(conversationId),
              });
            }

            if (data.warning === "LOW_CREDITS") {
              serverWarning = data.message as string;
              setShowUpgradeBanner(true);
            }

            if (data.error === "CREDITS_EXHAUSTED") {
              serverError = data.message as string;
              if (data.credits) setCredits(data.credits as CreditInfo);
              setShowUpgradeBanner(true);
            } else if (data.error === "TRUNCATED") {
              serverError = data.message as string;
            } else if (data.error) {
              serverError = (data.message ?? data.error) as string;
            } else if (data.content) {
              fullText += data.content;
              if (streamingPhase === "thinking") setStreamingPhase("writing");
              const expl = extractStreamingExplanation(fullText);
              if (expl) setStreamingExplanation(expl);
            }
          } catch {
            // skip malformed chunk
          }
        }
      }

      if (serverWarning && !serverError) setStreamWarning(serverWarning);

      if (serverError) {
        setStreamError(serverError);
      } else {
        setStreamingPhase("applying");
        const parsed = extractJSON(fullText);
        if (parsed?.files?.length) {
          await applyFilesToProject(parsed.files);
          // Clear errors after successful fix
          onErrorsFixed?.();
          setDismissedErrors(true);
          // Auto-push to GitHub if enabled and configured
          if (autoPushToGithub && githubRepo) {
            setIsAutoPushing(true);
            try {
              await pushToGithub.mutateAsync({ id: projectId });
            } catch {
              // Silent failure — user can push manually
            } finally {
              setIsAutoPushing(false);
            }
          }
        } else if (fullText.trim()) {
          setStreamError("Couldn't parse the AI response into files. Try rephrasing your request.");
        }
      }

      queryClient.invalidateQueries({
        queryKey: getGetAnthropicConversationQueryKey(conversationId),
      });
    } catch (err) {
      setStreamError(
        err instanceof Error ? `Error: ${err.message}` : "Failed to get response."
      );
    } finally {
      setIsStreaming(false);
      setStreamingExplanation(null);
      setStreamingPhase("thinking");
    }
  };

  const handleFixErrors = async () => {
    if (!activeErrors.length || isStreaming) return;
    const errorLines = activeErrors
      .slice(0, 8)
      .map((e, i) => {
        const loc = e.line ? ` (line ${e.line}${e.col ? `, col ${e.col}` : ""})` : "";
        return `${i + 1}. ${e.message}${loc}`;
      })
      .join("\n");

    const message =
      `The preview has the following JavaScript errors. Please fix all of them and review the full code for any related bugs:\n\n${errorLines}\n\nReturn a corrected version of all files with every error resolved.`;
    setDismissedErrors(true);
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const displayAssistantMessage = (content: string) => {
    const parsed = extractJSON(content);
    if (parsed?.explanation) return parsed.explanation;
    if (content.trim().startsWith("{")) return "Generated your app files.";
    return content;
  };

  const phaseLabel = {
    thinking: "Thinking…",
    writing: "Writing code…",
    applying: "Applying files…",
  }[streamingPhase];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-sidebar-border shrink-0">
        <h2 className="text-sm font-semibold text-sidebar-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          AI Chat
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Describe what you want to build or change</p>
      </div>

      {/* Credit meter */}
      {credits !== null && <CreditMeter credits={credits} />}

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-4" ref={scrollAreaRef as React.Ref<HTMLDivElement>}>
        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading conversation…
            </div>
          )}

          {messages.length === 0 && !isLoading && !isStreaming && (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Ready to build</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Describe any web app — todo list, dashboard, game, landing page — and I'll generate it instantly.
              </p>
              <div className="mt-4 space-y-1.5">
                {[
                  "Build a Kanban board with drag-and-drop",
                  "Create a Pomodoro timer app",
                  "Make a notes app with markdown support",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-secondary/60 hover:bg-secondary border border-border/50 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
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
                {msg.role === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
              </div>
              <div
                className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-secondary/60 text-foreground border border-border/50 rounded-tl-sm"
                }`}
              >
                {msg.role === "assistant" ? displayAssistantMessage(msg.content) : msg.content}
              </div>
            </div>
          ))}

          {/* Warning */}
          {streamWarning && !isStreaming && (
            <div className="flex gap-2.5 flex-row">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-500">
                <AlertTriangle className="w-3 h-3" />
              </div>
              <div className="max-w-[84%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-tl-sm">
                {streamWarning}
              </div>
            </div>
          )}

          {/* Error */}
          {streamError && !isStreaming && (
            <div className="flex gap-2.5 flex-row">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-destructive/10 border border-destructive/30 text-destructive">
                <Bot className="w-3 h-3" />
              </div>
              <div className="max-w-[84%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed bg-destructive/10 text-destructive border border-destructive/30 rounded-tl-sm">
                {streamError}
              </div>
            </div>
          )}

          {/* Streaming */}
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
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </span>
                    <span className="text-xs">{phaseLabel}</span>
                  </span>
                )}
                {streamingPhase === "applying" && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-primary">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving files…
                  </div>
                )}
                {isAutoPushing && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Github className="w-3 h-3 animate-pulse" />
                    Pushing to GitHub…
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Upgrade banner */}
      {showUpgradeBanner && <UpgradeBanner onDismiss={() => setShowUpgradeBanner(false)} />}

      {/* Error fix banner */}
      {activeErrors.length > 0 && !isCreditsExhausted && (
        <ErrorFixBanner
          errors={activeErrors}
          onFix={handleFixErrors}
          onDismiss={() => setDismissedErrors(true)}
          disabled={isStreaming}
        />
      )}

      {/* Input area */}
      <div className="p-3 border-t border-sidebar-border shrink-0">
        {isCreditsExhausted ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-center">
            <p className="text-xs text-destructive font-medium mb-2">Credits exhausted</p>
            <Button
              size="sm"
              className="w-full h-7 text-xs gap-1"
              onClick={() => (window.location.href = "/#pricing")}
            >
              <Zap className="w-3 h-3" />
              View Plans — Get More Credits
            </Button>
          </div>
        ) : (
          <>
            {cloneMode && (
              <div className="mb-2">
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    value={cloneUrl}
                    onChange={(e) => {
                      setCloneUrl(e.target.value);
                      setScrapeError(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleClone()}
                    placeholder="https://example.com"
                    autoFocus
                    disabled={isScraping || isStreaming}
                    className="flex-1 bg-secondary/40 rounded-lg border border-border/60 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
                  />
                  <Button
                    size="sm"
                    onClick={handleClone}
                    disabled={!cloneUrl.trim() || isScraping || isStreaming}
                    className="h-7 text-xs gap-1 shrink-0"
                  >
                    {isScraping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                    {isScraping ? "Fetching…" : "Clone"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCloneMode(false);
                      setCloneUrl("");
                      setScrapeError(null);
                    }}
                    className="h-7 w-7 p-0 shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                {scrapeError && (
                  <p className="text-[11px] text-destructive mt-1 px-1">{scrapeError}</p>
                )}
              </div>
            )}

            <div className="flex gap-2 items-end bg-secondary/40 rounded-xl border border-border/60 px-3 py-2 focus-within:border-primary/50 transition-colors">
              <textarea
                ref={textareaRef}
                data-testid="input-chat-message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what to build or change…"
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
                onClick={() => sendMessage()}
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
            <div className="flex items-center justify-between mt-1.5 px-1">
              <p className="text-[11px] text-muted-foreground/60">Enter to send · Shift+Enter for new line</p>
              {!cloneMode && (
                <button
                  onClick={() => {
                    setCloneMode(true);
                    setScrapeError(null);
                  }}
                  disabled={isStreaming}
                  className="text-[11px] text-muted-foreground/50 hover:text-primary flex items-center gap-0.5 transition-colors disabled:pointer-events-none"
                >
                  <Link2 className="w-2.5 h-2.5" />
                  Clone a site
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
