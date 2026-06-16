"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronDown, Trash2, Terminal, Copy } from "lucide-react";
import type { Task, TaskStatus } from "@/types/task";
import { useTaskStore } from "@/store/task-store";
import { LevelBadge } from "@/components/board/level-badge";
import { PermissionPicker } from "@/components/shared/permission-picker";
import { getPermissionStateForPickerChange, getPickerPermissionMode } from "@/lib/permission-mode";

const statusColorMap: Record<string, string> = {
  backlog: "var(--text-secondary)",
  queued: "var(--text-secondary)",
  running: "var(--accent-color)",
  review: "var(--accent-terracotta-dark)",
  done: "var(--success)",
};

const ALL_STATUSES: TaskStatus[] = ["backlog", "queued", "running", "review", "done"];

const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  queued: "Queued",
  running: "Running",
  review: "Review",
  done: "Done",
};

export function ModalHeader({
  task,
  onClose,
}: {
  task: Task;
  onClose: () => void;
}) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const statusColor = statusColorMap[task.status] || "var(--text-secondary)";
  const pickerMode = getPickerPermissionMode(
    task.permissionMode,
    task.executionPermissionMode,
    task.status,
  );

  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!statusOpen) return;
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusOpen]);

  const handlePermissionModeChange = (mode: "bypassPermissions" | "default" | "plan") => {
    void updateTask(
      task.id,
      getPermissionStateForPickerChange(
        mode,
        task.permissionMode,
        task.executionPermissionMode,
        "bypassPermissions",
      ),
    );
  };

  return (
    <div style={{ flexShrink: 0 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: 56,
          padding: "12px 24px",
        }}
      >
        {/* Left: title + metadata */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                fontFamily: "var(--font-epilogue), Epilogue, sans-serif",
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {task.title}
            </span>

            <LevelBadge level={task.level} />
            {task.level === "gsd" && task.phaseNumber != null && task.gsdStep && (
              <span
                style={{
                  display: "inline-block",
                  fontSize: 11,
                  fontWeight: 500,
                  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                  padding: "2px 8px",
                  borderRadius: 4,
                  backgroundColor: "var(--purple-bg)",
                  color: "#8C64F8",
                  lineHeight: "16px",
                  flexShrink: 0,
                }}
              >
                Phase {task.phaseNumber} · {task.gsdStep}
              </span>
            )}

            {/* Status selector */}
            <div ref={statusRef} style={{ position: "relative", flexShrink: 0 }}>
              <button
                onClick={() => setStatusOpen(!statusOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 8px 3px 6px",
                  border: "1px solid transparent",
                  borderRadius: 6,
                  background: "transparent",
                  cursor: "pointer",
                  transition: "all 120ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(218, 193, 185, 0.12)";
                  e.currentTarget.style.borderColor = "rgba(218, 193, 185, 0.3)";
                }}
                onMouseLeave={(e) => {
                  if (!statusOpen) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                  }
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: statusColor,
                    animation: task.status === "running" ? "pulse-dot 2s ease-in-out infinite" : undefined,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                    color: "var(--text-secondary)",
                  }}
                >
                  {STATUS_LABELS[task.status]}
                </span>
                <ChevronDown size={12} style={{ color: "var(--text-tertiary)" }} />
              </button>

              {statusOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    backgroundColor: "var(--card-bg)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 8,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                    zIndex: 200,
                    minWidth: 140,
                    overflow: "hidden",
                  }}
                >
                  {ALL_STATUSES.map((s) => {
                    const isActive = task.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          if (!isActive) {
                            updateTask(task.id, { status: s });
                          }
                          setStatusOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          width: "100%",
                          padding: "8px 12px",
                          border: "none",
                          background: isActive ? "rgba(218, 193, 185, 0.12)" : "transparent",
                          cursor: isActive ? "default" : "pointer",
                          fontSize: 12,
                          fontWeight: isActive ? 600 : 400,
                          fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                          color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                          transition: "background 100ms ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = "rgba(218, 193, 185, 0.08)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: statusColorMap[s],
                            flexShrink: 0,
                          }}
                        />
                        {STATUS_LABELS[s]}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Permission mode row */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 10,
                fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Mode
            </span>
            <PermissionPicker value={pickerMode} onChange={handlePermissionModeChange} />
            {task.permissionMode === "plan" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 8px",
                  borderRadius: 999,
                  backgroundColor: "var(--purple-bg)",
                  color: "#8C64F8",
                  fontSize: 10,
                  fontWeight: 600,
                  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                }}
              >
                Plan active
              </span>
            )}
          </div>
        </div>

        {/* Right: reopen + resume + mark complete (GSD step only) + delete + close */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0, alignSelf: "flex-start" }}>
          {task.status === "done" && (
            <button
              onClick={() => {
                updateTask(task.id, { status: "queued" });
              }}
              title="Reopen — moves back to Claude's Turn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginRight: 4,
                padding: "5px 10px",
                border: "none",
                borderRadius: 6,
                backgroundColor: "rgba(147, 69, 42, 0.08)",
                color: "var(--accent-color)",
                fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background-color 150ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(147, 69, 42, 0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(147, 69, 42, 0.08)";
              }}
            >
              Reopen
            </button>
          )}
          {/* Resume button removed — individual pane resume buttons are sufficient */}
          <button
            onClick={() => {
              deleteTask(task.id);
              onClose();
            }}
            title="Delete task"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "0.25rem",
              color: "var(--text-tertiary)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(192, 64, 48, 0.08)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--error)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-tertiary)";
            }}
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "0.25rem",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--bg-secondary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Bottom separator */}
      <div style={{ height: 1, backgroundColor: "var(--skeleton-bg)" }} />
    </div>
  );
}

function ResumeButton({ sessionId }: { sessionId: string }) {
  const [copied, setCopied] = useState(false);
  const command = `claude --resume ${sessionId}`;

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      title={copied ? "Copied!" : command}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        marginRight: 4,
        padding: "5px 10px",
        border: "none",
        borderRadius: 6,
        backgroundColor: copied ? "rgba(107, 142, 107, 0.1)" : "rgba(147, 69, 42, 0.06)",
        color: copied ? "var(--success)" : "var(--accent-color)",
        fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 150ms ease",
      }}
      onMouseEnter={(e) => {
        if (!copied) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(147, 69, 42, 0.12)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = copied
          ? "rgba(107, 142, 107, 0.1)"
          : "rgba(147, 69, 42, 0.06)";
      }}
    >
      {copied ? <Copy size={12} /> : <Terminal size={12} />}
      {copied ? "Copied" : "Resume"}
    </button>
  );
}
