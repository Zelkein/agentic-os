"use client";

import { useState, useEffect, useRef, FC } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useToast } from "../shared/toast";
import type { AgentChatSession, AgentChatMessage } from "@/types/agent-chat";
import type { ChatAttachment } from "@/types/chat-composer";
import { Plus, MessageSquare, Trash2 } from "lucide-react";

interface ChatWindowProps {
  agentId: string;
  userEmail: string;
}

const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-inter), Inter, sans-serif", ...s,
});
const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif", ...s,
});

export const ChatWindow: FC<ChatWindowProps> = ({ agentId, userEmail }) => {
  const [sessions, setSessions] = useState<AgentChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => { fetchSessions(); }, [agentId]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/agents/${agentId}/chat/sessions?userEmail=${encodeURIComponent(userEmail)}`
      );
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data: AgentChatSession[] = await res.json();
      setSessions(data);
      if (data.length > 0 && !currentSessionId) {
        setCurrentSessionId(data[0].id);
      }
    } catch (err) {
      toast("error", "Failed to load chat sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentSessionId) return;
    fetchMessages();
  }, [currentSessionId]);

  const fetchMessages = async () => {
    if (!currentSessionId) return;
    try {
      const res = await fetch(
        `/api/agents/${agentId}/chat/sessions/${currentSessionId}/messages`
      );
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data.messages || []);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      toast("error", "Failed to load messages");
    }
  };

  const createSession = async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/chat/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail, title: "New conversation" }),
      });
      if (!res.ok) throw new Error("Failed to create session");
      const data: AgentChatSession = await res.json();
      setSessions((prev) => [data, ...prev]);
      setCurrentSessionId(data.id);
      setMessages([]);
      toast("success", "New conversation created");
    } catch (err) {
      toast("error", "Failed to create session");
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm("Delete this conversation?")) return;
    try {
      await fetch(`/api/agents/${agentId}/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        setCurrentSessionId(remaining[0]?.id || null);
        setMessages([]);
      }
      toast("success", "Conversation deleted");
    } catch (err) {
      toast("error", "Failed to delete session");
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleSendMessage = async (content: string, attachments: ChatAttachment[] = []) => {
    if (!currentSessionId) return;
    setSending(true);

    let streamingAgentId: string | null = null;

    try {
      const res = await fetch(
        `/api/agents/${agentId}/chat/sessions/${currentSessionId}/messages?stream=1`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            files_json: attachments.length > 0 ? JSON.stringify(attachments) : undefined,
          }),
        }
      );
      if (!res.ok || !res.body) throw new Error("Failed to send message");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const handleEvent = (evt: Record<string, unknown>) => {
        switch (evt.type) {
          case "user":
            setMessages((prev) => [...prev, evt.message as AgentChatMessage]);
            scrollToBottom();
            break;
          case "start": {
            streamingAgentId = evt.id as string;
            const placeholder: AgentChatMessage = {
              id: evt.id as string,
              session_id: currentSessionId,
              role: "agent",
              content: "",
              files_json: "[]",
              model_used: null,
              cost_usd: null,
              created_at: (evt.created_at as string) ?? new Date().toISOString(),
            };
            setMessages((prev) => [...prev, placeholder]);
            scrollToBottom();
            break;
          }
          case "delta":
            setMessages((prev) =>
              prev.map((m) =>
                m.id === streamingAgentId
                  ? { ...m, content: m.content + (evt.text as string) }
                  : m
              )
            );
            scrollToBottom("auto");
            break;
          case "done":
            setMessages((prev) =>
              prev.map((m) =>
                m.id === streamingAgentId
                  ? {
                      ...m,
                      model_used: (evt.model_used as string) ?? m.model_used,
                      cost_usd: (evt.cost_usd as number) ?? m.cost_usd,
                    }
                  : m
              )
            );
            break;
          case "error":
            throw new Error((evt.error as string) || "Streaming error");
        }
      };

      // Read the NDJSON stream and render deltas in real time
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed) handleEvent(JSON.parse(trimmed));
        }
      }
      if (buffer.trim()) handleEvent(JSON.parse(buffer.trim()));

      scrollToBottom();

      // Update session title to first user message if untitled
      const session = sessions.find((s) => s.id === currentSessionId);
      if (session && !session.title) {
        const title =
          content.length > 50 ? content.slice(0, 47) + "..." : content;
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId ? { ...s, title } : s
          )
        );
      }
    } catch (err) {
      // Drop an empty streaming placeholder if the request failed mid-stream
      if (streamingAgentId) {
        setMessages((prev) =>
          prev.filter((m) => !(m.id === streamingAgentId && m.content === ""))
        );
      }
      toast("error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 80px)",
        border: "1px solid var(--border-color-secondary)",
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "var(--bg-tertiary)",
      }}
    >
      {/* -- Session sidebar -- */}
      {showSidebar && (
        <div
          style={{
            width: 260,
            borderRight: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-secondary)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={sg({ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 })}>
              Conversations
            </h3>
            <button
              onClick={createSession}
              style={{
                background: "var(--accent-light)",
                border: "none",
                borderRadius: 6,
                padding: 6,
                cursor: "pointer",
                color: "var(--accent-color)",
                display: "flex",
              }}
              title="New conversation"
            >
              <Plus size={16} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
            {loading && sessions.length === 0 ? (
              <div
                style={{
                  padding: 16,
                  textAlign: "center",
                  color: "var(--text-tertiary)",
                  fontSize: 13,
                  animation: "pulse-opacity 2s ease-in-out infinite",
                }}
              >
                Loading...
              </div>
            ) : sessions.length === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  color: "var(--text-tertiary)",
                }}
              >
                <MessageSquare
                  size={28}
                  color="var(--text-tertiary)"
                  style={{ marginBottom: 8, opacity: 0.4 }}
                />
                <p style={sp({ fontSize: 12, margin: 0 })}>No conversations yet</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setCurrentSessionId(session.id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    marginBottom: 4,
                    cursor: "pointer",
                    backgroundColor:
                      currentSessionId === session.id
                        ? "var(--accent-light)"
                        : "transparent",
                    color:
                      currentSessionId === session.id
                        ? "var(--accent-color)"
                        : "var(--text-secondary)",
                    transition: "all 120ms ease",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={sg({
                        fontSize: 13,
                        fontWeight:
                          currentSessionId === session.id ? 600 : 400,
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      })}
                    >
                      {session.title || "New conversation"}
                    </p>
                    <p style={sp({ fontSize: 10, color: "var(--text-tertiary)", margin: "2px 0 0" })}>
                      {new Date(session.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 4,
                      cursor: "pointer",
                      color: "var(--text-tertiary)",
                      opacity: 0.4,
                    }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* -- Main chat area -- */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Toggle sidebar + title */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "var(--text-secondary)",
            }}
          >
            <MessageSquare size={16} />
          </button>
          <span style={sg({ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" })}>
            {sessions.find((s) => s.id === currentSessionId)?.title ||
              "New conversation"}
          </span>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {messages.length === 0 && !loading && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-tertiary)",
              }}
            >
              <MessageSquare
                size={40}
                color="var(--text-tertiary)"
                style={{ marginBottom: 12, opacity: 0.3 }}
              />
              <p style={sg({ fontSize: 14, fontWeight: 500, margin: 0 })}>
                Start the conversation
              </p>
              <p style={sp({ fontSize: 12, margin: "4px 0 0" })}>
                Send a message to begin chatting with this agent
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isUser={msg.role === "user"}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          <ChatInput onSend={handleSendMessage} isLoading={sending} />
        </div>
      </div>
    </div>
  );
};