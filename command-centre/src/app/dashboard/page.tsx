"use client";

import { useEffect, useState } from "react";
import {
  Brain,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Activity,
  FolderOpen,
  MessageSquare,
  Loader2,
} from "lucide-react";
import type { DashboardSummary } from "@/types/dashboard";

const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-inter), Inter, sans-serif",
  ...s,
});

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  ...s,
});

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function formatCost(n: number): string {
  return `$${n.toFixed(2)}`;
}

function formatDuration(ms: number | null): string {
  if (!ms) return "";
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bgColor,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-tertiary)",
        border: "1px solid var(--border-color-secondary)",
        borderRadius: 12,
        padding: "18px 20px",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        transition: "all 150ms ease",
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          backgroundColor: bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={sp({ fontSize: 12, color: "var(--text-tertiary)", margin: "0 0 2px" })}>
          {label}
        </p>
        <p style={sg({ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 })}>
          {value}
        </p>
        {sub && (
          <p style={sp({ fontSize: 11, color: "var(--text-tertiary)", margin: "2px 0 0" })}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        setData(await res.json());
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
        <Loader2 size={32} color="var(--text-tertiary)" style={{ animation: "spin 1s linear infinite" }} />
        <p style={sp({ fontSize: 14, color: "var(--text-tertiary)", marginTop: 12 })}>
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
        <AlertTriangle size={32} color="var(--error)" />
        <p style={sp({ fontSize: 14, color: "var(--error)", marginTop: 8 })}>
          {error || "Unable to load dashboard"}
        </p>
      </div>
    );
  }

  const { weekStats, claudeUsage, awaitingReview, activeProjects, recentTasks, system } = data;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          {greeting}{data.userName ? `, ${data.userName}` : ""}.
        </h1>
        <p style={sp({ fontSize: 14, color: "var(--text-secondary)", marginTop: 8 })}>
          Here&apos;s your snapshot for {dateStr}.
        </p>
      </div>

      {/* Stat cards row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={Activity}
          label="Sessions this week"
          value={weekStats.sessionsCount}
          sub={`${claudeUsage.todayMessages || 0} messages today`}
          color="var(--accent-terracotta-dark)"
          bgColor="rgba(212,114,74,0.12)"
        />
        <StatCard
          icon={Zap}
          label="Tokens this week"
          value={formatTokens(claudeUsage.weekTokens)}
          sub={claudeUsage.dailyTokenBudget > 0
            ? `${((claudeUsage.todayTokens / claudeUsage.dailyTokenBudget) * 100).toFixed(0)}% of daily budget`
            : `${formatTokens(claudeUsage.todayTokens)} today`}
          color="var(--success)"
          bgColor="rgba(107,142,107,0.12)"
        />
        <StatCard
          icon={CheckCircle2}
          label="Tasks completed"
          value={weekStats.tasksCompleted}
          sub={`${formatCost(weekStats.totalCostUsd)} total cost`}
          color="var(--info)"
          bgColor="rgba(91,127,191,0.12)"
        />
        <StatCard
          icon={AlertTriangle}
          label="Awaiting review"
          value={awaitingReview.reviewCount + awaitingReview.needsInputCount}
          sub={
            awaitingReview.errorCount > 0
              ? `+ ${awaitingReview.errorCount} errors`
              : awaitingReview.reviewCount > 0
                ? `${awaitingReview.reviewCount} to review`
                : "All clear"
          }
          color={
            awaitingReview.errorCount > 0 ? "var(--error)" :
            awaitingReview.reviewCount > 0 ? "var(--accent-terracotta-dark)" : "var(--success)"
          }
          bgColor={
            awaitingReview.errorCount > 0 ? "var(--error-bg)" :
            awaitingReview.reviewCount > 0 ? "var(--warning-bg)" : "var(--green-bg)"
          }
        />
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Active projects */}
        <div
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3 style={sg({ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 16px" })}>
            Active Projects
          </h3>
          {activeProjects.length === 0 ? (
            <p style={sp({ fontSize: 13, color: "var(--text-tertiary)" })}>
              No active projects
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeProjects.slice(0, 7).map((proj) => (
                <div
                  key={proj.slug}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-secondary)",
                  }}
                >
                  <FolderOpen size={16} color="var(--text-secondary)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={sg({ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", margin: 0 })}>
                      {proj.name}
                    </p>
                    {proj.goal && (
                      <p style={sp({ fontSize: 11, color: "var(--text-tertiary)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                        {proj.goal}
                      </p>
                    )}
                  </div>
                  {proj.totalItems > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div
                        style={{
                          width: 60,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: "var(--bg-elevated)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${(proj.completedItems / proj.totalItems) * 100}%`,
                            height: "100%",
                            backgroundColor: "var(--accent-color)",
                            borderRadius: 2,
                            transition: "width 300ms ease",
                          }}
                        />
                      </div>
                      <span style={sp({ fontSize: 11, color: "var(--text-tertiary)" })}>
                        {proj.completedItems}/{proj.totalItems}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System status */}
        <div
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3 style={sg({ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 16px" })}>
            System Status
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <span style={sp({ fontSize: 13, color: "var(--text-secondary)" })}>
                Cron jobs
              </span>
              <span style={sp({ fontSize: 13, fontWeight: 600, color: system.cronActive > 0 ? "var(--success)" : "var(--text-tertiary)" })}>
                {system.cronActive}/{system.cronTotal} active
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <span style={sp({ fontSize: 13, color: "var(--text-secondary)" })}>
                Skills installed
              </span>
              <span style={sp({ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" })}>
                {system.skillsInstalled}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <span style={sp({ fontSize: 13, color: "var(--text-secondary)" })}>
                Brand context files
              </span>
              <span style={sp({ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" })}>
                {system.brandContextFiles}/5
              </span>
            </div>
            {system.cronLastRun && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <span style={sp({ fontSize: 13, color: "var(--text-secondary)" })}>
                  Last cron: {system.cronLastRun.jobName}
                </span>
                <span style={sp({ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" })}>
                  {timeAgo(system.cronLastRun.time)}
                </span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
              }}
            >
              <span style={sp({ fontSize: 13, color: "var(--text-secondary)" })}>
                Stats last updated
              </span>
              <span style={sp({ fontSize: 13, fontWeight: 500, color: "var(--text-tertiary)" })}>
                {claudeUsage.lastUpdated ? timeAgo(claudeUsage.lastUpdated) : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Token usage by model */}
        <div
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3 style={sg({ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 16px" })}>
            Token Usage By Model
          </h3>
          {claudeUsage.byModel.length === 0 ? (
            <p style={sp({ fontSize: 13, color: "var(--text-tertiary)" })}>
              No data this week
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {claudeUsage.byModel.map((m) => (
                <div
                  key={m.model}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={sp({ fontSize: 12, color: "var(--text-secondary)", width: 80, flexShrink: 0 })}>
                    {m.model}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "var(--bg-elevated)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, (m.tokens / claudeUsage.weekTokens) * 100)}%`,
                        height: "100%",
                        backgroundColor: "var(--accent-color)",
                        borderRadius: 3,
                        transition: "width 300ms ease",
                      }}
                    />
                  </div>
                  <span style={sp({ fontSize: 11, color: "var(--text-tertiary)", width: 60, textAlign: "right", flexShrink: 0 })}>
                    {formatTokens(m.tokens)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent completions */}
        <div
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3 style={sg({ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 16px" })}>
            Recent Completions
          </h3>
          {recentTasks.length === 0 ? (
            <p style={sp({ fontSize: 13, color: "var(--text-tertiary)" })}>
              No completed tasks this week
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  <CheckCircle2 size={14} color="var(--success)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={sp({ fontSize: 13, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                      {task.title}
                    </p>
                    <p style={sp({ fontSize: 11, color: "var(--text-tertiary)", margin: "2px 0 0" })}>
                      {timeAgo(task.completedAt)}
                      {task.durationMs ? ` · ${formatDuration(task.durationMs)}` : ""}
                      {task.costUsd ? ` · $${task.costUsd.toFixed(2)}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status & Priority Distribution */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        {/* Status distribution */}
        <div
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3 style={sg({ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 16px" })}>
            Task Status
          </h3>
          {data.statusDistribution && data.statusDistribution.length > 0 ? (
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {/* Donut chart */}
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: `conic-gradient(${data.statusDistribution.map((s, i, arr) => {
                    const total = arr.reduce((sum, x) => sum + x.count, 0);
                    const pct = (s.count / total) * 100;
                    const colors = ["var(--accent-color)", "var(--warning)", "var(--success)", "var(--text-tertiary)", "var(--error)"];
                    const start = arr.slice(0, i).reduce((sum, x) => sum + (x.count / total) * 360, 0);
                    return `${colors[i % colors.length]} ${start}deg ${start + pct * 3.6}deg`;
                  }).join(", ")})`,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                {data.statusDistribution.map((s, i) => {
                  const total = data.statusDistribution.reduce((sum, x) => sum + x.count, 0);
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                  const colors = ["var(--accent-color)", "var(--warning)", "var(--success)", "var(--text-tertiary)", "var(--error)"];
                  return (
                    <div key={s.status} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors[i % colors.length], flexShrink: 0 }} />
                      <span style={sp({ fontSize: 12, color: "var(--text-secondary)", flex: 1 })}>{s.status}</span>
                      <span style={sp({ fontSize: 11, color: "var(--text-tertiary)" })}>{s.count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p style={sp({ fontSize: 13, color: "var(--text-tertiary)" })}>No active tasks</p>
          )}
        </div>

        {/* Priority distribution */}
        <div
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3 style={sg({ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 16px" })}>
            Priority Breakdown
          </h3>
          {data.priorityDistribution && data.priorityDistribution.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.priorityDistribution.map((p) => {
                const total = data.priorityDistribution.reduce((sum, x) => sum + x.count, 0);
                const pct = total > 0 ? (p.count / total) * 100 : 0;
                const colors: Record<string, string> = {
                  urgent: "var(--error)", high: "var(--warning)",
                  normal: "var(--accent-color)", low: "var(--text-tertiary)", none: "var(--border-color)",
                };
                return (
                  <div key={p.priority}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={sp({ fontSize: 12, color: "var(--text-secondary)" })}>{p.priority}</span>
                      <span style={sp({ fontSize: 11, color: "var(--text-tertiary)" })}>{p.count}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, backgroundColor: "var(--bg-elevated)", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", borderRadius: 3, backgroundColor: colors[p.priority] || "var(--accent-color)", transition: "width 300ms ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={sp({ fontSize: 13, color: "var(--text-tertiary)" })}>No tasks with priority</p>
          )}
        </div>
      </div>

      {/* Recent notifications */}
      {data.recentNotifications && data.recentNotifications.length > 0 && (
        <div
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 12,
            padding: 20,
            marginTop: 16,
          }}
        >
          <h3 style={sg({ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 16px" })}>
            Recent Notifications
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {data.recentNotifications.map((n) => (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 0",
                  borderBottom: "1px solid var(--border-color)",
                  opacity: n.read ? 0.6 : 1,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: n.read ? "transparent" : "var(--accent-color)", flexShrink: 0 }} />
                <span style={sp({ fontSize: 12, color: "var(--text-primary)", fontWeight: n.read ? 400 : 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                  {n.title}
                </span>
                <span style={sp({ fontSize: 10, color: "var(--text-tertiary)", flexShrink: 0 })}>
                  {timeAgo(n.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
