"use client";

import { useState, useMemo } from "react";
import { Check, ChevronRight } from "lucide-react";
import type { Task } from "@/types/task";
import type { Client } from "@/types/client";
import { LevelBadge } from "./level-badge";

const MONO = "'DM Mono', 'JetBrains Mono', 'SF Mono', ui-monospace, monospace";
const PAGE_SIZE = 20;

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - taskDay.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function groupByDate(tasks: Task[]): { label: string; tasks: Task[]; sortKey: number }[] {
  const groups = new Map<string, Task[]>();
  for (const t of tasks) {
    const ts = t.completedAt || t.updatedAt;
    const d = new Date(ts);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  return [...groups.entries()]
    .map(([, tasks]) => {
      const ts = tasks[0].completedAt || tasks[0].updatedAt;
      return { label: formatDateLabel(ts), tasks, sortKey: new Date(ts).getTime() };
    })
    .sort((a, b) => b.sortKey - a.sortKey);
}

function DoneMiniCard({
  task,
  clients,
  isSelected,
  showClientDot,
  onSelect,
}: {
  task: Task;
  clients: Client[];
  isSelected: boolean;
  showClientDot: boolean;
  onSelect: (id: string) => void;
}) {
  const client = task.clientId ? clients.find((c) => c.slug === task.clientId) : null;
  const borderColor = task.level === "gsd"
    ? "rgba(109, 40, 217, 0.35)"
    : task.level === "project"
    ? "rgba(147, 69, 42, 0.35)"
    : "rgba(218, 193, 185, 0.3)";

  return (
    <div
      data-card
      onClick={() => onSelect(task.id)}
      title={`${task.title} · click to reopen`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: 6,
        border: isSelected
          ? `1px solid ${task.level === "gsd" ? "#6D28D9" : task.level === "project" ? "var(--accent-color)" : "rgba(147, 69, 42, 0.35)"}`
          : `1px dashed ${borderColor}`,
        background: isSelected ? "var(--card-bg)" : "var(--pane-bg)",
        cursor: "pointer",
        fontSize: 12,
        color: "var(--text-secondary)",
        transition: "border-color 0.15s, background 0.15s",
        opacity: 0.85,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card-bg)"; e.currentTarget.style.opacity = "1"; }}
      onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.background = "var(--pane-bg)"; e.currentTarget.style.opacity = "0.85"; } }}
    >
      <Check size={10} color="var(--success)" />
      <span style={{
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {task.title}
      </span>
      {showClientDot && client && (
        <span style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: client.color || "var(--text-tertiary)",
          flexShrink: 0,
        }} />
      )}
      <LevelBadge level={task.level} />
    </div>
  );
}

