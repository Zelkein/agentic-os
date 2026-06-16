"use client";

import AgentBridgePanel from "@/components/dashboard/agent-bridge-panel";

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  ...s,
});

export default function MissionControlPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ ...sg({ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: 0 }) }}>
          ⚡ Mission Control
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-inter)", marginTop: 4 }}>
          Live status of all Hermes agents — auto-refreshes every 15s
        </p>
      </div>

      {/* Bridge panel */}
      <AgentBridgePanel />
    </div>
  );
}
