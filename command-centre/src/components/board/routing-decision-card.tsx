"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { TaskLevel } from "@/types/task";
import { LEVEL_COLORS, LEVEL_LABELS, LEVEL_ICONS } from "@/lib/levels";

/**
 * Screen B — Auto-routing decision card.
 *
 * Rendered after the user submits a goal in "Auto" mode. Shows the routing
 * decision (level + confidence), reasoning, overlaps with existing work, and
 * clarification questions. User can proceed, change level, or dismiss.
 *
 * Wired to inline styles to match the rest of `components/board/`.
 */

export interface RoutingDecision {
  level: TaskLevel;
  confidence: number; // 0-1
  reasoning?: string;
  bullets?: string[];
  overlaps?: Array<{ taskId: string; title: string }>;
  clarifications?: string[];
}

interface Props {
  decision: RoutingDecision;
  goal: string;
  loading?: boolean;
  onProceed: () => void;
  onChangeLevel: () => void;
  onDismiss: () => void;
}

export function RoutingDecisionCard({
  decision,
  goal,
  loading,
  onProceed,
  onChangeLevel,
  onDismiss,
}: Props) {
  const [proceedHover, setProceedHover] = useState(false);
  const [changeHover, setChangeHover] = useState(false);

  const levelColor = LEVEL_COLORS[decision.level];
  const confidencePct = Math.round((decision.confidence ?? 0) * 100);

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ ...skeletonBar, width: 90, height: 20 }} />
          <div style={{ ...skeletonBar, width: 140, height: 14 }} />
        </div>
        <div style={{ ...skeletonBar, width: "100%", height: 14, marginBottom: 8 }} />
        <div style={{ ...skeletonBar, width: "85%", height: 14, marginBottom: 8 }} />
        <div style={{ ...skeletonBar, width: "60%", height: 14, marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ ...skeletonBar, width: 90, height: 30 }} />
          <div style={{ ...skeletonBar, width: 110, height: 30 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        title="Dismiss"
        style={dismissStyle}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--error)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
      >
        <X size={14} />
      </button>

      {/* Header: level badge + confidence */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, paddingRight: 24 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            borderRadius: 4,
            backgroundColor: levelColor.bg,
            color: levelColor.text,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
            textTransform: "uppercase" as const,
            letterSpacing: "0.04em",
          }}
        >
          <span aria-hidden>{LEVEL_ICONS[decision.level]}</span>
          {LEVEL_LABELS[decision.level]}
        </span>
        <span
          style={{
            fontSize: 11,
            fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
            color: "var(--text-tertiary)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {confidencePct}% confident
        </span>
        {/* Confidence meter */}
        <div
          style={{
            flex: 1,
            maxWidth: 120,
            height: 4,
            borderRadius: 2,
            backgroundColor: "rgba(218, 193, 185, 0.2)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${confidencePct}%`,
              height: "100%",
              backgroundColor: "var(--accent-color)",
              transition: "width 300ms ease",
            }}
          />
        </div>
      </div>

      {/* Goal */}
      <div
        style={{
          fontSize: 13,
          fontFamily: "var(--font-inter), Inter, sans-serif",
          color: "var(--text-primary)",
          fontWeight: 600,
          marginBottom: 10,
          lineHeight: 1.4,
        }}
      >
        {goal}
      </div>

      {/* Reasoning */}
      {decision.reasoning && (
        <div
          style={{
            fontSize: 12,
            fontFamily: "var(--font-inter), Inter, sans-serif",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            marginBottom: decision.bullets?.length ? 6 : 12,
          }}
        >
          {decision.reasoning}
        </div>
      )}

      {/* Bullets */}
      {decision.bullets && decision.bullets.length > 0 && (
        <ul
          style={{
            margin: "0 0 12px",
            paddingLeft: 18,
            fontSize: 12,
            color: "var(--text-secondary)",
            fontFamily: "var(--font-inter), Inter, sans-serif",
            lineHeight: 1.5,
          }}
        >
          {decision.bullets.map((b, i) => (
            <li key={i} style={{ marginBottom: 2 }}>{b}</li>
          ))}
        </ul>
      )}

      {/* Overlaps */}
      {decision.overlaps && decision.overlaps.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionLabelStyle}>Overlaps with existing work</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {decision.overlaps.map((o) => (
              <span
                key={o.taskId}
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                  color: "var(--accent-color)",
                  backgroundColor: "rgba(147, 69, 42, 0.08)",
                  padding: "3px 8px",
                  borderRadius: 3,
                }}
              >
                {o.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Clarifications */}
      {decision.clarifications && decision.clarifications.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionLabelStyle}>Needs clarification</div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 12,
              color: "#7A5638",
              fontFamily: "var(--font-inter), Inter, sans-serif",
              lineHeight: 1.5,
            }}
          >
            {decision.clarifications.map((c, i) => (
              <li key={i} style={{ marginBottom: 2 }}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
        <button
          onClick={onProceed}
          onMouseEnter={() => setProceedHover(true)}
          onMouseLeave={() => setProceedHover(false)}
          style={{
            background: proceedHover
              ? "linear-gradient(135deg, #7F3A23, #9E4F34)"
              : "linear-gradient(135deg, #93452A, #B25D3F)",
            color: "var(--card-bg)",
            border: "none",
            borderRadius: 6,
            padding: "7px 16px",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
            cursor: "pointer",
            transition: "all 120ms ease",
          }}
        >
          Proceed
        </button>
        <button
          onClick={onChangeLevel}
          onMouseEnter={() => setChangeHover(true)}
          onMouseLeave={() => setChangeHover(false)}
          style={{
            background: changeHover ? "rgba(147, 69, 42, 0.06)" : "transparent",
            color: "var(--accent-color)",
            border: "1px solid rgba(218, 193, 185, 0.4)",
            borderRadius: 6,
            padding: "7px 14px",
            fontSize: 12,
            fontWeight: 500,
            fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
            cursor: "pointer",
            transition: "all 120ms ease",
          }}
        >
          Change level…
        </button>
      </div>
    </div>
  );
}

// -- Styles --

const containerStyle: React.CSSProperties = {
  position: "relative",
  marginBottom: 16,
  backgroundColor: "var(--card-bg)",
  borderRadius: 10,
  padding: "14px 16px",
  border: "1px solid rgba(218, 193, 185, 0.3)",
  boxShadow: "0 4px 16px rgba(147, 69, 42, 0.05)",
};

const dismissStyle: React.CSSProperties = {
  position: "absolute",
  top: 10,
  right: 10,
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 2,
  display: "flex",
  color: "var(--text-tertiary)",
  transition: "color 120ms ease",
};

const sectionStyle: React.CSSProperties = {
  marginTop: 4,
  marginBottom: 10,
  paddingTop: 8,
  borderTop: "1px solid rgba(218, 193, 185, 0.2)",
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  color: "var(--text-tertiary)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  marginBottom: 6,
};

const skeletonBar: React.CSSProperties = {
  backgroundColor: "rgba(218, 193, 185, 0.25)",
  borderRadius: 4,
  animation: "pulse-dot 1.6s ease-in-out infinite",
};
