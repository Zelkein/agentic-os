"use client";

import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, CheckCircle2, Square } from "lucide-react";
import type { Task } from "@/types/task";
import { useTaskStore } from "@/store/task-store";

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  if (min < 60) return `${min}m ${rem.toString().padStart(2, "0")}s`;
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  return `${hr}h ${remMin}m`;
}

function timeAgo(dateStr: string): string {
  const ts = new Date(dateStr).getTime();
  if (isNaN(ts)) return "--";
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Show Claude's actual compute time, not wall-clock.
 * Only adds live elapsed when the task has been recently updated (< 5 min),
 * indicating Claude is actively processing. Otherwise shows static durationMs.
 * Uses updatedAt (set when each turn starts) as the turn-start proxy, not
 * startedAt which reflects when the task was first created.
 */
function formatLiveClaudeTime(task: Task): string {
  const accumulated = task.durationMs ?? 0;

  const lastUpdate = new Date(task.updatedAt).getTime();
  if (isNaN(lastUpdate) || Date.now() - lastUpdate > 5 * 60 * 1000) {
    return formatDuration(accumulated);
  }

  // Task was recently updated — add live elapsed for the current turn only
  const currentTurnMs = Math.max(0, Date.now() - lastUpdate);
  return formatDuration(accumulated + currentTurnMs);
}

type FeedCardVariant = "running" | "queued" | "review" | "needsInput" | "error";

function getVariant(task: Task): FeedCardVariant {
  if (task.errorMessage && task.status !== "done") return "error";
  if (task.needsInput) return "needsInput";
  if (task.status === "review") return "review";
  if (task.status === "queued") return "queued";
  return "running";
}

const statusConfig: Record<FeedCardVariant, {
  label: string;
  bg: string;
  color: string;
  pulse: boolean;
  showTimer: boolean;
  cardBg: string;
  cardBgHover: string;
}> = {
  running: {
    label: "Running",
    bg: "var(--accent-color)",
    color: "var(--card-bg)",
    pulse: true,
    showTimer: true,
    cardBg: "rgba(147, 69, 42, 0.04)",
    cardBgHover: "rgba(147, 69, 42, 0.08)",
  },
  queued: {
    label: "Queued",
    bg: "var(--card-bg-secondary)",
    color: "var(--text-secondary)",
    pulse: false,
    showTimer: false,
    cardBg: "transparent",
    cardBgHover: "rgba(218, 193, 185, 0.06)",
  },
  review: {
    label: "Review",
    bg: "var(--warning)",
    color: "var(--card-bg)",
    pulse: false,
    showTimer: false,
    cardBg: "rgba(210, 120, 60, 0.04)",
    cardBgHover: "rgba(210, 120, 60, 0.08)",
  },
  needsInput: {
    label: "Input needed",
    bg: "var(--warning)",
    color: "var(--card-bg)",
    pulse: true,
    showTimer: false,
    cardBg: "rgba(210, 120, 60, 0.05)",
    cardBgHover: "rgba(210, 120, 60, 0.09)",
  },
  error: {
    label: "Error",
    bg: "var(--error)",
    color: "var(--card-bg)",
    pulse: true,
    showTimer: false,
    cardBg: "rgba(192, 64, 48, 0.04)",
    cardBgHover: "rgba(192, 64, 48, 0.08)",
  },
};

export function FeedCard({ task, isOverlay }: { task: Task; isOverlay?: boolean }) {
  const openPanel = useTaskStore((s) => s.openPanel);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const cancelTask = useTaskStore((s) => s.cancelTask);
  const fetchOutputFiles = useTaskStore((s) => s.fetchOutputFiles);
  const allOutputFiles = useTaskStore((s) => s.outputFiles);
  const outputFiles = allOutputFiles[task.id] ?? [];
  const [isHovered, setIsHovered] = useState(false);
  const [, setTick] = useState(0);
  const variant = getVariant(task);
  const config = statusConfig[variant];

  // Fetch outputs for running/review tasks too (not just done)
  useEffect(() => {
    if (variant === "running" || variant === "review" || variant === "needsInput") {
      fetchOutputFiles(task.id);
    }
  }, [task.id, variant, fetchOutputFiles]);

  // Parse context sources
  const contextTags: string[] = [];
  if (task.contextSources) {
    try {
      const sources = JSON.parse(task.contextSources) as { label: string }[];
      for (const s of sources) contextTags.push(s.label);
    } catch { /* ignore */ }
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const dndTransform = CSS.Transform.toString(transform);

  const isActivelyRunning = variant === "running" &&
    (Date.now() - new Date(task.updatedAt).getTime()) < 5 * 60 * 1000;

  useEffect(() => {
    if (!isActivelyRunning) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isActivelyRunning]);

  const showAccumulatedTime = (variant === "review" || variant === "needsInput" || variant === "error") && (task.durationMs ?? 0) > 0;

  const narrativeText = variant === "error"
    ? (task.errorMessage || "Claude hit an error.")
    : variant === "needsInput"
      ? (task.errorMessage || task.activityLabel || "Claude needs your input to continue.")
      : variant === "review"
        ? (task.activityLabel || task.description || "Claude has finished \u2014 review the output.")
        : (task.activityLabel || task.description || null);

  const isQueued = variant === "queued";
  const isRunning = variant === "running";

  // Long-running warning: >1 hour of compute time
  const durationMs = task.durationMs ?? 0;
  const isLongRunning = isRunning && durationMs > 3600000;

  // Staleness: review/input tasks older than 24h
  const updatedAgo = Date.now() - new Date(task.updatedAt).getTime();
  const isStale = (variant === "review" || variant === "needsInput") && updatedAgo > 24 * 60 * 60 * 1000;

  return (
    <div
      ref={setNodeRef}
      onClick={() => openPanel(task.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: isHovered ? config.cardBgHover : config.cardBg,
        borderRadius: 8,
        padding: "10px 12px",
        border: isQueued
          ? "1px solid rgba(218, 193, 185, 0.08)"
          : variant === "error"
            ? "1px solid rgba(192, 64, 48, 0.1)"
            : "1px solid rgba(218, 193, 185, 0.12)",
        cursor: isDragging ? "grabbing" : "pointer",
        transition: transition || "all 120ms ease",
        marginBottom: 8,
        transform: dndTransform || undefined,
        opacity: isDragging ? 0.5 : 1,
        position: "relative",
        ...(isOverlay ? { boxShadow: "0 8px 24px rgba(147, 69, 42, 0.15)" } : {}),
      }}
      {...attributes}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        {/* Drag handle + done + kill */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          <div
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              cursor: isDragging ? "grabbing" : "grab",
              color: isHovered ? "var(--text-tertiary)" : "transparent",
              transition: "color 120ms ease",
              padding: "0 2px",
            }}
          >
            <GripVertical size={12} />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateTask(task.id, { status: "done" });
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              color: isHovered ? "var(--success)" : "transparent",
              transition: "color 120ms ease",
              borderRadius: 3,
            }}
            title="Mark as done"
          >
            <CheckCircle2 size={10} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (task.status === "running") {
                cancelTask(task.id);
              } else {
                deleteTask(task.id);
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              color: isHovered ? "var(--error)" : "transparent",
              transition: "color 120ms ease",
              borderRadius: 3,
            }}
            title={task.status === "running" ? "Kill session" : "Delete task"}
          >
            {task.status === "running" ? <Square size={10} /> : <Trash2 size={10} />}
          </button>
        </div>

        {/* Left: title + narrative */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: isRunning ? 700 : 600,
              fontFamily: "var(--font-inter), Inter, sans-serif",
              color: isQueued ? "var(--text-tertiary)" : "var(--text-primary)",
              lineHeight: "1.3",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {task.title}
            {task.projectSlug && (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 9,
                fontWeight: 600,
                fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                color: task.level === "gsd" ? "var(--accent-color)" : "var(--text-secondary)",
                backgroundColor: task.level === "gsd" ? "rgba(147, 69, 42, 0.08)" : "rgba(218, 193, 185, 0.15)",
                padding: "1px 5px",
                borderRadius: 3,
                textTransform: "uppercase" as const,
                letterSpacing: "0.04em",
                marginLeft: 4,
              }}>
                {task.projectSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
              </span>
            )}
          </div>
          {narrativeText && (
            <div
              style={{
                fontSize: 12,
                color: isQueued ? "#B0B0B5"
                  : variant === "error" ? "#8B3A2E"
                  : (variant === "needsInput" || variant === "review") ? "#7A5638"
                  : "var(--text-secondary)",
                fontFamily: "var(--font-inter), Inter, sans-serif",
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: "1.5",
              }}
            >
              {narrativeText}
            </div>
          )}
        </div>

        {/* Right: status + time info */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginTop: 1 }}>
          {/* Accumulated time for review/input/error */}
          {showAccumulatedTime && (
            <span
              style={{
                fontSize: 10,
                fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                color: "var(--text-tertiary)",
                whiteSpace: "nowrap",
              }}
            >
              {formatDuration(task.durationMs!)}
            </span>
          )}

          {/* Staleness warning for old review/input items */}
          {isStale && (
            <span
              style={{
                fontSize: 10,
                fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                color: "var(--warning)",
                whiteSpace: "nowrap",
              }}
            >
              {timeAgo(task.updatedAt)}
            </span>
          )}

          {/* Status pill */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: isRunning ? 11 : 10,
              fontWeight: isRunning ? 600 : 500,
              fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
              padding: isRunning ? "3px 8px" : "2px 7px",
              borderRadius: 4,
              backgroundColor: isLongRunning ? "var(--warning)" : config.bg,
              color: config.color,
              lineHeight: isRunning ? "16px" : "14px",
              whiteSpace: "nowrap",
            }}
          >
            {config.pulse && (
              <span
                style={{
                  display: "inline-block",
                  width: isRunning ? 5 : 4,
                  height: isRunning ? 5 : 4,
                  borderRadius: "50%",
                  backgroundColor: config.color,
                  animation: "pulse-dot 2s ease-in-out infinite",
                  flexShrink: 0,
                }}
              />
            )}
            {config.label}
            {config.showTimer && (
              <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
                {formatLiveClaudeTime(task)}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Output file chips */}
      {outputFiles.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
          {outputFiles.slice(0, 3).map((f) => (
            <span key={f.id} style={{
              fontSize: 10,
              fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
              color: "var(--accent-color)",
              backgroundColor: "rgba(147, 69, 42, 0.06)",
              padding: "1px 6px",
              borderRadius: 3,
              whiteSpace: "nowrap",
            }}>
              {f.fileName}
            </span>
          ))}
          {outputFiles.length > 3 && (
            <span style={{ fontSize: 10, fontFamily: "var(--font-space-grotesk)", color: "var(--text-tertiary)" }}>
              +{outputFiles.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Context source tags */}
      {contextTags.length > 0 && variant === "running" && (
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 4 }}>
          {contextTags.slice(0, 4).map((tag) => (
            <span key={tag} style={{
              fontSize: 9,
              fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
              color: "var(--text-tertiary)",
              backgroundColor: "rgba(218, 193, 185, 0.12)",
              padding: "0 4px",
              borderRadius: 2,
              whiteSpace: "nowrap",
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
