"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Grid3x3, List, Clock, Image, FileVideo, FileAudio,
  File, Search, Loader2, RefreshCw, ChevronDown, ChevronRight,
  Download, Trash2, Eye, AlertTriangle,
} from "lucide-react";

type ViewMode = "grid" | "list";
type FileType = "all" | "image" | "video" | "audio" | "pdf" | "document";
type DateFilter = "all" | "today" | "week" | "month";

interface GalleryFile {
  id: string;
  name: string;
  type: string;
  size: number;
  modifiedAt: string;
  storagePath: string;
  previewUrl?: string;
}

interface ActivityEntry {
  id: string;
  type: "created" | "modified" | "deleted";
  fileName: string;
  timestamp: string;
  fileType: string;
}

const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-inter), Inter, sans-serif",
  ...s,
});

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  ...s,
});

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fileIcon(type: string, size = 16) {
  switch (type) {
    case "image": return <Image size={size} style={{ color: "var(--accent-terracotta)" }} />;
    case "video": return <FileVideo size={size} style={{ color: "var(--accent-purple)" }} />;
    case "audio": return <FileAudio size={size} style={{ color: "var(--success)" }} />;
    default: return <File size={size} style={{ color: "var(--text-tertiary)" }} />;
  }
}

function typeColor(type: string): string {
  switch (type) {
    case "image": return "var(--accent-terracotta-light-bg)";
    case "video": return "var(--accent-purple-light-bg)";
    case "audio": return "var(--green-bg)";
    case "pdf": return "var(--error-bg)";
    default: return "var(--bg-secondary)";
  }
}

