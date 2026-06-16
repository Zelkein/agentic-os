"use client";

import { FC, useMemo } from "react";
import type { AgentChatMessage } from "@/types/agent-chat";
import type { ChatAttachment } from "@/types/chat-composer";
import { ChatMessageAttachmentList } from "@/components/shared/chat-attachment-strip";
import { Brain } from "lucide-react";

interface ChatMessageProps {
  message: AgentChatMessage;
  isUser: boolean;
}

function parseAttachments(filesJson: string | null | undefined): ChatAttachment[] {
  if (!filesJson || filesJson === "[]" || filesJson === "null") return [];
  try {
    const parsed = JSON.parse(filesJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const ChatMessage: FC<ChatMessageProps> = ({ message, isUser }) => {
  const isAgent = message.role === "agent";
  const isSystem = message.role === "system";

  const attachments = useMemo(() => parseAttachments(message.files_json), [message.files_json]);

  const bgColor = isUser
    ? "var(--accent-color)"
    : isAgent
      ? "var(--bg-secondary)"
      : "rgba(251,191,36,0.12)";
  const textColor = isUser ? "var(--card-bg)" : "var(--text-primary)";
  const borderColor = isUser ? "transparent" : "var(--border-color-secondary)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        marginBottom: 16,
        maxWidth: "80%",
        alignSelf: isUser ? "flex-end" : "flex-start",
      }}
    >
      {/* Sender label for non-user messages */}
      {!isUser && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
            paddingLeft: 4,
          }}
        >
          {isAgent ? (
            <Brain size={12} color="var(--accent-color)" />
          ) : null}
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
              fontSize: 11,
              fontWeight: 600,
              color: isAgent ? "var(--accent-color)" : "var(--text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {isAgent ? "Agent" : "System"}
          </span>
        </div>
      )}
      {/* Message bubble */}
      <div
        style={{
          padding: "12px 16px",
          borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          backgroundColor: bgColor,
          color: textColor,
          border: `1px solid ${borderColor}`,
          fontFamily: "var(--font-inter), Inter, sans-serif",
          fontSize: 14,
          lineHeight: 1.6,
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
          transition: "all 150ms ease",
        }}
      >
        {message.content}
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <ChatMessageAttachmentList attachments={attachments} isUser={isUser} />
      )}

      {/* Meta row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 4,
          paddingLeft: isUser ? 0 : 4,
          paddingRight: isUser ? 4 : 0,
        }}
      >
        {!isUser && message.model_used && (
          <span
            style={{
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontSize: 10,
              color: "var(--text-tertiary)",
            }}
          >
            {message.model_used}
          </span>
        )}
        {message.cost_usd != null && message.cost_usd > 0 && (
          <span
            style={{
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontSize: 10,
              color: "var(--text-tertiary)",
            }}
          >
            ${message.cost_usd.toFixed(4)}
          </span>
        )}
        <span
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 10,
            color: "var(--text-tertiary)",
          }}
        >
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
};