"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  AlertTriangle,
} from "lucide-react";
import { useTaskStore } from "@/store/task-store";

/* -- Types ------------------------------------- */

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  level: string;
  tags?: Tag[];
  dueDate?: string | null;
  startDate?: string | null;
  clientId?: string | null;
  activityLabel?: string | null;
  description?: string | null;
  createdAt: string;
}

/* -- Constants --------------------------------- */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_COLORS: Record<string, string> = {
  backlog: "#6B7280",
  queued: "#3B82F6",
  running: "#F59E0B",
  review: "#8B5CF6",
  done: "#10B981",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#EF4444",
  high: "#F97316",
  normal: "#3B82F6",
  low: "#6B7280",
  none: "var(--text-tertiary)",
};

/* -- Helpers ----------------------------------- */

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  ...s,
});
const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-inter), Inter, sans-serif",
  ...s,
});

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMonthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay(); // 0=Sun
  const days: Date[] = [];

  // Pad days from previous month
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push(d);
  }

  // Current month days
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  // Pad to fill 6 rows (42 cells)
  while (days.length < 42) {
    const lastDay = days[days.length - 1];
    days.push(new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + 1));
  }

  return days;
}

function getMonthName(month: number): string {
  const names = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return names[month];
}

/* -- Priority dot ------------------------------ */

function PriorityDot({ priority }: { priority: string }) {
  const color = PRIORITY_COLORS[priority] || "var(--text-tertiary)";
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  );
}

/* -- Main Component ---------------------------- */

