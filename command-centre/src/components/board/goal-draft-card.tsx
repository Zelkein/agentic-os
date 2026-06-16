"use client";

import { Paperclip, Trash2 } from "lucide-react";
import type { GoalDraftPayload } from "@/types/goal-draft";

const MONO = "'DM Mono', 'JetBrains Mono', 'SF Mono', ui-monospace, monospace";
const DRAFT_ACCENT = "#4F7CAC";

function timeAgo(dateStr: string): string {
  const timestamp = new Date(dateStr).getTime();
  if (Number.isNaN(timestamp)) return "--";
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getDraftBodyPreview(draft: GoalDraftPayload): string {
  const trimmedMessage = draft.message.trim();
  if (trimmedMessage) {
    const firstLine = trimmedMessage.split("\n").find((line) => line.trim().length > 0) ?? trimmedMessage;
    return firstLine.length > 120 ? `${firstLine.slice(0, 117)}...` : firstLine;
  }
  if (draft.attachments.length > 0) {
    return draft.attachments.length === 1
      ? `1 attached file`
      : `${draft.attachments.length} attached files`;
  }
  return "No details yet";
}

export function GoalDraftCard({
  draft,
  isActive,
  onOpen,
  onDiscard,
}: {
  draft: GoalDraftPayload;
  isActive?: boolean;
  onOpen: (draftId: string) => void;
  onDiscard: (draftId: string) => void;
}) {
  const title = draft.title.trim() || "Untitled draft";
  const preview = getDraftBodyPreview(draft);

  return (
    <div
      data-card
      role="button"
      tabIndex={0}
      onClick={() => onOpen(draft.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(draft.id);
        }
      }}
      style={{
        background: "linear-gradient(180deg, rgba(242, 247, 252, 0.96), rgba(236, 243, 250, 0.98))",
        borderTop: `1px solid ${isActive ? "rgba(79, 124, 172, 0.55)" : "rgba(79, 124, 172, 0.28)"}`,
        borderRight: `1px solid ${isActive ? "rgba(79, 124, 172, 0.55)" : "rgba(79, 124, 172, 0.28)"}`,
        borderBottom: "none",
        borderLeft: `3px solid ${DRAFT_ACCENT}`,
        borderRadius: 0,
        padding: "8px 12px",
        cursor: "pointer",
        position: "relative",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        boxShadow: isActive ? "inset 0 0 0 0.5px rgba(79, 124, 172, 0.18)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 18,
                padding: "0 7px",
                borderRadius: 999,
                backgroundColor: "rgba(79, 124, 172, 0.12)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: DRAFT_ACCENT,
                fontFamily: MONO,
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              Draft
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                color: "#2C2C2C",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
                flex: 1,
              }}
              title={title}
            >
              {title}
            </span>
          </div>
          <div
            style={{
              marginTop: 5,
              fontSize: 12,
              lineHeight: 1.45,
              color: "#5F6C78",
              fontFamily: "var(--font-inter), Inter, sans-serif",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={preview}
          >
            {preview}
          </div>
          <div
            style={{
              marginTop: 7,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {draft.attachments.length > 0 ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10,
                  fontFamily: MONO,
                  color: "#7A8B99",
                }}
              >
                <Paperclip size={11} />
                {draft.attachments.length}
              </span>
            ) : null}
            <span
              style={{
                fontSize: 10,
                fontFamily: MONO,
                color: "#8FA0B0",
              }}
            >
              updated {timeAgo(draft.updatedAt)}
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-label={`Discard ${title}`}
          onClick={(event) => {
            event.stopPropagation();
            onDiscard(draft.id);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 999,
            border: "none",
            backgroundColor: "transparent",
            color: "#8FA0B0",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
