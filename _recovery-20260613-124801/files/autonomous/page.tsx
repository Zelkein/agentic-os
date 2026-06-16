"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  Zap, Activity, Clock, CheckCircle2, XCircle, Loader2,
  Play, Target, ChevronDown, ChevronRight, Timer, Bot,
  FileText, RefreshCw, AlertTriangle,
} from "lucide-react";

interface AutonomousRun {
  id: string;
  agent: string;
  taskTitle: string;
  status: "running" | "completed" | "failed" | "queued";
  startedAt: string;
  duration: string;
  model: string;
  level: string;
  logCount: number;
}

const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-inter), Inter, sans-serif",
  ...s,
});

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  ...s,
});

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusIcon(status: string, size = 14) {
  switch (status) {
    case "running":
      return <Loader2 size={size} className="animate-spin" style={{ color: "var(--accent-color)" }} />;
    case "completed":
      return <CheckCircle2 size={size} style={{ color: "var(--success)" }} />;
    case "failed":
      return <XCircle size={size} style={{ color: "var(--error)" }} />;
    case "queued":
      return <Clock size={size} style={{ color: "var(--text-tertiary)" }} />;
    default:
      return <Clock size={size} />;
  }
}

function statusBadge(status: string) {
  const colors: Record<string, { bg: string; text: string }> = {
    running: { bg: "rgba(232, 141, 92, 0.14)", text: "var(--accent-color)" },
    completed: { bg: "rgba(108, 184, 108, 0.14)", text: "var(--success)" },
    failed: { bg: "rgba(224, 85, 80, 0.14)", text: "var(--error)" },
    queued: { bg: "var(--bg-hover)", text: "var(--text-tertiary)" },
  };
  const c = colors[status] || colors.queued;
  return (
    <span
      style={{
        ...sp({
          fontSize: 11,
          fontWeight: 600,
          padding: "2px 8px",
          borderRadius: 4,
          backgroundColor: c.bg,
          color: c.text,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
        }),
      }}
    >
      {status}
    </span>
  );
}