function ActivityTimeline({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: "var(--bg-tertiary)",
        border: "1px solid var(--border-color-secondary)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <Clock size={14} color="var(--accent-color)" />
        <h3 style={sg({ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 })}>
          Recent Activity
        </h3>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {entries.slice(0, 8).map((entry) => (
          <div
            key={entry.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 0",
              borderBottom: "1px solid var(--border-color)",
            }}
          >
            {fileIcon(entry.fileType, 12)}
            <span style={sp({ fontSize: 12, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
              {entry.fileName}
            </span>
            <span style={sp({ fontSize: 10, color: "var(--text-tertiary)", whiteSpace: "nowrap" })}>
              {timeAgo(entry.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryCard({
  file,
  onPreview,
  onDelete,
}: {
  file: GalleryFile;
  onPreview: (f: GalleryFile) => void;
  onDelete: (f: GalleryFile) => void;
}) {
  return (
    <div
      style={{
        background: "var(--gradient-card)",
        border: "1px solid var(--border-color-secondary)",
        borderRadius: 12,
        overflow: "hidden",
        transition: "all 150ms ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--gradient-card-hover)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--gradient-card)";
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Preview area */}
      <div
        style={{
          height: 140,
          backgroundColor: typeColor(file.type),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
        onClick={() => onPreview(file)}
      >
        {file.previewUrl ? (
          <img
            src={file.previewUrl}
            alt={file.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ opacity: 0.4 }}>{fileIcon(file.type, 32)}</div>
        )}
        {/* Type badge */}
        <span
          style={{
            ...sp({
              position: "absolute",
              top: 8,
              right: 8,
              fontSize: 9,
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: 4,
              backgroundColor: "rgba(0,0,0,0.5)",
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }),
          }}
        >
          {file.type}
        </span>
      </div>

      {/* Info area */}
      <div style={{ padding: "10px 12px" }}>
        <p
          style={sp({
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text-primary)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          })}
        >
          {file.name}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={sp({ fontSize: 10, color: "var(--text-tertiary)" })}>
            {formatSize(file.size)}
          </span>
          <span style={sp({ fontSize: 10, color: "var(--text-tertiary)" })}>
            {timeAgo(file.modifiedAt)}
          </span>
        </div>
        {/* Actions */}
        <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
          <button
            onClick={() => onPreview(file)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 6,
              border: "1px solid var(--border-color)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            <Eye size={10} />
            Preview
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(file); }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px 8px",
              borderRadius: 6,
              border: "1px solid var(--border-color)",
              background: "transparent",
              color: "var(--error)",
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceGallery() {
  const [files, setFiles] = useState<GalleryFile[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [typeFilter, setTypeFilter] = useState<FileType>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ total: 0, images: 0, videos: 0, audio: 0, totalSize: "" });
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "100", type: typeFilter });
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (dateFilter !== "all") params.set("dateRange", dateFilter);
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`/api/files/gallery?${params}`);
      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      setFiles(data.files || []);
      setStats({
        total: data.total || 0,
        images: data.stats?.images || 0,
        videos: data.stats?.videos || 0,
        audio: data.stats?.audio || 0,
        totalSize: data.stats?.totalSize || "0B",
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, dateFilter, searchQuery]);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/files/recent?limit=20");
      if (!res.ok) return;
      const data = await res.json();
      setActivity(data.entries || data.files?.slice(0, 8).map((f: GalleryFile) => ({
        id: f.id,
        type: "modified",
        fileName: f.name,
        timestamp: f.modifiedAt,
        fileType: f.type,
      })) || []);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchFiles(), fetchActivity()]);
  }, [fetchFiles, fetchActivity]);

  const filtered = files.filter((f) => {
    if (typeFilter !== "all" && f.type !== typeFilter) return false;
    if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {/* Header with stats */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={sg({ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 })}>
            Workspace
          </h2>
          <p style={sp({ fontSize: 12, color: "var(--text-tertiary)", margin: "4px 0 0" })}>
            {stats.total} files &middot; {stats.totalSize}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--input-bg)",
            }}
          >
            <Search size={12} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (searchDebounce.current) clearTimeout(searchDebounce.current);
                searchDebounce.current = setTimeout(() => fetchFiles(), 300);
              }}
              style={{
                ...sp({
                  border: "none",
                  background: "transparent",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  outline: "none",
                  width: 150,
                }),
              }}
            />
          </div>
          {/* View toggle */}
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid var(--border-color)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            {viewMode === "grid" ? <List size={12} /> : <Grid3x3 size={12} />}
            {viewMode === "grid" ? "List" : "Grid"}
          </button>
        </div>
      </div>

      {/* Activity timeline */}
      <ActivityTimeline entries={activity} />

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {(["all", "image", "video", "audio", "pdf", "document"] as FileType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "5px 10px",
              borderRadius: 6,
              border: `1px solid ${typeFilter === t ? "var(--accent-color)" : "var(--border-color)"}`,
              background: typeFilter === t ? "var(--accent-light)" : "transparent",
              color: typeFilter === t ? "var(--accent-color)" : "var(--text-secondary)",
              fontSize: 11,
              fontWeight: typeFilter === t ? 600 : 500,
              cursor: "pointer",
              transition: "all 120ms ease",
            }}
          >
            {t !== "all" && fileIcon(t, 10)}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={fetchFiles}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "5px 10px",
            borderRadius: 6,
            border: "1px solid var(--border-color)",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={10} />
          Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-tertiary)" }} />
          <p style={sp({ fontSize: 12, color: "var(--text-tertiary)", marginTop: 8 })}>
            Loading workspace...
          </p>
        </div>
      ) : error ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            borderRadius: 8,
            border: "1px solid var(--border-color-secondary)",
            backgroundColor: "var(--bg-tertiary)",
          }}
        >
          <AlertTriangle size={20} color="var(--error)" />
          <p style={sp({ fontSize: 12, color: "var(--error)", marginTop: 8 })}>{error}</p>
          <button onClick={fetchFiles} style={{
            marginTop: 8, padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border-color)",
            background: "transparent", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer",
          }}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center", padding: 60,
            borderRadius: 8, border: "1px solid var(--border-color-secondary)",
            backgroundColor: "var(--bg-tertiary)",
          }}
        >
          <File size={28} color="var(--text-tertiary)" style={{ opacity: 0.4 }} />
          <p style={sg({ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginTop: 12 })}>
            No files found
          </p>
          <p style={sp({ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 })}>
            {searchQuery ? "Try a different search" : "Upload files to get started"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          {filtered.map((file) => (
            <GalleryCard
              key={file.id}
              file={file}
              onPreview={(f) => window.open(`/api/files/preview?path=${encodeURIComponent(f.storagePath)}`, "_blank")}
              onDelete={async (f) => {
                if (!confirm(`Delete ${f.name}?`)) return;
                try {
                  const res = await fetch(`/api/files/${encodeURIComponent(f.storagePath)}`, { method: "DELETE" });
                  if (res.ok) fetchFiles();
                } catch { /* ignore */ }
              }}
            />
          ))}
        </div>
      ) : (
        /* List view */
        <div style={{
          borderRadius: 8, border: "1px solid var(--border-color-secondary)", overflow: "hidden",
        }}>
          <div style={{ display: "flex", padding: "8px 16px", backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", gap: 12, fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
            <div style={{ width: 24 }} />
            <div style={{ flex: 1 }}>Name</div>
            <div style={{ width: 80 }}>Type</div>
            <div style={{ width: 70 }}>Size</div>
            <div style={{ width: 90 }}>Modified</div>
          </div>
          {filtered.map((file) => (
            <div
              key={file.id}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "8px 16px",
                borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-tertiary)",
                cursor: "pointer", transition: "background 120ms ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"; }}
              onClick={() => window.open(`/api/files/preview?path=${encodeURIComponent(file.storagePath)}`, "_blank")}
            >
              <div style={{ width: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {fileIcon(file.type, 14)}
              </div>
              <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <span style={sp({ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" })}>{file.name}</span>
              </div>
              <div style={{ width: 80 }}>
                <span style={sp({ fontSize: 11, color: "var(--text-tertiary)" })}>{file.type}</span>
              </div>
              <div style={{ width: 70 }}>
                <span style={sp({ fontSize: 11, color: "var(--text-tertiary)" })}>{formatSize(file.size)}</span>
              </div>
              <div style={{ width: 90 }}>
                <span style={sp({ fontSize: 11, color: "var(--text-tertiary)" })}>{timeAgo(file.modifiedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