export function KanbanColumnDone({
  tasks,
  clients,
  selectedId,
  collapsed,
  showClientDot,
  onToggleCollapsed,
  onSelect,
  onDrop,
  onDragOver,
  onDragLeave,
  isDragActive,
}: {
  tasks: Task[];
  clients: Client[];
  selectedId: string | null;
  collapsed: boolean;
  showClientDot: boolean;
  onToggleCollapsed: () => void;
  onSelect: (id: string) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  isDragActive: boolean;
}) {
  const [showCount, setShowCount] = useState(PAGE_SIZE);
  const [dragOver, setDragOver] = useState(false);

  const groups = useMemo(() => groupByDate(tasks), [tasks]);

  // Flatten for pagination
  const allItems = useMemo(() => groups.flatMap((g) => g.tasks), [groups]);
  const visibleItems = useMemo(() => new Set(allItems.slice(0, showCount).map((t) => t.id)), [allItems, showCount]);
  const hasMore = allItems.length > showCount;

  // Collapsed state — vertical strip
  if (collapsed) {
    const collapsedBorder = dragOver
      ? "2px solid #7ab87a"
      : isDragActive
        ? "2px dashed rgba(122, 184, 122, 0.5)"
        : "1px solid rgba(218, 193, 185, 0.2)";
    return (
      <div
        onClick={onToggleCollapsed}
        onDrop={(e) => { e.preventDefault(); onDrop(e); setDragOver(false); }}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onDragOver(e); setDragOver(true); }}
        onDragLeave={() => { onDragLeave(); setDragOver(false); }}
        style={{
          width: 48,
          minHeight: 200,
          backgroundColor: dragOver ? "rgba(122, 184, 122, 0.08)" : isDragActive ? "rgba(122, 184, 122, 0.03)" : "var(--pane-bg)",
          border: collapsedBorder,
          borderRadius: 10,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "all 150ms ease",
          position: "sticky",
          top: 12,
        }}
      >
        <span style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          fontSize: 11,
          fontFamily: MONO,
          fontWeight: 600,
          color: dragOver ? "var(--success)" : isDragActive ? "var(--success)" : "var(--text-tertiary)",
          letterSpacing: "0.05em",
          transition: "color 150ms ease",
        }}>
          {isDragActive ? "Drop here" : "Done"}
        </span>
        <span style={{
          fontSize: 10,
          fontFamily: MONO,
          color: "var(--text-tertiary)",
          fontWeight: 500,
        }}>
          {tasks.length}
        </span>
      </div>
    );
  }

  // Expanded state
  return (
    <div
      onDrop={(e) => { e.preventDefault(); onDrop(e); setDragOver(false); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onDragOver(e); setDragOver(true); }}
      onDragLeave={() => { onDragLeave(); setDragOver(false); }}
      style={{
        backgroundColor: dragOver ? "rgba(122, 184, 122, 0.04)" : isDragActive ? "rgba(122, 184, 122, 0.02)" : "var(--pane-bg)",
        border: dragOver ? "2px solid #7ab87a" : isDragActive ? "2px dashed rgba(122, 184, 122, 0.4)" : "1px solid rgba(218, 193, 185, 0.15)",
        borderRadius: 10,
        padding: "12px 14px",
        position: "sticky",
        top: 12,
        maxHeight: "calc(100vh - 180px)",
        overflowY: "auto",
        transition: "all 150ms ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          cursor: "pointer",
        }}
        onClick={onToggleCollapsed}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <span style={{
            fontSize: 11,
            fontFamily: MONO,
            fontWeight: 600,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}>
            Done
          </span>
          <span style={{
            fontSize: 10,
            fontFamily: MONO,
            color: "var(--text-tertiary)",
            backgroundColor: "rgba(218, 193, 185, 0.15)",
            padding: "1px 6px",
            borderRadius: 8,
          }}>
            {tasks.length}
          </span>
        </div>
        <ChevronRight
          size={14}
          color="var(--text-tertiary)"
          style={{ transition: "transform 150ms ease" }}
        />
      </div>

      {/* Date-grouped cards */}
      {tasks.length === 0 ? (
        <div style={{
          fontSize: 12,
          color: "var(--text-tertiary)",
          fontFamily: MONO,
          textAlign: "center",
          padding: "20px 0",
        }}>
          No completed tasks yet
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {groups.map((group) => {
            const visible = group.tasks.filter((t) => visibleItems.has(t.id));
            if (visible.length === 0) return null;
            return (
              <div key={group.label}>
                <div style={{
                  fontSize: 9,
                  fontFamily: MONO,
                  color: "#c0b8b0",
                  letterSpacing: "0.06em",
                  marginBottom: 4,
                  paddingLeft: 2,
                }}>
                  {group.label}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {visible.map((t) => (
                    <DoneMiniCard
                      key={t.id}
                      task={t}
                      clients={clients}
                      isSelected={selectedId === t.id}
                      showClientDot={showClientDot}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {hasMore && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowCount((c) => c + PAGE_SIZE); }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 10px",
                borderRadius: 6,
                border: "1px dashed rgba(218, 193, 185, 0.3)",
                background: "transparent",
                cursor: "pointer",
                fontSize: 11,
                color: "var(--text-tertiary)",
                fontFamily: MONO,
                marginTop: 4,
              }}
            >
              Show more ({allItems.length - showCount} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
