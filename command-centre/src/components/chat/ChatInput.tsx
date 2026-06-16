"use client";

import { FC, useState, useRef, ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { Send, Loader2, Paperclip, X } from "lucide-react";
import { CHAT_ATTACHMENT_ACCEPT_ATTR } from "@/lib/chat-attachment-policy";
import type { ChatAttachment } from "@/types/chat-composer";

interface ChatInputProps {
  onSend: (message: string, attachments: ChatAttachment[]) => Promise<void>;
  isLoading?: boolean;
}

interface PendingAttachment {
  id: string;
  fileName: string;
  relativePath: string;
  extension: string;
  sizeBytes: number;
  contentType: string | null;
}

function getExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot >= 0 ? fileName.slice(lastDot + 1).toLowerCase() : "";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ChatInput: FC<ChatInputProps> = ({ onSend, isLoading = false }) => {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && attachments.length === 0) || isLoading) return;

    const chatAttachments: ChatAttachment[] = attachments.map((att) => ({
      id: att.id,
      fileName: att.fileName,
      relativePath: att.relativePath,
      extension: att.extension,
      sizeBytes: att.sizeBytes,
      contentType: att.contentType,
      surface: "conversation" as const,
      scopeId: "",
      draftKey: null,
      state: "sent" as const,
      uploadedAt: new Date().toISOString(),
    }));

    await onSend(content || "(sent attachment)", chatAttachments);
    setContent("");
    setAttachments([]);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const result = await res.json();
      const attachment: PendingAttachment = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        fileName: result.fileName,
        relativePath: result.relativePath,
        extension: result.extension,
        sizeBytes: result.sizeBytes,
        contentType: result.contentType ?? file.type ?? null,
      };
      setAttachments((prev) => [...prev, attachment]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const hasContent = content.trim().length > 0 || attachments.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Attachment preview strip */}
      {attachments.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {attachments.map((att) => (
            <div
              key={att.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px 4px 10px",
                borderRadius: 8,
                backgroundColor: "var(--accent-light)",
                border: "1px solid var(--border-color-secondary)",
                fontSize: 12,
                fontFamily: "var(--font-inter), Inter, sans-serif",
                color: "var(--text-primary)",
                maxWidth: 200,
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  fontSize: 12,
                }}
                title={`${att.fileName} (${formatBytes(att.sizeBytes)})`}
              >
                {att.fileName}
              </span>
              <button
                onClick={() => removeAttachment(att.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 2,
                  display: "flex",
                  color: "var(--text-tertiary)",
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <div
          style={{
            fontSize: 12,
            color: "var(--error)",
            fontFamily: "var(--font-inter), Inter, sans-serif",
            padding: "4px 0",
          }}
        >
          {uploadError}
          <button
            onClick={() => setUploadError(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--error)",
              marginLeft: 8,
              textDecoration: "underline",
              fontSize: 12,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
        }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          style={{ display: "none" }}
          accept={CHAT_ATTACHMENT_ACCEPT_ATTR}
        />

        {/* Attach file button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || uploading}
          title="Attach file"
          style={{
            flexShrink: 0,
            width: 44,
            height: 44,
            borderRadius: 10,
            border: "1px solid var(--border-color-tertiary)",
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-secondary)",
            cursor: isLoading || uploading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 150ms ease",
            opacity: isLoading || uploading ? 0.6 : 1,
          }}
        >
          {uploading ? (
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Paperclip size={18} />
          )}
        </button>

        <textarea
          value={content}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setContent(e.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          disabled={isLoading}
          rows={1}
          style={{
            flex: 1,
            minHeight: 44,
            maxHeight: 160,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid var(--border-color-tertiary)",
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 14,
            lineHeight: 1.5,
            resize: "none",
            outline: "none",
            opacity: isLoading ? 0.6 : 1,
            transition: "border-color 150ms ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-color)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border-color-tertiary)";
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !hasContent}
          style={{
            flexShrink: 0,
            width: 44,
            height: 44,
            borderRadius: 10,
            border: "none",
            backgroundColor: hasContent
              ? "var(--accent-color)"
              : "var(--bg-elevated)",
            color: hasContent ? "var(--card-bg)" : "var(--text-tertiary)",
            cursor: isLoading || !hasContent ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 150ms ease",
            opacity: isLoading ? 0.6 : 1,
          }}
          title="Send message"
        >
          {isLoading ? (
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
    </div>
  );
};