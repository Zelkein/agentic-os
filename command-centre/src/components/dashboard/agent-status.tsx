"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bot, Cpu, Activity, Zap, Clock, AlertTriangle,
  CheckCircle2, Loader2, RefreshCw, Server,
} from "lucide-react";

interface AgentStatusData {
  id: string;
  name: string;
  model: string;
  provider: string;
  status: "idle" | "running" | "error";
  queueDepth: number;
  currentTask: string | null;
  activeTime: string | null;
  latency: number | null;
  version: string;
}

interface AgentStatusSummary {
  total: number;
  running: number;
  idle: number;
  totalRunningTasks: number;
  totalQueuedTasks: number;
}

const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-inter), Inter, sans-serif",
  ...s,
});

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  ...s,
});

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusDot(status: string) {
  const colors: Record<string, string> = {
    running: "#22c55e",
    idle: "var(--text-tertiary)",
    error: "#ef4444",
  };
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: colors[status] || colors.idle,
        boxShadow: status === "running"
          ? "0 0 6px rgba(34, 197, 94, 0.5)"
          : status === "error"
          ? "0 0 6px rgba(239, 68, 68, 0.5)"
          : "none",
        animation: status === "running" ? "pulse 2s ease-in-out infinite" : "none",
      }}
    />
  );
}

export default function AgentStatus() {
  const [data, setData] = useState<{ agents: AgentStatusData[]; summary: AgentStatusSummary } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/agents/status");
      if (!res.ok) throw new Error("Failed to fetch agent status");
      setData(await res.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "var(--bg-tertiary)",
          border: "1px solid var(--border-color-secondary)",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Server size={16} color="var(--accent-color)" />
          <h3 style={sg({ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 })}>
            Agent Status
          </h3>
        </div>
        <div style={{ textAlign: "center", padding: 20 }}>
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-tertiary)" }} />
          <p style={sp({ fontSize: 12, color: "var(--text-tertiary)", marginTop: 8 })}>
            Loading agent status...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: "var(--bg-tertiary)",
          border: "1px solid var(--border-color-secondary)",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Server size={16} color="var(--accent-color)" />
          <h3 style={sg({ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 })}>
            Agent Status
          </h3>
          <div style={{ flex: 1 }} />
          <button
            onClick={fetchStatus}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid var(--border-color)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={10} />
            Retry
          </button>
        </div>
        <p style={sp({ fontSize: 12, color: "var(--error)" })}>{error}</p>
      </div>
    );
  }

  if (!data || data.agents.length === 0) {
    return null;
  }

  const { agents, summary } = data;

  return (
    <div
      style={{
        backgroundColor: "var(--bg-tertiary)",
        background: "var(--gradient-card)",
        border: "1px solid var(--border-color-secondary)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Server size={16} color="var(--accent-color)" />
          <h3 style={sg({ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 })}>
            Agent Status
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#22c55e" }} />
            <span style={sp({ fontSize: 11, color: "var(--text-secondary)" })}>
              {summary.running} running
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--text-tertiary)" }} />
            <span style={sp({ fontSize: 11, color: "var(--text-secondary)" })}>
              {summary.idle} idle
            </span>
          </div>
          <div style={{
            width: 1, height: 14, backgroundColor: "var(--border-color-tertiary)",
          }} />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Zap size={11} color="var(--accent-color)" />
            <span style={sp({ fontSize: 11, fontWeight: 600, color: "var(--accent-color)" })}>
              {summary.totalRunningTasks} tasks
            </span>
          </div>
          <button
            onClick={fetchStatus}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid var(--border-color)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: 11,
              cursor: "pointer",
              transition: "all 120ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <RefreshCw size={10} />
          </button>
        </div>
      </div>

      {/* Agent list */}
      <div style={{ padding: "8px 12px" }}>
        {agents.map((agent) => (
          <div
            key={agent.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 8px",
              borderRadius: 8,
              borderBottom: "1px solid var(--border-color)",
              transition: "background 120ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            {/* Status dot */}
            {statusDot(agent.status)}

            {/* Agent info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={sg({ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" })}>
                  {agent.name}
                </span>
                <span
                  style={{
                    ...sp({
                      fontSize: 10,
                      color: "var(--text-tertiary)",
                      padding: "1px 5px",
                      borderRadius: 3,
                      backgroundColor: "var(--code-bg)",
                      whiteSpace: "nowrap",
                    }),
                  }}
                >
                  {agent.model}
                </span>
              </div>
              <p style={sp({ fontSize: 11, color: "var(--text-tertiary)", margin: "2px 0 0" })}>
                {agent.provider}
              </p>
            </div>

            {/* Queue depth */}
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 4,
                }}
              >
                <Activity size={10} color={agent.queueDepth > 0 ? "var(--accent-color)" : "var(--text-tertiary)"} />
                <span
                  style={sg({
                    fontSize: 16,
                    fontWeight: 700,
                    color: agent.queueDepth > 0 ? "var(--accent-color)" : "var(--text-tertiary)",
                  })}
                >
                  {agent.queueDepth}
                </span>
              </div>
              <p style={sp({ fontSize: 10, color: "var(--text-tertiary)", margin: 0 })}>
                in queue
              </p>
            </div>

            {/* Version */}
            <span
              style={{
                ...sp({
                  fontSize: 10,
                  color: "var(--text-tertiary)",
                  padding: "1px 5px",
                  borderRadius: 3,
                  backgroundColor: "var(--code-bg)",
                  whiteSpace: "nowrap",
                }),
              }}
            >
              v{agent.version}
            </span>

            {/* Active time */}
            {agent.activeTime && (
              <span style={sp({ fontSize: 10, color: "var(--text-tertiary)", whiteSpace: "nowrap" })}>
                {timeAgo(agent.activeTime)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