export default function CalendarView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [hoveredTask, setHoveredTask] = useState<{ task: Task; x: number; y: number } | null>(null);
  const [hoverTimer, setHoverTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const openPanel = useTaskStore((s: any) => s.openPanel);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  /* -- Fetch tasks ------------------------------ */

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : data.tasks || []);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /* -- Navigation ------------------------------- */

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

  /* -- Group tasks by date ---------------------- */

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = formatDateKey(new Date(task.dueDate));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return map;
  }, [tasks]);

  const calendarDays = useMemo(() => getMonthDays(year, month), [year, month]);

  /* -- Stats ------------------------------------ */

  const stats = useMemo(() => {
    let thisMonth = 0;
    let overdue = 0;
    const now = new Date();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const d = new Date(task.dueDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        thisMonth++;
        if (d < now && task.status !== "done") overdue++;
      }
    }
    return { thisMonth, overdue };
  }, [tasks, year, month]);

  /* -- Hover popover handlers ------------------- */

  const handleMouseEnter = (task: Task, e: React.MouseEvent) => {
    if (hoverTimer) clearTimeout(hoverTimer);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const t = setTimeout(() => {
      setHoveredTask({ task, x: rect.left, y: rect.bottom + 4 });
    }, 400);
    setHoverTimer(t);
  };

  const handleMouseLeave = () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    setHoveredTask(null);
  };

  /* -- Loading skeleton ------------------------- */

  if (loading) {
    return (
      <div style={{ padding: "24px 32px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 36,
                width: i === 1 ? 200 : 80,
                borderRadius: 8,
                backgroundColor: "var(--bg-tertiary)",
                animation: "pulse-opacity 2s ease-in-out infinite",
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
          }}
        >
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 100,
                borderRadius: 8,
                backgroundColor: "var(--bg-tertiary)",
                animation: "pulse-opacity 2s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  /* -- Render ----------------------------------- */

  return (
    <div style={{ padding: "24px 32px" }}>
      {/* -- Header ---------------------------- */}

      <div style={{ marginBottom: 24 }}>
        <h2 style={sg({ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" })}>
          Calendar
        </h2>

        {/* Stats */}
        <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
          <span style={sp({ fontSize: 13, color: "var(--text-secondary)" })}>
            <CalendarIcon size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
            {stats.thisMonth} tasks with due dates this month
          </span>
          {stats.overdue > 0 && (
            <span style={sp({ fontSize: 13, color: "var(--error)" })}>
              <AlertTriangle size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
              {stats.overdue} overdue
            </span>
          )}
        </div>
      </div>

      {/* -- Month navigation ------------------ */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <button
          onClick={prevMonth}
          style={{
            background: "none",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 8,
            padding: "6px 8px",
            cursor: "pointer",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            transition: "color 150ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-color)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          <ChevronLeft size={18} />
        </button>

        <h3
          style={sg({ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: 0, minWidth: 200, textAlign: "center" })}
        >
          {getMonthName(month)} {year}
        </h3>

        <button
          onClick={nextMonth}
          style={{
            background: "none",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 8,
            padding: "6px 8px",
            cursor: "pointer",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            transition: "color 150ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-color)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          <ChevronRight size={18} />
        </button>

        <button
          onClick={goToday}
          style={{
            ...sp({ fontSize: 12, fontWeight: 500 }),
            padding: "6px 14px",
            borderRadius: 8,
            border: "1px solid var(--border-color-secondary)",
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            cursor: "pointer",
            marginLeft: 8,
          }}
        >
          Today
        </button>
      </div>

      {/* -- Calendar grid --------------------- */}

      <div
        style={{
          backgroundColor: "var(--bg-tertiary)",
          border: "1px solid var(--border-color-secondary)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Day headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            borderBottom: "1px solid var(--border-color-secondary)",
          }}
        >
          {DAYS.map((day) => (
            <div
              key={day}
              style={{
                ...sg({ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }),
                color: "var(--text-tertiary)",
                padding: "10px 8px",
                textAlign: "center",
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
          }}
        >
          {calendarDays.map((date, idx) => {
            const key = formatDateKey(date);
            const dayTasks = tasksByDate.get(key) || [];
            const isCurrentMonth = date.getMonth() === month;
            const _isToday = isToday(date);
            const dayNum = date.getDate();
            const visibleTasks = dayTasks.slice(0, 3);
            const remaining = dayTasks.length - 3;

            return (
              <div
                key={idx}
                style={{
                  minHeight: 100,
                  borderRight: (idx % 7) < 6 ? "1px solid var(--border-color)" : "none",
                  borderBottom: idx < 35 ? "1px solid var(--border-color)" : "none",
                  padding: 6,
                  backgroundColor: _isToday
                    ? "rgba(212, 114, 74, 0.06)"
                    : isCurrentMonth
                      ? "transparent"
                      : "var(--bg-secondary)",
                  opacity: isCurrentMonth ? 1 : 0.35,
                  transition: "background-color 120ms ease",
                  cursor: "default",
                  position: "relative",
                }}
              >
                {/* Day number */}
                <div
                  style={{
                    ...sp({ fontSize: 12, fontWeight: _isToday ? 700 : 500 }),
                    marginBottom: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: _isToday ? "var(--accent-color)" : "transparent",
                    color: _isToday ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  {dayNum}
                </div>

                {/* Task cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {visibleTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => openPanel?.(task.id)}
                      onMouseEnter={(e) => handleMouseEnter(task, e)}
                      onMouseLeave={handleMouseLeave}
                      className="card-hover"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "3px 6px",
                        borderRadius: 4,
                        backgroundColor: "var(--card-bg)",
                        border: "1px solid var(--border-color)",
                        cursor: "pointer",
                        transition: "all 120ms ease",
                        overflow: "hidden",
                      }}
                    >
                      <PriorityDot priority={task.priority} />
                      <span
                        style={{
                          ...sp({ fontSize: 11, fontWeight: 500 }),
                          color: "var(--text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {task.title}
                      </span>
                    </div>
                  ))}
                  {remaining > 0 && (
                    <span
                      style={{
                        ...sp({ fontSize: 10, fontWeight: 600 }),
                        color: "var(--text-tertiary)",
                        padding: "2px 6px",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        // Show all in a simple alert — could expand later
                        const dateStr = date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
                        const allTitles = dayTasks.map((t) => `• ${t.title}`).join("\n");
                        const msg = `Tasks for ${dateStr}:\n\n${allTitles}`;
                        alert(msg);
                      }}
                    >
                      +{remaining} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* -- Hover popover --------------------- */}

      {hoveredTask && (
        <div
          style={{
            position: "fixed",
            left: hoveredTask.x,
            top: hoveredTask.y,
            zIndex: 9999,
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 10,
            padding: 14,
            minWidth: 220,
            maxWidth: 320,
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            pointerEvents: "none",
          }}
          onMouseLeave={handleMouseLeave}
        >
          <p style={sg({ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px" })}>
            {hoveredTask.task.title}
          </p>

          {hoveredTask.task.description && (
            <p style={sp({ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 8px", lineHeight: 1.4 })}>
              {hoveredTask.task.description.length > 100
                ? hoveredTask.task.description.slice(0, 100) + "…"
                : hoveredTask.task.description}
            </p>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {/* Status badge */}
            <span
              style={{
                ...sg({ fontSize: 10, fontWeight: 600 }),
                padding: "2px 6px",
                borderRadius: 4,
                backgroundColor: `${STATUS_COLORS[hoveredTask.task.status]}22`,
                color: STATUS_COLORS[hoveredTask.task.status],
              }}
            >
              {hoveredTask.task.status}
            </span>

            {/* Priority badge */}
            <span
              style={{
                ...sp({ fontSize: 10, fontWeight: 500 }),
                padding: "2px 6px",
                borderRadius: 4,
                backgroundColor: `${PRIORITY_COLORS[hoveredTask.task.priority] || "var(--text-tertiary)"}18`,
                color: PRIORITY_COLORS[hoveredTask.task.priority] || "var(--text-tertiary)",
              }}
            >
              {hoveredTask.task.priority === "none" ? "No priority" : hoveredTask.task.priority}
            </span>

            {/* Due date */}
            {hoveredTask.task.dueDate && (
              <span style={sp({ fontSize: 10, color: "var(--text-tertiary)" })}>
                Due: {new Date(hoveredTask.task.dueDate).toLocaleDateString()}
              </span>
            )}

            {/* Tags */}
            {hoveredTask.task.tags?.map((t) => (
              <span
                key={t.id}
                style={{
                  ...sp({ fontSize: 10, fontWeight: 500 }),
                  padding: "1px 5px",
                  borderRadius: 3,
                  backgroundColor: `${t.color}22`,
                  color: t.color,
                }}
              >
                {t.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
