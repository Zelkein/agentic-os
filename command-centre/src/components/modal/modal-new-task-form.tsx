"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import type { TaskLevel } from "@/types/task";
import { useTaskStore } from "@/store/task-store";

import { LEVEL_LABELS, LEVEL_HINTS } from "@/lib/levels";

const levels: { value: TaskLevel; label: string; hint: string }[] = [
  { value: "task", label: LEVEL_LABELS.task, hint: LEVEL_HINTS.task },
  { value: "project", label: LEVEL_LABELS.project, hint: LEVEL_HINTS.project },
  { value: "gsd", label: LEVEL_LABELS.gsd, hint: LEVEL_HINTS.gsd },
];

interface ModalNewTaskFormProps {
  attachedFile: { fileName: string; relativePath: string };
  projectSlug: string | null;
  onCancel: () => void;
  onCreated: () => void;
}

export function ModalNewTaskForm({
  attachedFile,
  projectSlug,
  onCancel,
  onCreated,
}: ModalNewTaskFormProps) {
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<TaskLevel>("task");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createTask = useTaskStore((s) => s.createTask);


  const descRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus description on mount
  useEffect(() => {
    descRef.current?.focus();
  }, []);

  // Auto-grow textarea
  const adjustTextareaHeight = useCallback(() => {
    const el = descRef.current;
    if (!el) return;
    el.style.height = "80px";
    const scrollH = el.scrollHeight;
    el.style.height = Math.min(Math.max(scrollH, 80), 200) + "px";
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmedDesc = description.trim();
    if (!trimmedDesc || isSubmitting) return;
    setIsSubmitting(true);

    // Build description with attached file
    let fullDescription = trimmedDesc;
    const attachmentBlock = `\n\nAttached files:\n- ${attachedFile.relativePath}`;
    fullDescription = fullDescription + attachmentBlock;

    // Quick fallback title from first line
    const firstLine = fullDescription.split("\n")[0];
    const firstSentence = firstLine.match(/^[^.!?]+[.!?]?/)?.[0] || firstLine;
    const fallbackTitle = firstSentence.length <= 60
      ? firstSentence
      : firstSentence.slice(0, 57).replace(/\s+\S*$/, "") + "...";

    createTask(fallbackTitle, fullDescription, level, projectSlug).then(() => {
      onCreated();
    }).finally(() => {
      setIsSubmitting(false);
    });
  }, [description, level, attachedFile, projectSlug, isSubmitting, createTask, onCreated]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 24px",
          borderBottom: "1px solid var(--border-color)",
          backgroundColor: "var(--pane-bg)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onCancel}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
            color: "var(--accent-color)",
            padding: "4px 8px",
            borderRadius: 4,
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "var(--font-epilogue), Epilogue, sans-serif",
            color: "var(--text-primary)",
          }}
        >
          New Task
        </span>
      </div>

      {/* Form */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          maxWidth: 640,
        }}
      >
        {/* Attached file chip */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-secondary)",
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            Attached Output
          </label>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 8,
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid rgba(218, 193, 185, 0.2)",
            }}
          >
            <FileText size={16} style={{ color: "var(--accent-color)", flexShrink: 0 }} />
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  color: "var(--text-primary)",
                }}
              >
                {attachedFile.fileName}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                  color: "var(--text-tertiary)",
                  marginTop: 1,
                }}
              >
                {attachedFile.relativePath}
              </div>
            </div>
          </div>
        </div>

        {/* Task details */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-secondary)",
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            What should Claude do?
          </label>
          <textarea
            ref={descRef}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={isSubmitting}
            placeholder="Describe the task — a short title will be generated automatically..."
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 14,
              fontFamily: "var(--font-inter), Inter, sans-serif",
              backgroundColor: "var(--card-bg)",
              border: "1px solid rgba(218, 193, 185, 0.3)",
              borderRadius: 8,
              outline: "none",
              color: "var(--text-primary)",
              resize: "none",
              minHeight: 100,
              maxHeight: 200,
              lineHeight: "1.5",
              transition: "border-color 150ms ease",
              boxSizing: "border-box" as const,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-color)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(218, 193, 185, 0.3)"; }}
          />
        </div>

        {/* Bottom bar: level + submit */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Level selector */}
          <div
            style={{
              display: "flex",
              gap: 2,
              backgroundColor: "var(--skeleton-bg)",
              borderRadius: 6,
              padding: 2,
              height: 32,
              alignItems: "center",
            }}
          >
            {levels.map((l) => (
              <button
                key={l.value}
                onClick={() => setLevel(l.value)}
                title={l.hint}
                style={{
                  padding: "0 14px",
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 4,
                  height: 28,
                  backgroundColor: level === l.value ? "var(--accent-terracotta-light-bg)" : "transparent",
                  color: level === l.value ? "var(--accent-terracotta-text)" : "var(--text-secondary)",
                  transition: "all 150ms ease",
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--font-inter), Inter, sans-serif",
              color: "var(--text-tertiary)",
              marginTop: 6,
              minHeight: 16,
            }}
          >
            {levels.find((l) => l.value === level)?.hint}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onCancel}
              style={{
                padding: "6px 16px",
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                border: "1px solid rgba(218, 193, 185, 0.3)",
                borderRadius: "0.375rem",
                backgroundColor: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-secondary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!description.trim() || isSubmitting}
              style={{
                background: description.trim()
                  ? "linear-gradient(135deg, #93452A, #B25D3F)"
                  : "var(--border-color)",
                color: "var(--card-bg)",
                border: "none",
                borderRadius: "0.375rem",
                padding: "6px 16px",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                cursor: description.trim() ? "pointer" : "default",
                opacity: isSubmitting ? 0.6 : 1,
                transition: "all 150ms ease",
              }}
            >
              {isSubmitting ? "Sending..." : "Send to Claude"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
