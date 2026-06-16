"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, Layers } from "lucide-react";
import type { DashboardSummary } from "@/types/dashboard";

interface GsdInfo {
  exists: boolean;
  projectName?: string;
  currentPhase?: number | null;
  totalPhases?: number | null;
}

interface ActiveProjectsProps {
  activeProjects: DashboardSummary["activeProjects"];
}

const LEVEL_INFO: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "rgba(107, 142, 107, 0.1)", text: "var(--success)", label: "Task" },
  2: { bg: "rgba(147, 69, 42, 0.1)", text: "var(--accent-color)", label: "Planned project" },
  3: { bg: "rgba(59, 130, 246, 0.1)", text: "var(--info)", label: "GSD project" },
};

export function ActiveProjects({ activeProjects }: ActiveProjectsProps) {
  const [gsdInfo, setGsdInfo] = useState<GsdInfo | null>(null);

  const hasDeepBuild = activeProjects.some((p) => p.level === 3);
  useEffect(() => {
    if (hasDeepBuild) {
      fetch("/api/gsd/status")
        .then((res) => res.json())
        .then(setGsdInfo)
        .catch(() => setGsdInfo(null));
    }
  }, [hasDeepBuild]);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={headerStyle}>
        <FolderOpen size={16} color="var(--accent-color)" />
        <span style={labelStyle}>Active Projects</span>
      </div>
      {activeProjects.length > 0 ? (
        <div style={gridStyle}>
          {activeProjects.map((project) => {
            const info = LEVEL_INFO[project.level] || LEVEL_INFO[2];
            const isDeepBuild = project.level === 3;
            const progress = project.totalItems > 0
              ? Math.round((project.completedItems / project.totalItems) * 100)
              : isDeepBuild && gsdInfo?.exists && gsdInfo.totalPhases
                ? Math.round(((gsdInfo.currentPhase || 1) / gsdInfo.totalPhases) * 100)
                : 0;

            return (
              <Link
                key={project.slug}
                href={isDeepBuild ? "/gsd" : `/board?project=${encodeURIComponent(project.slug)}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={projectCardStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(147, 69, 42, 0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ ...badgeStyle, backgroundColor: info.bg, color: info.text }}>
                      {info.label}
                    </span>
                  </div>
                  <div style={projectNameStyle}>{project.name}</div>
                  {project.goal && (
                    <p style={goalStyle}>{project.goal}</p>
                  )}
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                    {isDeepBuild && gsdInfo?.exists && gsdInfo.totalPhases ? (
                      <>
                        <div style={progressBarBgStyle}>
                          <div style={{ ...progressBarFillStyle, width: `${progress}%`, backgroundColor: "var(--info)" }} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Layers size={11} color="var(--info)" />
                          <span style={progressLabelStyle}>
                            Phase {gsdInfo.currentPhase || 1} of {gsdInfo.totalPhases}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        {project.totalItems > 0 && (
                          <>
                            <div style={progressBarBgStyle}>
                              <div style={{ ...progressBarFillStyle, width: `${progress}%`, ...(project.hasPlanning ? { backgroundColor: "var(--info)" } : {}) }} />
                            </div>
                            <span style={progressLabelStyle}>
                              {project.completedItems}/{project.totalItems} {project.hasPlanning ? "phases" : "deliverables"}
                            </span>
                          </>
                        )}
                        {project.boardTaskCount > 0 && (
                          <span style={progressLabelStyle}>
                            {project.boardTaskCount} task{project.boardTaskCount !== 1 ? "s" : ""} on board
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p style={emptyStyle}>No active projects right now.</p>
      )}
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 16,
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--text-secondary)",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: 16,
};

const projectCardStyle: React.CSSProperties = {
  backgroundColor: "var(--bg-secondary)",
  borderRadius: 12,
  padding: "20px 24px",
  cursor: "pointer",
  transition: "box-shadow 150ms ease",
};

const badgeStyle: React.CSSProperties = {
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  fontSize: 10,
  fontWeight: 700,
  padding: "2px 8px",
  borderRadius: 4,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const projectNameStyle: React.CSSProperties = {
  fontFamily: "var(--font-inter), Inter, sans-serif",
  fontSize: 15,
  fontWeight: 600,
  color: "var(--text-primary)",
};

const goalStyle: React.CSSProperties = {
  fontFamily: "var(--font-inter), Inter, sans-serif",
  fontSize: 13,
  color: "var(--text-secondary)",
  margin: "4px 0 0",
  lineHeight: 1.5,
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical" as const,
};

const progressBarBgStyle: React.CSSProperties = {
  height: 4,
  backgroundColor: "rgba(218, 193, 185, 0.3)",
  borderRadius: 2,
  overflow: "hidden",
};

const progressBarFillStyle: React.CSSProperties = {
  height: "100%",
  backgroundColor: "var(--accent-color)",
  borderRadius: 2,
  transition: "width 300ms ease",
};

const progressLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  fontSize: 11,
  color: "var(--text-tertiary)",
};

const emptyStyle: React.CSSProperties = {
  fontFamily: "var(--font-inter), Inter, sans-serif",
  fontSize: 14,
  color: "var(--text-tertiary)",
  margin: 0,
};
