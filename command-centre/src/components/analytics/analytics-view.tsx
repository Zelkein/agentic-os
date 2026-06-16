"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, Layers, Bot, CheckCircle, Clock, AlertTriangle,
  Activity, BarChart3, Cpu,
} from "lucide-react";

type MetricCard = {
  title: string;
  value: string | number;
  change?: string;
  icon: typeof Activity;
  color: string;
};

type PipelineCounts = {
  staging: number;
  systems: number;
  promoted: number;
};

type AgentMetric = {
  name: string;
  status: "running" | "idle" | "error";
  tasksCompleted: number;
  uptime: string;
};

function MetricCard({ title, value, change, icon: Icon, color }: MetricCard) {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: 10,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} color="#fff" />
      </div>
      <div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>
          {value}
        </div>
        {change && (
          <div style={{ fontSize: 11, color: "var(--accent-color)", marginTop: 1 }}>{change}</div>
        )}
      </div>
    </div>
  );
}

function CompletionChart() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data = [12, 19, 8, 24, 17, 6, 14];
  const max = Math.max(...data);

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: 10,
        padding: 20,
      }}
    >
      <h3
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-primary)",
          margin: "0 0 16px",
        }}
      >
        Tasks Completed (7 days)
      </h3>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
        {data.map((v, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: "100%",
                height: `${(v / max) * 80}px`,
                minHeight: 6,
                background: "var(--accent-color)",
                borderRadius: "4px 4px 0 0",
                opacity: 0.7 + (v / max) * 0.3,
                transition: "height 300ms ease",
              }}
            />
            <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineDonut({ counts }: { counts: PipelineCounts }) {
  const total = counts.staging + counts.systems + counts.promoted;
  const items = [
    { label: "Staging", value: counts.staging, color: "#eab308" },
    { label: "Systems", value: counts.systems, color: "#3b82f6" },
    { label: "Promoted", value: counts.promoted, color: "#22c55e" },
  ];

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: 10,
        padding: 20,
      }}
    >
      <h3
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-primary)",
          margin: "0 0 16px",
        }}
      >
        Skills Pipeline
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: item.color,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, fontSize: 13, color: "var(--text-primary)" }}>{item.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{item.value}</div>
            <div
              style={{
                width: 80,
                height: 6,
                background: "var(--border-color)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(item.value / total) * 100}%`,
                  height: "100%",
                  background: item.color,
                  borderRadius: 3,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentMetrics({ agents }: { agents: AgentMetric[] }) {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: 10,
        padding: 20,
      }}
    >
      <h3
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-primary)",
          margin: "0 0 16px",
        }}
      >
        Agent Activity
      </h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-color)" }}>
            <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 500 }}>Agent</th>
            <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 500 }}>Status</th>
            <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: 500 }}>Tasks</th>
            <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: 500 }}>Uptime</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => (
            <tr key={a.name} style={{ borderBottom: "1px solid var(--border-color-secondary)" }}>
              <td style={{ padding: "8px 8px", color: "var(--text-primary)" }}>{a.name}</td>
              <td style={{ padding: "8px 8px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 4,
                    background:
                      a.status === "running"
                        ? "rgba(34,197,94,0.12)"
                        : a.status === "error"
                        ? "rgba(239,68,68,0.12)"
                        : "rgba(148,163,184,0.12)",
                    color:
                      a.status === "running"
                        ? "#22c55e"
                        : a.status === "error"
                        ? "#ef4444"
                        : "#94a3b8",
                  }}
                >
                  {a.status === "running" ? "●" : "○"} {a.status}
                </span>
              </td>
              <td style={{ padding: "8px 8px", textAlign: "right", color: "var(--text-primary)" }}>
                {a.tasksCompleted}
              </td>
              <td style={{ padding: "8px 8px", textAlign: "right", color: "var(--text-secondary)" }}>
                {a.uptime}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AnalyticsView() {
  const [metrics] = useState<MetricCard[]>([
    { title: "Tasks Completed Today", value: 24, change: "+12% vs yesterday", icon: CheckCircle, color: "rgba(34,197,94,0.85)" },
    { title: "Active Agents", value: 3, icon: Bot, color: "rgba(59,130,246,0.85)" },
    { title: "Skills Available", value: 47, change: "+3 this week", icon: Cpu, color: "rgba(168,85,247,0.85)" },
    { title: "Avg Response Time", value: "1.2s", change: "-0.3s vs last week", icon: Clock, color: "rgba(234,179,8,0.85)" },
  ]);

  const [pipeline] = useState<PipelineCounts>({ staging: 8, systems: 32, promoted: 7 });

  const [agents] = useState<AgentMetric[]>([
    { name: "Nova (Orchestrator)", status: "running", tasksCompleted: 142, uptime: "12d 4h" },
    { name: "Eva (Telegram)", status: "running", tasksCompleted: 87, uptime: "8d 2h" },
    { name: "Silent Worker", status: "idle", tasksCompleted: 23, uptime: "6d 0h" },
    { name: "Qwen3 Local", status: "running", tasksCompleted: 56, uptime: "10d 12h" },
  ]);

  return (
    <div>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <BarChart3 size={16} />
        Analytics
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {metrics.map((m) => (
          <MetricCard key={m.title} {...m} />
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <CompletionChart />
        <PipelineDonut counts={pipeline} />
      </div>

      <AgentMetrics agents={agents} />
    </div>
  );
}
