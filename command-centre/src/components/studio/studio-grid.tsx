"use client";

import { Loader2, CheckCircle2, XCircle, Download, ExternalLink, Image, FileAudio } from "lucide-react";

// Local type definition — breaks dependency chain to media-generator
// which pulls in llm-credentials → config → fs (server-only).
// Turbopack would otherwise trace the type import into client bundles.
interface MediaResult {
  id: string;
  type: "image" | "video" | "audio";
  prompt: string;
  url: string | null;
  status: "generating" | "done" | "failed";
  error?: string;
  createdAt: string;
  modelUsed?: string;
}

const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-inter), Inter, sans-serif",
  ...s,
});

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  ...s,
});

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function GenerationCard({ result }: { result: MediaResult }) {
  return (
    <div
      style={{
        background: "var(--gradient-card)",
        border: "1px solid var(--border-color-secondary)",
        borderRadius: 12,
        overflow: "hidden",
        transition: "all var(--transition-normal)",
      }}
    >
      {/* Preview */}
      <div
        style={{
          height: 180,
          backgroundColor: "var(--bg-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {result.status === "generating" && (
          <div style={{ textAlign: "center" }}>
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-color)" }} />
            <p style={sp({ fontSize: 11, color: "var(--text-tertiary)", marginTop: 6 })}>Generating...</p>
          </div>
        )}
        {result.status === "done" && result.url && (
          result.type === "image" ? (
            <img src={result.url} alt={result.prompt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <audio src={result.url} controls style={{ width: "90%" }} />
          )
        )}
        {result.status === "failed" && (
          <div style={{ textAlign: "center", padding: 16 }}>
            <XCircle size={24} color="var(--error)" />
            <p style={sp({ fontSize: 11, color: "var(--error)", marginTop: 6 })}>{result.error || "Failed"}</p>
          </div>
        )}

        {/* Type badge */}
        <span style={{
          position: "absolute", top: 8, right: 8,
          padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 600,
          backgroundColor: "rgba(0,0,0,0.5)", color: "#fff", textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}>
          {result.type}
        </span>
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px" }}>
        <p style={sp({ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
          {result.prompt}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <span style={sp({ fontSize: 10, color: "var(--text-tertiary)" })}>
            {result.modelUsed || result.type}
          </span>
          <span style={sp({ fontSize: 10, color: "var(--text-tertiary)" })}>
            {timeAgo(result.createdAt)}
          </span>
        </div>
        {/* Actions */}
        {result.status === "done" && result.url && (
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border-color)",
                background: "transparent", color: "var(--text-secondary)", fontSize: 10,
                textDecoration: "none", cursor: "pointer",
              }}
            >
              <ExternalLink size={10} />
              Open
            </a>
            <a
              href={result.url}
              download
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border-color)",
                background: "transparent", color: "var(--accent-color)", fontSize: 10,
                textDecoration: "none", cursor: "pointer",
              }}
            >
              <Download size={10} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export function StudioGrid({ results }: { results: MediaResult[] }) {
  if (results.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 60, borderRadius: 8, border: "1px solid var(--border-color-secondary)", backgroundColor: "var(--bg-tertiary)" }}>
        {results.length === 0 && (
          <>
            <Image size={32} color="var(--text-tertiary)" style={{ opacity: 0.4 }} />
            <p style={sg({ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginTop: 12 })}>
              No generations yet
            </p>
            <p style={sp({ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 })}>
              Enter a prompt above to generate images, video, or audio
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
      {results.map((result) => (
        <GenerationCard key={result.id} result={result} />
      ))}
    </div>
  );
}