export default function AutonomousPage() {
  const [runs, setRuns] = useState<AutonomousRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, string[]>>({});
  const [loadingLogs, setLoadingLogs] = useState<Record<string, boolean>>({});

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch(`/api/autonomous/runs?status=${filter}&limit=100`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRuns(data.runs || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load autonomous runs");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchRuns();
  }, [fetchRuns]);

  // Auto-refresh every 15s when there are running tasks
  useEffect(() => {
    const hasRunning = runs.some(r => r.status === "running");
    if (!hasRunning) return;
    const interval = setInterval(fetchRuns, 15000);
    return () => clearInterval(interval);
  }, [runs, fetchRuns]);

  const toggleExpanded = async (runId: string) => {
    if (expandedId === runId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(runId);
    if (!logs[runId]) {
      setLoadingLogs(prev => ({ ...prev, [runId]: true }));
      try {
        const res = await fetch(`/api/tasks/${encodeURIComponent(runId)}/logs?limit=50`);
        if (res.ok) {
          const data = await res.json();
          setLogs(prev => ({ ...prev, [runId]: (data.entries || []).map((e: { content: string }) => e.content) }));
        }
      } catch {
        setLogs(prev => ({ ...prev, [runId]: ["Failed to load logs"] }));
      } finally {
        setLoadingLogs(prev => ({ ...prev, [runId]: false }));
      }
    }
  };

  const newGoal = async () => {
    const goal = window.prompt("Describe the autonomous goal:");
    if (!goal) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: goal, level: "task", status: "queued" }),
      });
      if (res.ok) fetchRuns();
    } catch (err) {
      console.error("Failed to create goal:", err);
    }
  };

  const filtered = filter === "all" ? runs : runs.filter((r) => r.status === filter);

  return (
    <AppShell title="Autonomous Runs">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              ...sg({
                fontSize: 22,
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                margin: 0,
              }),
            }}
          >
            Autonomous Runs
          </h1>
          <p style={sp({ fontSize: 13, color: "var(--text-tertiary)", margin: "4px 0 0" })}>
            {runs.filter(r => r.status === "running").length} active &middot;{" "}
            {runs.filter(r => r.status === "queued").length} queued
          </p>
        </div>
        <button
          onClick={newGoal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            backgroundColor: "var(--accent-color)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "var(--font-inter), Inter, sans-serif",
            cursor: "pointer",
            transition: "all 120ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <Target size={14} />
          Set Goal
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["all", "running", "completed", "failed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 14px",
              borderRadius: 6,
              border: `1px solid ${filter === f ? "var(--accent-color)" : "var(--border-color)"}`,
              background: filter === f ? "var(--accent-light)" : "transparent",
              color: filter === f ? "var(--accent-color)" : "var(--text-secondary)",
              fontSize: 12,
              fontWeight: filter === f ? 600 : 500,
              fontFamily: "var(--font-inter), Inter, sans-serif",
              cursor: "pointer",
              transition: "all 120ms ease",
            }}
          >
            {statusIcon(f, 12)}
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={fetchRuns}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid var(--border-color)",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-tertiary)" }} />
          <p style={sp({ fontSize: 13, color: "var(--text-tertiary)", marginTop: 12 })}>
            Loading autonomous runs...
          </p>
        </div>
      ) : error ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            borderRadius: 8,
            border: "1px solid var(--border-color-secondary)",
            backgroundColor: "var(--bg-tertiary)",
          }}
        >
          <AlertTriangle size={24} color="var(--error)" />
          <p style={sp({ fontSize: 13, color: "var(--error)", marginTop: 8 })}>
            {error}
          </p>
          <button
            onClick={fetchRuns}
            style={{
              marginTop: 12,
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid var(--border-color)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            borderRadius: 8,
            border: "1px solid var(--border-color-secondary)",
            backgroundColor: "var(--bg-tertiary)",
          }}
        >
          <Zap size={32} color="var(--text-tertiary)" style={{ opacity: 0.4 }} />
          <p style={sg({ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginTop: 16 })}>
            No autonomous runs
          </p>
          <p style={sp({ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 })}>
            Set a goal to start an autonomous run
          </p>
          <button
            onClick={newGoal}
            style={{
              marginTop: 16,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "var(--accent-color)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "var(--font-inter), Inter, sans-serif",
              cursor: "pointer",
            }}
          >
            <Target size={14} />
            Set Your First Goal
          </button>
        </div>
      ) : (
        <div
          style={{
            borderRadius: 8,
            border: "1px solid var(--border-color-secondary)",
            overflow: "hidden",
          }}
        >
          {/* Stats bar */}
          <div
            style={{
              display: "flex",
              gap: 16,
              padding: "12px 16px",
              backgroundColor: "var(--bg-secondary)",
              borderBottom: "1px solid var(--border-color)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Play size={12} color="var(--accent-color)" />
              <span style={sp({ fontSize: 11, color: "var(--text-secondary)" })}>
                {runs.filter(r => r.status === "running").length} running
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={12} color="var(--text-tertiary)" />
              <span style={sp({ fontSize: 11, color: "var(--text-secondary)" })}>
                {runs.filter(r => r.status === "queued").length} queued
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={12} color="var(--success)" />
              <span style={sp({ fontSize: 11, color: "var(--text-secondary)" })}>
                {runs.filter(r => r.status === "completed").length} completed
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <XCircle size={12} color="var(--error)" />
              <span style={sp({ fontSize: 11, color: "var(--text-secondary)" })}>
                {runs.filter(r => r.status === "failed").length} failed
              </span>
            </div>
          </div>

          {/* Run list */}
          {filtered.map((run) => (
            <div key={run.id}>
              <div
                onClick={() => toggleExpanded(run.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-color)",
                  background: run.status === "running"
                    ? "var(--gradient-card)"
                    : "var(--bg-tertiary)",
                  cursor: "pointer",
                  transition: "all var(--transition-normal)",
                  boxShadow: run.status === "running" ? "var(--glow-running)" : "none",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"; }}
              >
                <div style={{ width: 20, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {expandedId === run.id ? <ChevronDown size={14} color="var(--text-secondary)" /> : <ChevronRight size={14} color="var(--text-tertiary)" />}
                </div>

                {statusIcon(run.status, 16)}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={sg({ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                    {run.taskTitle}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                    <Bot size={11} color="var(--text-tertiary)" />
                    <span style={sp({ fontSize: 11, color: "var(--text-tertiary)" })}>{run.agent}</span>
                    <span style={sp({ fontSize: 11, color: "var(--text-tertiary)" })}>&middot;</span>
                    <span style={sp({ fontSize: 11, color: "var(--text-tertiary)" })}>{run.model}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Timer size={11} color="var(--text-tertiary)" />
                    <span style={sp({ fontSize: 11, color: "var(--text-secondary)" })}>{run.duration || "—"}</span>
                  </div>
                  {run.logCount > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <FileText size={11} color="var(--text-tertiary)" />
                      <span style={sp({ fontSize: 11, color: "var(--text-tertiary)" })}>{run.logCount}</span>
                    </div>
                  )}
                  {statusBadge(run.status)}
                  <span style={sp({ fontSize: 11, color: "var(--text-tertiary)", whiteSpace: "nowrap" })}>
                    {timeAgo(run.startedAt)}
                  </span>
                </div>
              </div>

              {/* Expanded logs */}
              {expandedId === run.id && (
                <div
                  style={{
                    backgroundColor: "var(--code-bg)",
                    borderBottom: "1px solid var(--border-color)",
                    padding: "8px 16px 8px 48px",
                    maxHeight: 300,
                    overflowY: "auto",
                  }}
                >
                  {loadingLogs[run.id] ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0" }}>
                      <Loader2 size={12} className="animate-spin" />
                      <span style={sp({ fontSize: 11, color: "var(--text-tertiary)" })}>Loading logs...</span>
                    </div>
                  ) : logs[run.id]?.length ? (
                    logs[run.id].slice(0, 30).map((line, i) => (
                      <pre
                        key={i}
                        style={{
                          ...sp({
                            fontSize: 11,
                            color: "var(--text-secondary)",
                            margin: 0,
                            padding: "2px 0",
                            lineHeight: 1.4,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }),
                        }}
                      >
                        {line}
                      </pre>
                    ))
                  ) : (
                    <p style={sp({ fontSize: 11, color: "var(--text-tertiary)", padding: "8px 0" })}>
                      No logs available for this run
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
