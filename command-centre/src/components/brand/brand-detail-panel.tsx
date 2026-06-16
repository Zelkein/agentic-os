"use client";

import { useState, useEffect, useCallback } from "react";
import { Pencil, Eye, Trash2 } from "lucide-react";
import { SlideOutPanel } from "@/components/shared/slide-out-panel";
import { MarkdownPreview } from "@/components/shared/markdown-preview";
import { MarkdownEditor } from "@/components/shared/markdown-editor";
import { useClientId, appendClientId } from "@/hooks/use-client-id";
import type { FileContent } from "@/types/file";

interface BrandDetailPanelProps {
  path: string | null;
  onClose: () => void;
  onFileDeleted?: () => void;
}

function toTitleCase(name: string): string {
  return name
    .replace(/\.md$/, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function BrandDetailPanel({ path, onClose, onFileDeleted }: BrandDetailPanelProps) {
  const clientId = useClientId();
  const [file, setFile] = useState<FileContent | null>(null);
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFile = useCallback(async (filePath: string) => {
    setLoading(true);
    setError(null);
    setConflict(false);
    setMode("preview");
    try {
      const res = await fetch(appendClientId(`/api/files/${encodeURIComponent(filePath)}`, clientId));
      if (!res.ok) throw new Error("Failed to load file");
      const data: FileContent = await res.json();
      setFile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
      setFile(null);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (path) {
      fetchFile(path);
    } else {
      setFile(null);
      setMode("preview");
    }
  }, [path, fetchFile]);

  const handleSave = async (content: string) => {
    if (!file || !path) return;
    setIsSaving(true);
    setConflict(false);
    try {
      const res = await fetch(appendClientId(`/api/files/${encodeURIComponent(path)}`, clientId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, lastModified: file.lastModified }),
      });
      if (res.status === 409) {
        setConflict(true);
        return;
      }
      if (!res.ok) throw new Error("Save failed");
      const updated: FileContent = await res.json();
      setFile(updated);
      setMode("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!path) return;
    setIsDeleting(true);
    try {
      const res = await fetch(appendClientId(`/api/files/${encodeURIComponent(path)}`, clientId), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setFile(null);
      setShowDeleteConfirm(false);
      onClose();
      onFileDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const fileName = path ? path.split("/").pop() || path : "";
  const title = toTitleCase(fileName);

  return (
    <SlideOutPanel isOpen={!!path} onClose={onClose} title={title}>
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[300, 180, 260].map((w, i) => (
            <div
              key={i}
              style={{
                height: 16,
                width: w,
                maxWidth: "100%",
                backgroundColor: "var(--skeleton-bg)",
                borderRadius: 4,
                animation: "pulse-dot 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: "var(--error-bg)",
            padding: 16,
            borderRadius: "0.375rem",
          }}
        >
          <p style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 14, color: "var(--error)", fontWeight: 500, margin: 0 }}>
            {error}
          </p>
          <button
            onClick={() => path && fetchFile(path)}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-color)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              padding: 0,
              marginTop: 8,
              textDecoration: "underline",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && file && (
        <>
          {/* File path + mode toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: "1px solid rgba(218, 193, 185, 0.2)",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "var(--font-space-grotesk), Space Grotesk, monospace",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                {path}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  margin: "2px 0 0",
                }}
              >
                last modified: {formatRelativeTime(file.lastModified)}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setMode(mode === "preview" ? "edit" : "preview")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  border: "none",
                  borderRadius: "0.25rem",
                  backgroundColor: mode === "edit" ? "var(--accent-terracotta-light-bg)" : "var(--bg-secondary)",
                  color: mode === "edit" ? "var(--accent-terracotta-text)" : "var(--text-secondary)",
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background 150ms ease",
                }}
              >
                {mode === "preview" ? (
                  <>
                    <Pencil size={14} /> Edit
                  </>
                ) : (
                  <>
                    <Eye size={14} /> Preview
                  </>
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  border: "none",
                  borderRadius: "0.25rem",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background 150ms ease, color 150ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--error-bg)";
                  e.currentTarget.style.color = "var(--error)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>

          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div
              style={{
                backgroundColor: "var(--error-bg)",
                padding: 12,
                borderRadius: "0.375rem",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 13, color: "#991B1B", margin: 0 }}>
                Delete {fileName}? This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{
                    background: "var(--error)",
                    border: "none",
                    color: "var(--card-bg)",
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isDeleting ? "wait" : "pointer",
                    padding: "4px 12px",
                    borderRadius: "0.25rem",
                    opacity: isDeleting ? 0.6 : 1,
                  }}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          )}

          {/* Conflict warning */}
          {conflict && (
            <div
              style={{
                backgroundColor: "#FFFBEB",
                padding: 12,
                borderRadius: "0.375rem",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 13, color: "#92400E", margin: 0 }}>
                This file was modified by another process. Reload?
              </p>
              <button
                onClick={() => path && fetchFile(path)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-color)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Reload
              </button>
            </div>
          )}

          {/* Content */}
          {mode === "preview" ? (
            <MarkdownPreview content={file.content} />
          ) : (
            <MarkdownEditor
              content={file.content}
              onSave={handleSave}
              onCancel={() => setMode("preview")}
              isSaving={isSaving}
            />
          )}
        </>
      )}
    </SlideOutPanel>
  );
}
