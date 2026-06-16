"use client";

import { useState } from "react";

interface MarkdownEditorProps {
  content: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function MarkdownEditor({ content, onSave, onCancel, isSaving }: MarkdownEditorProps) {
  const [localContent, setLocalContent] = useState(content);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <textarea
        value={localContent}
        onChange={(e) => setLocalContent(e.target.value)}
        style={{
          width: "100%",
          minHeight: 400,
          padding: 16,
          backgroundColor: "var(--card-bg)",
          border: "1px solid rgba(218, 193, 185, 0.2)",
          borderRadius: 8,
          fontFamily: "var(--font-space-grotesk), 'Space Grotesk', monospace",
          fontSize: 13,
          lineHeight: 1.6,
          color: "var(--text-primary)",
          resize: "vertical",
          outline: "none",
          transition: "border-color 200ms ease",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--accent-color)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(218, 193, 185, 0.2)";
        }}
      />
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          disabled={isSaving}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 14,
            fontWeight: 500,
            cursor: isSaving ? "not-allowed" : "pointer",
            padding: "8px 16px",
            textDecoration: "none",
            transition: "text-decoration 150ms ease",
          }}
          onMouseEnter={(e) => {
            if (!isSaving) e.currentTarget.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = "none";
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(localContent)}
          disabled={isSaving}
          style={{
            background: "linear-gradient(135deg, #93452A 0%, #B25D3F 100%)",
            color: "var(--card-bg)",
            fontFamily: "var(--font-epilogue), Epilogue, sans-serif",
            fontWeight: 600,
            fontSize: 14,
            padding: "8px 20px",
            borderRadius: 8,
            border: "none",
            cursor: isSaving ? "not-allowed" : "pointer",
            opacity: isSaving ? 0.7 : 1,
            transition: "opacity 150ms ease",
          }}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
