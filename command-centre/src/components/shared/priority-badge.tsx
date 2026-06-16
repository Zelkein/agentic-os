"use client";

import { Flag } from "lucide-react";

export type Priority = "none" | "urgent" | "high" | "normal" | "low";

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; iconColor: string }> = {
  none: { label: "No priority", color: "transparent", iconColor: "var(--text-tertiary)" },
  urgent: { label: "Urgent", color: "#EF4444", iconColor: "#EF4444" },
  high: { label: "High", color: "#F97316", iconColor: "#F97316" },
  normal: { label: "Normal", color: "#6366f1", iconColor: "#6366f1" },
  low: { label: "Low", color: "#6B7280", iconColor: "#6B7280" },
};

export const PRIORITIES: Priority[] = ["urgent", "high", "normal", "low", "none"];

export function PriorityBadge({
  priority,
  size = "sm",
}: {
  priority?: Priority | null;
  size?: "sm" | "md";
}) {
  const config = PRIORITY_CONFIG[priority || "none"];
  const iconSize = size === "sm" ? 12 : 14;

  if (!priority || priority === "none") return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: size === "sm" ? 10 : 11,
        fontWeight: 600,
        fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
        color: config.iconColor,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        lineHeight: 1,
      }}
    >
      <Flag size={iconSize} fill={config.iconColor} />
      {config.label}
    </span>
  );
}

export function PriorityDot({
  priority,
  size = 8,
}: {
  priority?: Priority | null;
  size?: number;
}) {
  const config = PRIORITY_CONFIG[priority || "none"];
  if (!priority || priority === "none") return null;

  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: config.color,
        flexShrink: 0,
      }}
    />
  );
}

export function PriorityPicker({
  value,
  onChange,
}: {
  value?: Priority | null;
  onChange: (priority: Priority) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {PRIORITIES.map((p) => {
        const config = PRIORITY_CONFIG[p];
        const isSelected = (value || "none") === p;
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              border: "none",
              borderRadius: 6,
              background: isSelected ? "var(--bg-hover)" : "transparent",
              color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "var(--font-inter), Inter, sans-serif",
              textAlign: "left",
              width: "100%",
              transition: "all 100ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.background = "transparent";
            }}
          >
            <Flag size={12} fill={p === "none" ? "transparent" : config.iconColor} color={config.iconColor} />
            <span>{config.label}</span>
            {isSelected && (
              <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--accent-color)" }}>✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { PRIORITY_CONFIG };