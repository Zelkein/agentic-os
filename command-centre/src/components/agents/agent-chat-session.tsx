"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Loader2, AlertCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  created_at: string;
  tokens_used?: number;
  cost_usd?: number;
}

interface AgentChatSessionProps {
  agentId: string;
  sessionId: string;
  agentName: string;
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        gap: 4,
        maxWidth: "85%",
        alignSelf: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderRadius: isUser ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
          backgroundColor: isUser ? "var(--accent-terracotta)" : "var(--bg-tertiary)",
          color: isUser ? "#FFFFFF" : "var(--text-primary)",
          fontSize: 13,
          fontFamily: "var(--font-inter), Inter, sans-serif",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {message.content}
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          fontSize: 11,
          color: "var(--text-secondary)",
          paddingLeft: isUser ? 0 : 2,
          paddingRight: isUser ? 2 : 0,
        }}
      >
        <span>{formatTime(message.created_at)}</span>
        {!isUser && message.cost_usd && (
          <span>${message.cost_usd.toFixed(4)}</span>
        )}
      </div>
    </div>
  );
}

export function AgentChatSession({
  agentId,
  sessionId,
  agentName,
}: AgentChatSessionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const response = await fetch(
          `/api/agents/${agentId}/chat/sessions/${sessionId}/messages`
        );
        if (!response.ok) throw new Error("Failed to load messages");
        const data = await response.json();
        setMessages(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load messages");
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [agentId, sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || isLoading) return;

    try {
      setError(null);
      setIsLoading(true);
      setInput("");

      const response = await fetch(
        `/api/agents/${agentId}/chat/sessions/${sessionId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        data.user,
        data.agent,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      setInput(content);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, agentId, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        backgroundColor: "var(--bg-primary)",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {agentName}
        </h2>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {isLoadingMessages ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
            }}
          >
            <Loader2 size={20} style={{ animation: "spin 2s linear infinite" }} />
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              color: "var(--text-secondary)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 13,
              }}
            >
              Start a conversation with {agentName}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              backgroundColor: "rgba(220, 38, 38, 0.1)",
              border: "1px solid rgba(220, 38, 38, 0.3)",
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              color: "#DC2626",
              fontSize: 12,
            }}
          >
            <AlertCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          gap: 8,
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Type your message... (Shift+Enter for new line)"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 13,
            lineHeight: 1.5,
            resize: "none",
            maxHeight: 100,
            outline: "none",
          }}
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            border: "none",
            backgroundColor: input.trim() && !isLoading ? "#D97853" : "var(--border-color)",
            color: "#FFFFFF",
            cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 500,
            transition: "background-color 0.2s",
          }}
        >
          {isLoading ? (
            <Loader2 size={16} style={{ animation: "spin 2s linear infinite" }} />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
