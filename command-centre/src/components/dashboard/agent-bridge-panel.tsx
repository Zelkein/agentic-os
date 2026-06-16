"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bot, Wifi, WifiOff, Clock, Zap, Server,
} from "lucide-react";

interface BridgeAgentStatus {
  name: string;
  online: boolean;
  label: string;
  modelProvider: string;
  description: string;
  node: string;
  latency: number | null;
  error: string | null;
  lastContact: string | null;
}

interface BridgeMetrics {
  total: number;
  online: number;
  offline: number;
  byNode: Record<string, { total: number; online: number }>;
}

interface BridgeData {
  agents: BridgeAgentStatus[];
  metrics: BridgeMetrics;
}

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  ...s,
});

const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-inter), Inter, sans-serif",
  ...s,
});

function AgentDot({ online }: { online: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        backgroundColor: online ? "#22c55e" : "var(--text-tertiary)",
        boxShadow: online ? "0 0 8px rgba(34, 197, 94, 0.6)" : "none",
        transition: "all 0.3s ease",
      }}
    />
  );
}

export default function AgentBridgePanel() {
  const [data, setData] = useState<BridgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const resp = await fetch("/api/agents/bridge");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // ── Styles ──
  const panelStyle: React.CSSProperties = {
    background: "var(--card-bg)",
    border: "1px solid var(--border-color-secondary)",
    borderRadius: 12,
    padding: 20,
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 12,
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    borderRadius: 10,
    padding: 14,
    border: "1px solid var(--border-color-secondary)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: "var(--text-tertiary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 2,
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  };

  const metricBadge: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 6,
    background: "var(--bg-secondary)",
    fontSize: 12,
  };

  if (loading) {
    return (
      <div style={panelStyle}>
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-tertiary)", ...sp() }}>
          Scanning agents...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={panelStyle}>
        <div style={{ textAlign: "center", padding: 40, color: "#ef4444", ...sp() }}>
          Bridge offline: {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Bot size={20} color="var(--text-primary)" />
          <span style={{ ...sg({ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }) }}>
            Agent Bridge
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={metricBadge}>
            <Wifi size={14} color="#22c55e" /> {data.metrics.online} online
          </div>
          <div style={metricBadge}>
            <WifiOff size={14} color="var(--text-tertiary)" /> {data.metrics.offline} offline
          </div>
        </div>
      </div>

      {/* Node breakdown */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        {Object.entries(data.metrics.byNode).map(([node, counts]) => (
          <div
            key={node}
            style={{
              ...metricBadge,
              border: "1px solid var(--border-color-secondary)",
            }}
          >
            <Server size={14} /> {node}: {counts.online}/{counts.total}
          </div>
        ))}
      </div>

      {/* Agent cards */}
      <div style={gridStyle}>
        {data.agents.map((agent) => (
          <div key={agent.name} style={cardStyle}>
            {/* Agent header */}
            <div style={rowStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AgentDot online={agent.online} />
                <span style={{ ...sg({ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }) }}>
                  {agent.label}
                </span>
              </div>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", ...sp() }}>
                {agent.node}
              </span>
            </div>

            {/* Description */}
            <span style={{ fontSize: 12, color: "var(--text-secondary)", ...sp(), lineHeight: 1.4 }}>
              {agent.description}
            </span>

            {/* Model */}
            <div style={rowStyle}>
              <span style={labelStyle}>Model</span>
              <span style={{ fontSize: 12, color: "var(--text-primary)", ...sp() }}>
                {agent.modelProvider}
              </span>
            </div>

            {/* Status details */}
            <div style={rowStyle}>
              {agent.online ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Zap size={12} color="#22c55e" />
                    <span style={{ fontSize: 12, color: "#22c55e", ...sp() }}>Online</span>
                  </div>
                  {agent.latency !== null && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={12} color="var(--text-tertiary)" />
                      <span style={{ fontSize: 11, color: "var(--text-tertiary)", ...sp() }}>
                        {agent.latency}ms
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <WifiOff size={12} color="var(--text-tertiary)" />
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)", ...sp() }}>
                    {agent.error || "Offline"}
                  </span>
                </div>
              )}
            </div>

            {/* Last contact */}
            {agent.lastContact && (
              <span style={{ fontSize: 10, color: "var(--text-tertiary)", ...sp(), textAlign: "right" }}>
                {new Date(agent.lastContact).toLocaleTimeString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
