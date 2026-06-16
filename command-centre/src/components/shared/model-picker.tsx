"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import type { AiModel } from "@/types/task";

interface Option {
  value: AiModel;
  label: string;
}

const OPTIONS: Option[] = [
  { value: "deepseek-v4-pro", label: "DeepSeek V4 PRO" },
  { value: "deepseek-v4-flash", label: "DeepSeek V4 Flash" },
  { value: "deepseek-coder", label: "DeepSeek Coder V2" },
  { value: "deepseek-chat", label: "DeepSeek Chat" },
  { value: "deepseek-reasoner", label: "DeepSeek Reasoner (R1)" },
  { value: "openrouter/auto", label: "OpenRouter (Auto)" },
  { value: "openrouter/owl-alpha", label: "OpenRouter Owl Alpha" },
  { value: "glm-4-7-flash", label: "GLM-4.7 Flash" },
  { value: "opus", label: "Claude Opus" },
  { value: "vision", label: "Vision (Claude)" },
  { value: "sonnet", label: "Claude Sonnet" },
  { value: "haiku", label: "Claude Haiku" },
];

interface ModelPickerProps {
  value: AiModel | null;
  onChange: (value: AiModel) => void;
  disabled?: boolean;
}

export function ModelPicker({ value, onChange, disabled }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current: AiModel = value ?? "deepseek-v4-flash";
  const currentLabel = OPTIONS.find((o) => o.value === current)?.label || "DeepSeek V4 Flash";

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        title="Model"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          height: 26,
          padding: "0 8px",
          borderRadius: 6,
          border: "none",
          background: "transparent",
          color: "#5E5E65",
          fontSize: 12,
          fontWeight: 500,
          fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.background = "rgba(0,0,0,0.04)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <Sparkles size={13} />
        {currentLabel}
        <ChevronDown size={11} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: "100%",
            marginBottom: 6,
            backgroundColor: "var(--dropdown-bg)",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.24)",
            zIndex: 60,
            minWidth: 160,
            padding: 6,
          }}
        >
          <div
            style={{
              padding: "4px 10px 8px",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Model
          </div>
          {OPTIONS.map((opt) => {
            const isSelected = opt.value === current;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 500,
                  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                  color: isSelected ? "var(--accent-color)" : "var(--text-primary)",
                  backgroundColor: isSelected ? "var(--accent-light)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "var(--dropdown-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isSelected ? "var(--accent-light)" : "transparent";
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
