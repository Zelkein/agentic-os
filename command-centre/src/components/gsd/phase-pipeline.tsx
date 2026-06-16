"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { GsdPhase, PhaseStatus } from "@/types/gsd";

const statusConfig: Record<PhaseStatus, { color: string; bg: string; border: string; label: string }> = {
  complete: { color: "var(--success)", bg: "#F0F7F0", border: "var(--success)", label: "Complete" },
  "in-progress": { color: "var(--accent-color)", bg: "#FFF8F5", border: "var(--accent-color)", label: "In Progress" },
  "not-started": { color: "var(--text-tertiary)", bg: "var(--pane-bg)", border: "#E5E5E5", label: "Not Started" },
};

interface PhasePipelineProps {
  phases: GsdPhase[];
  selectedPhase: number | null;
  onSelectPhase: (num: number) => void;
}

export function PhasePipeline({ phases, selectedPhase, onSelectPhase }: PhasePipelineProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        overflowX: "auto",
        padding: "4px 0",
      }}
    >
      {phases.map((phase, i) => {
        const config = statusConfig[phase.status];
        const isSelected = selectedPhase === phase.number;

        return (
          <div key={phase.number} style={{ display: "flex", alignItems: "center" }}>
            <button
              onClick={() => onSelectPhase(phase.number)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: "12px 16px",
                minWidth: 160,
                border: isSelected ? `2px solid ${config.border}` : "1px solid rgba(218, 193, 185, 0.2)",
                borderRadius: 8,
                backgroundColor: isSelected ? config.bg : "var(--card-bg)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 150ms ease",
                boxShadow: isSelected ? `0 2px 8px rgba(147, 69, 42, 0.08)` : "none",
              }}
            >
              {/* Phase number + status icon */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                  style={{
                    fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    color: config.color,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Phase {phase.number}
                </span>
                {phase.status === "complete" && <CheckCircle2 size={14} style={{ color: "var(--success)" }} />}
                {phase.status === "in-progress" && (
                  <Loader2
                    size={14}
                    style={{ color: "var(--accent-color)", animation: "spin 2s linear infinite" }}
                  />
                )}
                {phase.status === "not-started" && <Circle size={14} style={{ color: "var(--skeleton-bg)" }} />}
              </div>

              {/* Name */}
              <span
                style={{
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {phase.name}
              </span>

              {/* Plan progress */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    flex: 1,
                    height: 4,
                    backgroundColor: "var(--skeleton-bg)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${phase.plansTotal > 0 ? (phase.plansComplete / phase.plansTotal) * 100 : 0}%`,
                      background: phase.status === "complete"
                        ? "var(--success)"
                        : "linear-gradient(135deg, #93452A 0%, #B25D3F 100%)",
                      borderRadius: 2,
                      transition: "width 300ms ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {phase.plansComplete}/{phase.plansTotal}
                </span>
              </div>
            </button>

            {/* Connector arrow */}
            {i < phases.length - 1 && (
              <div
                style={{
                  width: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--skeleton-bg)",
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                &#8594;
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
