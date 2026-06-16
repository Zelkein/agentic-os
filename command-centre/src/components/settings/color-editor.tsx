"use client";

import { useState, useEffect, useCallback } from "react";
import { RotateCcw, Palette, Sun, Moon } from "lucide-react";

interface ColorToken {
  key: string;
  label: string;
  group: string;
  defaultLight: string;
  defaultDark: string;
}

const COLOR_TOKENS: ColorToken[] = [
  // Surfaces
  { key: "--bg-primary", label: "Page BG", group: "Surfaces", defaultLight: "#FCF9F7", defaultDark: "#111111" },
  { key: "--bg-secondary", label: "Panel BG", group: "Surfaces", defaultLight: "#F6F3F1", defaultDark: "#161616" },
  { key: "--bg-tertiary", label: "Elevated BG", group: "Surfaces", defaultLight: "#FFFFFF", defaultDark: "#1C1C1C" },
  { key: "--bg-hover", label: "Hover BG", group: "Surfaces", defaultLight: "rgba(147,69,42,0.08)", defaultDark: "rgba(232,141,92,0.10)" },
  { key: "--card-bg", label: "Card BG", group: "Surfaces", defaultLight: "#FFFFFF", defaultDark: "#1C1C1C" },
  { key: "--card-bg-secondary", label: "Card BG 2", group: "Surfaces", defaultLight: "#FAFAF9", defaultDark: "#181818" },
  { key: "--card-bg-tertiary", label: "Card BG 3", group: "Surfaces", defaultLight: "#FFFAF8", defaultDark: "#151515" },
  { key: "--sidebar-bg", label: "Sidebar BG", group: "Surfaces", defaultLight: "#F6F3F1", defaultDark: "#141414" },
  { key: "--header-bg", label: "Header BG", group: "Surfaces", defaultLight: "rgba(252,249,247,0.85)", defaultDark: "rgba(17,17,17,0.85)" },
  { key: "--input-bg", label: "Input BG", group: "Surfaces", defaultLight: "#FFFFFF", defaultDark: "#1D1D1D" },
  { key: "--input-bg-disabled", label: "Input Disabled", group: "Surfaces", defaultLight: "#F6F3F1", defaultDark: "#181818" },
  { key: "--skeleton-bg", label: "Divider/Skeleton", group: "Surfaces", defaultLight: "#EAE8E6", defaultDark: "#202020" },
  { key: "--dropdown-bg", label: "Dropdown BG", group: "Surfaces", defaultLight: "#f3f0ee", defaultDark: "#1E1E1E" },
  { key: "--dropdown-hover", label: "Dropdown Hover", group: "Surfaces", defaultLight: "rgba(0,0,0,0.05)", defaultDark: "rgba(255,255,255,0.06)" },
  { key: "--warm-gray-bg", label: "Warm Gray BG", group: "Surfaces", defaultLight: "#EFEDEA", defaultDark: "#202020" },
  { key: "--code-bg", label: "Code BG", group: "Surfaces", defaultLight: "#F6F3F1", defaultDark: "#1A1A1A" },
  { key: "--pane-bg", label: "Pane / Conversation BG", group: "Surfaces", defaultLight: "#FCFBFA", defaultDark: "#181818" },
  { key: "--modal-footer-bg", label: "Modal Footer BG", group: "Surfaces", defaultLight: "#FCFBFA", defaultDark: "#161616" },
  { key: "--resize-handle", label: "Resize Handle", group: "Surfaces", defaultLight: "#D1D5DB", defaultDark: "#2A2A2A" },
  // Text
  { key: "--text-primary", label: "Primary Text", group: "Text", defaultLight: "#1B1C1B", defaultDark: "#EBEBEB" },
  { key: "--text-secondary", label: "Secondary Text", group: "Text", defaultLight: "#5E5E65", defaultDark: "#A8A8A8" },
  { key: "--text-tertiary", label: "Tertiary Text", group: "Text", defaultLight: "#8B8B8F", defaultDark: "#777777" },
  // Borders
  { key: "--border-color", label: "Border", group: "Borders", defaultLight: "rgba(218,193,185,0.15)", defaultDark: "rgba(140,130,120,0.22)" },
  { key: "--border-color-secondary", label: "Border 2", group: "Borders", defaultLight: "rgba(218,193,185,0.20)", defaultDark: "rgba(140,130,120,0.28)" },
  { key: "--border-color-tertiary", label: "Border 3", group: "Borders", defaultLight: "rgba(218,193,185,0.25)", defaultDark: "rgba(140,130,120,0.35)" },
  // Accent
  { key: "--accent-color", label: "Accent", group: "Accent", defaultLight: "#93452A", defaultDark: "#E88D5C" },
  { key: "--accent-light", label: "Accent Light BG", group: "Accent", defaultLight: "rgba(147,69,42,0.08)", defaultDark: "rgba(232,141,92,0.14)" },
  { key: "--accent-terracotta", label: "Terracotta", group: "Accent", defaultLight: "#D97853", defaultDark: "#E88D5C" },
  { key: "--accent-terracotta-dark", label: "Terracotta Dark", group: "Accent", defaultLight: "#93452A", defaultDark: "#D4784A" },
  { key: "--accent-terracotta-light-bg", label: "Terracotta BG", group: "Accent", defaultLight: "#FFDBCF", defaultDark: "rgba(232,141,92,0.18)" },
  { key: "--accent-terracotta-text", label: "Terracotta Text", group: "Accent", defaultLight: "#390C00", defaultDark: "#F0C4A8" },
  // Status
  { key: "--success", label: "Success", group: "Status", defaultLight: "#6B8E6B", defaultDark: "#6CB86C" },
  { key: "--success-hover", label: "Success Hover", group: "Status", defaultLight: "#5A7A5A", defaultDark: "#5DA85D" },
  { key: "--error", label: "Error", group: "Status", defaultLight: "#C04030", defaultDark: "#E05550" },
  { key: "--error-bg", label: "Error BG", group: "Status", defaultLight: "#FFF5F3", defaultDark: "rgba(224,85,80,0.16)" },
  { key: "--warning", label: "Warning", group: "Status", defaultLight: "#D2783C", defaultDark: "#E8A060" },
  { key: "--warning-bg", label: "Warning BG", group: "Status", defaultLight: "#FFFAF8", defaultDark: "rgba(232,160,96,0.14)" },
  { key: "--info", label: "Info", group: "Status", defaultLight: "#3b82f6", defaultDark: "#8E8E8E" },
  { key: "--info-bg", label: "Info BG", group: "Status", defaultLight: "#EFF6FF", defaultDark: "rgba(136,136,136,0.12)" },
  { key: "--purple-bg", label: "Purple BG", group: "Status", defaultLight: "#F5F3FF", defaultDark: "rgba(140,100,248,0.14)" },
  { key: "--green-bg", label: "Green BG", group: "Status", defaultLight: "rgba(107,142,107,0.10)", defaultDark: "rgba(108,184,108,0.14)" },
];

