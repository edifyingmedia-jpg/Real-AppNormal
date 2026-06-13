import { useState, useRef, useEffect, useCallback } from "react";
import { useGetAnthropicConversation, useCreateProjectFile, useUpdateProjectFile, getGetAnthropicConversationQueryKey, getGetProjectQueryKey, getListProjectFilesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface ParsedFile {
  filename: string;
  language: string;
  content: string;
}

interface ChatPanelProps {
  projectId: number;
  conversationId: number;
}

export function ChatPanel({ projectId, conversationId }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const { data: conversation, isLoading } = useGetAnthropicConversation(conversationId, {
    query: { queryKey: getGetAnthropicConversationQueryKey(conversationId) },
  });

  const createFile = useCreateProjectFile();
  const updateFile = useUpdateProjectFile();

  const messages = conversation?.messages ?? [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const applyFilesToProject = useCallback(async (files: ParsedFile[], existingFiles: { id: number; filename: string }[]) => {
    for (const file of files) {
      const existing = existingFiles.find((f) => f.filename === file.filename);
      if (existing) {
        await updateFile.mutateAsync({ id: projectId, fileId: existing.id, data: { content: file.content, language: file.language } });
      } else {
        await createFile.mutateAsync({ id: projectId, data: { filename: file.filename, content: file.content, language: file.language } });
      }
    }
    queryClient.invalidateQueries({ queryKey: getListProjectFilesQueryKey(projectId) });
    queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
  }, [projectId, createFile, updateFile, queryClient]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch(`/api/anthropic/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

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
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) break;
              if (data.content) {
                fullText += data.content;
                setStreamingContent(fullText);
              }
            } catch {
              // skip malformed
            }
          }
        }
      }

      // Parse AI response for files
      try {
        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.files && Array.isArray(parsed.files)) {
            const currentFiles = queryClient.getQueryData<{ id: number; filename: string }[]>(getListProjectFilesQueryKey(projectId)) || [];
            await applyFilesToProject(parsed.files, currentFiles);
          }
        }
      } catch {
        // AI didn't return JSON files — that's fine
      }

      setStreamingContent("");
      queryClient.invalidateQueries({ queryKey: getGetAnthropicConversationQueryKey(conversationId) });
    } catch (err) {
      setStreamingContent("Error: failed to get response.");
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.explanation) return parsed.explanation;
      }
    } catch {
      // not JSON
    }
    return content;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-sidebar-border shrink-0">
        <h2 className="text-sm font-semibold text-sidebar-foreground">AI Chat</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Describe what you want to build</p>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading conversation...
            </div>
          )}

          {messages.length === 0 && !isLoading && !isStreaming && (
            <div className="text-center py-12">
              <Bot className="w-10 h-10 text-primary/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Start chatting to generate your app</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted/60 text-foreground border border-border/50 rounded-tl-sm"}`}>
                {msg.role === "assistant" ? formatMessageContent(msg.content) : msg.content}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex gap-2.5 flex-row">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed bg-muted/60 text-foreground border border-border/50 rounded-tl-sm">
                {streamingContent ? (
                  <span>{formatMessageContent(streamingContent)}<span className="inline-block w-1.5 h-3.5 bg-primary ml-0.5 animate-pulse rounded-sm" /></span>
                ) : (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-sidebar-border shrink-0">
        <div className="flex gap-2 items-end bg-muted/40 rounded-xl border border-border/60 px-3 py-2">
          <textarea
            ref={textareaRef}
            data-testid="input-chat-message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the app you want to build..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground min-h-[24px] max-h-[120px] leading-6 py-0.5 disabled:opacity-60"
            style={{ height: "auto" }}
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
            {isStreaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 px-1">Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  );
}
