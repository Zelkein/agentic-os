"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  level: string;
  tags?: Tag[];
  dueDate?: string;
  startDate?: string;
  clientId?: string;
  activityLabel?: string;
  createdAt: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

type SortKey = "title" | "status" | "priority" | "dueDate" | "createdAt";
type SortDir = "asc" | "desc";

const STATUS_ORDER: Record<string, number> = {
  backlog: 0,
  queued: 1,
  running: 2,
  review: 3,
  done: 4,
};

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
  none: 4,
};

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

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  ...s,
});
const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-inter), Inter, sans-serif",
  ...s,
});

export default function ListView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 25;

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      // data might be { tasks: [...] } or array directly
      setTasks(Array.isArray(data) ? data : data.tasks || []);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} style={{ opacity: 0.3 }} />;
    return sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  const filtered = useMemo(() => {
    let result = [...tasks];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.id?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "status") {
        cmp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
      } else if (sortKey === "priority") {
        cmp =
          (PRIORITY_ORDER[a.priority] ?? 99) -
          (PRIORITY_ORDER[b.priority] ?? 99);
      } else if (sortKey === "dueDate") {
        const da = a.dueDate || "";
        const db = b.dueDate || "";
        cmp = da.localeCompare(db);
      } else if (sortKey === "title") {
        cmp = (a.title || "").localeCompare(b.title || "");
      } else {
        cmp = (a.createdAt || "").localeCompare(b.createdAt || "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [tasks, search, statusFilter, priorityFilter, sortKey, sortDir]);

  const pageCount = Math.ceil(filtered.length / pageSize);
  const pageTasks = filtered.slice(page * pageSize, (page + 1) * pageSize);

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              height: 48,
              borderRadius: 8,
              marginBottom: 8,
              backgroundColor: "var(--bg-tertiary)",
              animation: "pulse-opacity 2s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }

  const thStyle: React.CSSProperties = {
    ...sg({ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }),
    color: "var(--text-secondary)",
    padding: "10px 12px",
    textAlign: "left",
    borderBottom: "1px solid var(--border-color-secondary)",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ padding: "24px 32px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={sg({ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" })}>
          All Tasks
        </h2>
        <p style={sp({ fontSize: 14, color: "var(--text-secondary)", margin: 0 })}>
          {filtered.length} tasks
          {filtered.length !== tasks.length &&
            ` (filtered from ${tasks.length})`}
        </p>
      </div>

      {/* Filters bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 8,
            padding: "6px 12px",
            flex: "0 0 280px",
          }}
        >
          <Search size={14} color="var(--text-tertiary)" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search tasks..."
            style={{
              ...sp({ fontSize: 13 }),
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              width: "100%",
            }}
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          style={{
            ...sp({ fontSize: 13 }),
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid var(--border-color-secondary)",
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
        >
          <option value="all">All Status</option>
          <option value="backlog">Backlog</option>
          <option value="queued">Queued</option>
          <option value="running">Running</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>

        {/* Priority filter */}
        <select
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); }}
          style={{
            ...sp({ fontSize: 13 }),
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid var(--border-color-secondary)",
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
        >
          <option value="all">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
          <option value="none">None</option>
        </select>

        {/* Clear filters */}
        {(search || statusFilter !== "all" || priorityFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setStatusFilter("all"); setPriorityFilter("all"); setPage(0); }}
            style={{
              ...sp({ fontSize: 12, fontWeight: 500 }),
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid var(--error-color)",
              backgroundColor: "transparent",
              color: "var(--error-color)",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: "var(--bg-tertiary)",
          border: "1px solid var(--border-color-secondary)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 100px 90px 120px 120px 50px",
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          <div style={thStyle} onClick={() => handleSort("title")}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              Task <SortIcon col="title" />
            </span>
          </div>
          <div style={thStyle} onClick={() => handleSort("status")}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              Status <SortIcon col="status" />
            </span>
          </div>
          <div style={thStyle} onClick={() => handleSort("priority")}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              Priority <SortIcon col="priority" />
            </span>
          </div>
          <div style={thStyle} onClick={() => handleSort("dueDate")}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              Due Date <SortIcon col="dueDate" />
            </span>
          </div>
          <div style={thStyle} onClick={() => handleSort("createdAt")}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              Created <SortIcon col="createdAt" />
            </span>
          </div>
          <div style={{ ...thStyle, cursor: "default" }}>Tags</div>
        </div>

        {/* Table rows */}
        {pageTasks.map((task) => (
          <div
            key={task.id}
            className="card-hover"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px 90px 120px 120px 50px",
              borderBottom: "1px solid var(--border-color-secondary)",
              transition: "background-color 120ms ease",
            }}
          >
            <div
              style={{
                ...sp({ fontSize: 13, color: "var(--text-primary)" }),
                padding: "10px 12px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={task.title}
            >
              {task.activityLabel && (
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--text-tertiary)",
                    marginRight: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  [{task.activityLabel}]
                </span>
              )}
              {task.title || "Untitled"}
            </div>

            {/* Status */}
            <div style={{ padding: "8px 12px" }}>
              <span
                style={{
                  ...sg({ fontSize: 11, fontWeight: 600 }),
                  padding: "2px 8px",
                  borderRadius: 4,
                  backgroundColor: `${STATUS_COLORS[task.status]}22`,
                  color: STATUS_COLORS[task.status],
                }}
              >
                {task.status}
              </span>
            </div>

            {/* Priority */}
            <div style={{ padding: "10px 12px" }}>
              <span
                style={{
                  ...sg({ fontSize: 11, fontWeight: 600 }),
                  color: PRIORITY_COLORS[task.priority] || "var(--text-tertiary)",
                }}
              >
                {task.priority === "none" ? "—" : task.priority}
              </span>
            </div>

            {/* Due date */}
            <div
              style={{
                ...sp({ fontSize: 12, color: "var(--text-secondary)" }),
                padding: "10px 12px",
              }}
            >
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString()
                : "—"}
            </div>

            {/* Created */}
            <div
              style={{
                ...sp({ fontSize: 12, color: "var(--text-tertiary)" }),
                padding: "10px 12px",
              }}
            >
              {new Date(task.createdAt).toLocaleDateString()}
            </div>

            {/* Tags */}
            <div style={{ padding: "8px 12px", display: "flex", gap: 4, alignItems: "center" }}>
              {task.tags?.slice(0, 2).map((t) => (
                <span
                  key={t.id}
                  title={t.name}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: t.color,
                    display: "inline-block",
                  }}
                />
              ))}
              {(task.tags?.length || 0) > 2 && (
                <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
                  +{task.tags!.length - 2}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {pageTasks.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)" }}>
            {search || statusFilter !== "all" || priorityFilter !== "all"
              ? "No tasks match your filters"
              : "No tasks yet"}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            marginTop: 16,
          }}
        >
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            style={{
              background: "none",
              border: "none",
              cursor: page === 0 ? "not-allowed" : "pointer",
              opacity: page === 0 ? 0.3 : 1,
              color: "var(--text-secondary)",
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={sp({ fontSize: 13, color: "var(--text-secondary)" })}>
            Page {page + 1} of {pageCount}
          </span>
          <button
            onClick={() => setPage(Math.min(pageCount - 1, page + 1))}
            disabled={page >= pageCount - 1}
            style={{
              background: "none",
              border: "none",
              cursor: page >= pageCount - 1 ? "not-allowed" : "pointer",
              opacity: page >= pageCount - 1 ? 0.3 : 1,
              color: "var(--text-secondary)",
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}