const GROUPS = [...new Set(COLOR_TOKENS.map((t) => t.group))];

interface SavedColors {
  [key: string]: string;
}

function loadSavedColors(): SavedColors {
  try {
    const raw = localStorage.getItem("agentic-os-colors");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveColors(colors: SavedColors) {
  localStorage.setItem("agentic-os-colors", JSON.stringify(colors));
}

function applyColors(colors: SavedColors, isDark: boolean) {
  const root = document.documentElement;
  for (const token of COLOR_TOKENS) {
    const saved = colors[token.key];
    const fallback = isDark ? token.defaultDark : token.defaultLight;
    root.style.setProperty(token.key, saved || fallback);
  }
}

export function ColorEditor() {
  const [isDark, setIsDark] = useState(true);
  const [colors, setColors] = useState<SavedColors>({});
  const [expanded, setExpanded] = useState<string | null>("Surfaces");

  useEffect(() => {
    const saved = loadSavedColors();
    setColors(saved);
    const dark = document.documentElement.classList.contains("dark");
    setIsDark(dark);
    applyColors(saved, dark);
  }, []);

  const handleChange = useCallback((key: string, value: string) => {
    setColors((prev) => {
      const next = { ...prev, [key]: value };
      saveColors(next);
      applyColors(next, isDark);
      return next;
    });
  }, [isDark]);

  const handleReset = useCallback(() => {
    localStorage.removeItem("agentic-os-colors");
    setColors({});
    applyColors({}, isDark);
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    const newDark = !isDark;
    setIsDark(newDark);
    applyColors(colors, newDark);
  }, [isDark, colors]);

  const hsl = (hex: string) => {
    if (!hex || hex.length < 7) return { h: 0, s: "0%", l: "50%" };
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return { h: Math.round(h * 360), s: `${Math.round(s * 100)}%`, l: `${Math.round(l * 100)}%` };
  };

  return (
    <div style={{ padding: 24, maxWidth: 720, fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Palette size={20} style={{ color: "var(--accent-color)" }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Color Palette</h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={toggleTheme}
            title={`Preview in ${isDark ? "light" : "dark"} mode`}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
              borderRadius: 6, border: "1px solid var(--border-color)",
              background: "var(--card-bg)", color: "var(--text-secondary)",
              cursor: "pointer", fontSize: 13, fontFamily: "inherit",
            }}
          >
            {isDark ? <Moon size={14} /> : <Sun size={14} />}
            {isDark ? "Dark" : "Light"}
          </button>
          <button
            onClick={handleReset}
            title="Reset all colors to defaults"
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
              borderRadius: 6, border: "1px solid var(--border-color)",
              background: "var(--card-bg)", color: "var(--text-secondary)",
              cursor: "pointer", fontSize: 13, fontFamily: "inherit",
            }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 20, lineHeight: 1.5 }}>
        Adjust colors independently for each mode. Switch between Dark/Light to preview.
        Changes save automatically to your browser.
      </p>

      {/* Groups */}
      {GROUPS.map((group) => {
        const isOpen = expanded === group;
        const tokens = COLOR_TOKENS.filter((t) => t.group === group);
        return (
          <div key={group} style={{ marginBottom: 12 }}>
            <button
              onClick={() => setExpanded(isOpen ? null : group)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderRadius: 8, border: "none",
                background: "var(--pane-bg)", color: "var(--text-primary)",
                cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
              }}
            >
              {group}
              <span style={{ color: "var(--text-tertiary)", fontSize: 13, fontWeight: 400 }}>
                {isOpen ? "▲" : "▼"}
              </span>
            </button>
            {isOpen && (
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                {tokens.map((token) => {
                  const current = colors[token.key];
                  const defaultValue = isDark ? token.defaultDark : token.defaultLight;
                  const value = current || defaultValue;
                  const isModified = current && current !== defaultValue;
                  return (
                    <div
                      key={token.key}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "6px 8px", borderRadius: 6,
                        background: isModified ? "rgba(232, 141, 92, 0.1)" : "transparent",
                      }}
                    >
                      {/* Swatch */}
                      <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        backgroundColor: value,
                        border: "1px solid var(--border-color)",
                        flexShrink: 0, cursor: "pointer",
                      }}
                        onClick={() => {
                          const input = document.getElementById(`color-${token.key}`) as HTMLInputElement;
                          input?.click();
                        }}
                      />
                      {/* Label */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                          {token.label}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 1 }}>
                          {token.key} {isModified && "(modified)"}
                        </div>
                      </div>
                      {/* Color input */}
                      <input
                        id={`color-${token.key}`}
                        type="color"
                        value={value.length === 7 ? value : "#888888"}
                        onChange={(e) => handleChange(token.key, e.target.value)}
                        style={{
                          width: 32, height: 28, padding: 0, border: "1px solid var(--border-color)",
                          borderRadius: 4, cursor: "pointer", background: "transparent",
                        }}
                      />
                      {/* Hex text */}
                      <span style={{
                        fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace",
                        width: 70, textAlign: "right",
                      }}>
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
