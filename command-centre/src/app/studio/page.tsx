"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { StudioGrid, GenerationCard } from "@/components/studio/studio-grid";
import {
  Sparkles, Image, FileVideo, FileAudio, Send, Loader2,
  Palette, Sliders,
} from "lucide-react";

type GenType = "image" | "video" | "audio";

const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-inter), Inter, sans-serif",
  ...s,
});

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  ...s,
});

const TYPE_OPTIONS: { key: GenType; label: string; icon: typeof Image; color: string }[] = [
  { key: "image", label: "Image", icon: Image, color: "var(--accent-terracotta)" },
  { key: "video", label: "Video", icon: FileVideo, color: "var(--accent-purple)" },
  { key: "audio", label: "Audio", icon: FileAudio, color: "var(--success)" },
];

export default function StudioPage() {
  const [prompt, setPrompt] = useState("");
  const [genType, setGenType] = useState<GenType>("image");
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/media/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), type: genType }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const { result } = await res.json() as { result: Record<string, unknown> };
      setResults((prev) => [result, ...prev]);
      if (result.status === "failed") {
        setError(result.error || "Generation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppShell title="Studio">
      {/* Generate panel */}
      <div
        style={{
          backgroundColor: "var(--bg-tertiary)",
          border: "1px solid var(--border-color-secondary)",
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}
      >
        {/* Type selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = genType === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => { setGenType(opt.key); setError(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 6,
                  border: `1px solid ${isActive ? opt.color : "var(--border-color)"}`,
                  background: isActive ? `${opt.color}14` : "transparent",
                  color: isActive ? opt.color : "var(--text-secondary)",
                  fontSize: 12, fontWeight: isActive ? 600 : 500,
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  cursor: "pointer", transition: "all 120ms ease",
                }}
              >
                <Icon size={13} />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Prompt input */}
        <div style={{ position: "relative" }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
            placeholder={
              genType === "image" ? "Describe the image you want to generate..." :
              genType === "video" ? "Describe the video you want to create..." :
              "Enter text to convert to speech..."
            }
            rows={3}
            style={{
              ...sp({
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--input-bg)",
                color: "var(--text-primary)",
                fontSize: 13,
                lineHeight: 1.5,
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }),
            }}
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || generating}
            style={{
              position: "absolute", bottom: 10, right: 10,
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 14px", borderRadius: 6,
              border: "none",
              backgroundColor: generating ? "var(--text-tertiary)" : "var(--accent-color)",
              color: "#fff", fontSize: 12, fontWeight: 600,
              fontFamily: "var(--font-inter), Inter, sans-serif",
              cursor: generating ? "not-allowed" : "pointer",
              opacity: !prompt.trim() ? 0.5 : 1,
              transition: "all 120ms ease",
            }}
          >
            {generating ? (
              <><Loader2 size={12} className="animate-spin" /> Generating...</>
            ) : (
              <><Sparkles size={12} /> Generate</>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <p style={sp({ fontSize: 12, color: "var(--error)", marginTop: 8 })}>
            {error}
          </p>
        )}
      </div>

      {/* Results */}
      <StudioGrid results={results} />
    </AppShell>
  );
}
