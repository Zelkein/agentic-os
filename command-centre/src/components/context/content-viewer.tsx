"use client";

import { useState, useEffect, useCallback } from "react";
import { Pencil, Eye, Trash2, Download } from "lucide-react";
import { MarkdownPreview } from "@/components/shared/markdown-preview";
import { MarkdownEditor } from "@/components/shared/markdown-editor";
import { useClientId, appendClientId } from "@/hooks/use-client-id";
import type { FileContent } from "@/types/file";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "ico"]);
const BINARY_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, "pdf"]);
const HTML_EXTENSIONS = new Set(["html", "htm"]);

interface ContentViewerProps {
  selectedPath: string | null;
  onFileDeleted?: () => void;
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

export function ContentViewer({ selectedPath, onFileDeleted }: ContentViewerProps) {
  const clientId = useClientId();
  const [file, setFile] = useState<FileContent | null>(null);
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getExtension = (p: string) => {
    const parts = p.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  };

  const isBinaryFile = selectedPath ? BINARY_EXTENSIONS.has(getExtension(selectedPath)) : false;
  const isHtmlFile = selectedPath ? HTML_EXTENSIONS.has(getExtension(selectedPath)) : false;
  const [htmlView, setHtmlView] = useState<"preview" | "source">("preview");
  // Treat paths without a file extension as directories — don't try to fetch as a file.
  const isDirectoryPath = selectedPath ? getExtension(selectedPath) === "" : false;

  const fetchFile = useCallback(async (filePath: string) => {
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    if (BINARY_EXTENSIONS.has(ext)) {
      // Binary files don't need text content fetch
      setFile({
        path: filePath,
        content: "",
        lastModified: new Date().toISOString(),
      });
      setLoading(false);
      return;
    }

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
    if (selectedPath && !isDirectoryPath) {
      fetchFile(selectedPath);
      setHtmlView("preview");
    } else {
      setFile(null);
      setError(null);
      setMode("preview");
    }
  }, [selectedPath, fetchFile, isDirectoryPath]);

  const handleSave = async (content: string) => {
    if (!file || !selectedPath) return;
    setIsSaving(true);
    setConflict(false);
    try {
      const res = await fetch(appendClientId(`/api/files/${encodeURIComponent(selectedPath)}`, clientId), {
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
    if (!selectedPath) return;
    setIsDeleting(true);
    try {
      const res = await fetch(appendClientId(`/api/files/${encodeURIComponent(selectedPath)}`, clientId), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setFile(null);
      setShowDeleteConfirm(false);
      onFileDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  // Empty state
  if (!selectedPath) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          minHeight: 400,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 14,
            color: "var(--text-secondary)",
          }}
        >
          Select a file from the tree to view its contents
        </p>
      </div>
    );
  }

  // Directory placeholder — the tree highlights the folder, viewer waits for a file pick.
  if (isDirectoryPath) {
    const folderName = selectedPath.split("/").filter(Boolean).pop() || selectedPath;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          minHeight: 400,
          padding: 24,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 14,
            color: "var(--text-secondary)",
            textAlign: "center",
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{folderName}</span>
          <br />
          Select a file from this folder in the tree to view it
        </p>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        {[720, 200, 500, 350].map((w, i) => (
          <div
            key={i}
            style={{
              height: 16,
              width: Math.min(w, 720),
              maxWidth: "100%",
              backgroundColor: "var(--skeleton-bg)",
              borderRadius: 4,
              animation: "pulse-dot 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div
          style={{
            backgroundColor: "var(--error-bg)",
            padding: 16,
            borderRadius: "0.5rem",
          }}
        >
          <p style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 14, color: "var(--error)", fontWeight: 500, margin: 0 }}>
            Unable to read file
          </p>
          <p style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 13, color: "var(--text-secondary)", margin: "8px 0 12px" }}>
            {error}
          </p>
          <button
            onClick={() => selectedPath && fetchFile(selectedPath)}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-color)",
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!file) return null;

  const fileName = selectedPath.split("/").pop() || selectedPath;
  const ext = getExtension(selectedPath);

  const handleDownload = () => {
    window.open(
      `/api/files/download?path=${encodeURIComponent(selectedPath)}`,
      "_blank"
    );
  };

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
          paddingBottom: 16,
          borderBottom: "1px solid rgba(218, 193, 185, 0.2)",
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "var(--font-epilogue), Epilogue, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            {fileName}
          </h3>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), Space Grotesk, monospace",
              fontSize: 11,
              color: "var(--text-secondary)",
              margin: "4px 0 0",
            }}
          >
            {selectedPath}
          </p>
          {!isBinaryFile && (
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
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {isBinaryFile ? (
            <button
              onClick={handleDownload}
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
                transition: "background 150ms ease",
              }}
            >
              <Download size={14} /> Download
            </button>
          ) : isHtmlFile ? (
            <div style={{ display: "flex", gap: 4 }}>
              {(["preview", "source"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setHtmlView(v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    border: "none",
                    borderRadius: "0.25rem",
                    backgroundColor: htmlView === v ? "var(--accent-terracotta-light-bg)" : "var(--bg-secondary)",
                    color: htmlView === v ? "var(--accent-terracotta-text)" : "var(--text-secondary)",
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "background 150ms ease",
                  }}
                >
                  {v === "preview" ? <><Eye size={14} /> Preview</> : <><Pencil size={14} /> Source</>}
                </button>
              ))}
            </div>
          ) : (
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
          )}
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
            onClick={() => selectedPath && fetchFile(selectedPath)}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-color)",
              fontFamily: "var(--font-inter), Inter, sans-serif",
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {isBinaryFile ? (
          <>
            {/* Image rendering */}
            {IMAGE_EXTENSIONS.has(ext) && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/files/preview?path=${encodeURIComponent(selectedPath)}`}
                  alt={fileName}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "70vh",
                    borderRadius: 8,
                    objectFit: "contain",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                  }}
                />
              </div>
            )}

            {/* PDF rendering */}
            {ext === "pdf" && (
              <iframe
                src={`/api/files/preview?path=${encodeURIComponent(selectedPath)}`}
                title={fileName}
                style={{
                  width: "100%",
                  height: "70vh",
                  border: "none",
                  borderRadius: 8,
                }}
              />
            )}
          </>
        ) : isHtmlFile ? (
          htmlView === "preview" ? (
            <iframe
              src={`/api/files/preview?path=${encodeURIComponent(selectedPath)}`}
              title={fileName}
              sandbox="allow-scripts allow-same-origin"
              style={{
                flex: 1,
                width: "100%",
                minHeight: "70vh",
                border: "1px solid var(--border-color)",
                borderRadius: 8,
                background: "var(--card-bg)",
              }}
            />
          ) : (
            <MarkdownEditor
              content={file.content}
              onSave={handleSave}
              onCancel={() => setHtmlView("preview")}
              isSaving={isSaving}
            />
          )
        ) : mode === "preview" ? (
          <MarkdownPreview content={file.content} />
        ) : (
          <MarkdownEditor
            content={file.content}
            onSave={handleSave}
            onCancel={() => setMode("preview")}
            isSaving={isSaving}
          />
        )}
      </div>
    </div>
  );
}
