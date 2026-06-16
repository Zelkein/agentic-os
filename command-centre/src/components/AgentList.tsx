"use client";

import { useEffect, useState, useRef } from "react";
import {
  Trash2,
  Edit,
  Plus,
  MessageSquare,
  Brain,
  Sparkles,
  User,
  Users,
  Zap,
  Download,
  Upload,
} from "lucide-react";
import AgentBuilder from "./AgentBuilder";
import NaturalLanguageAgentBuilder from "./NaturalLanguageAgentBuilder";

interface Agent {
  id: string;
  name: string;
  role: string;
  system_prompt?: string;
  context?: string;
  skills_json?: string[];
  workflows_json?: string[];
  llm_provider: string;
  llm_model: string;
  owner_email?: string;
  created_at: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

const ROLE_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  orchestrator: Brain,
  coach: Sparkles,
  assistant: User,
  sub_agent: Users,
};
const ROLE_COLORS: Record<string, string> = {
  orchestrator: "#D4724A",
  coach: "#60A5FA",
  assistant: "#34D399",
  sub_agent: "#A78BFA",
};
const ROLE_BG: Record<string, string> = {
  orchestrator: "rgba(212,114,74,0.12)",
  coach: "rgba(96,165,250,0.12)",
  assistant: "rgba(52,211,153,0.12)",
  sub_agent: "rgba(167,139,250,0.12)",
};
const PROVIDER_LABELS: Record<string, string> = {
  claude:"Claude",deepseek:"DeepSeek",perplexity:"Perplexity",kimi:"Kimi",
  minimax:"MiniMax","z-ai":"Z-AI",ollama:"Ollama",vision:"Vision",
};
const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-inter), Inter, sans-serif", ...s,
});
const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif", ...s,
});

export default function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderMode, setBuilderMode] = useState<"form" | "natural">("form");
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>(undefined);
  const [importing, setImporting] = useState(false);
  const [waylandImporting, setWaylandImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchAgents(); }, []);

  const fetchAgents = async () => {
    try { setAgents(await (await fetch("/api/agents")).json()); }
    catch (err) { console.error("Error fetching agents:", err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this agent?")) return;
    try {
      await fetch(`/api/agents/${id}`, { method: "DELETE" });
      setAgents(agents.filter((a) => a.id !== id));
    } catch (err) { console.error("Error deleting agent:", err); }
  };

  const handleExport = async (id: string) => {
    try {
      const res = await fetch(`/api/agents/${id}`);
      if (!res.ok) throw new Error("Failed to fetch agent");
      const agent = await res.json();
      const blob = new Blob([JSON.stringify(agent, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${agent.name.replace(/[^a-zA-Z0-9]/g, "_")}.agent.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error("Error exporting agent:", err); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Import failed");
      }
      fetchAgents();
    } catch (err) {
      console.error("Error importing agent:", err);
      alert(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleImportWayland = async () => {
    setWaylandImporting(true);
    try {
      const res = await fetch("/api/agents/import-wayland", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      const msg = `${data.imported} agent${data.imported > 1 ? "s" : ""} imported from Wayland`;
      if (data.skipped > 0) {
        alert(`${msg}\n${data.skipped} skipped (built-in, disabled, or duplicates)`);
      } else {
        alert(msg);
      }
      fetchAgents();
    } catch (err) {
      console.error("Error importing from Wayland:", err);
      alert(err instanceof Error ? err.message : "Wayland import failed");
    } finally {
      setWaylandImporting(false);
    }
  };

  const handleAgentSaved = () => {
    fetchAgents();
    setShowBuilder(false);
    setEditingAgent(undefined);
  };

  // -- Builder view --
  if (showBuilder) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <button
            onClick={() => { setShowBuilder(false); setEditingAgent(undefined); }}
            style={{
              ...sg({ fontSize: 14, color: "var(--text-secondary)", cursor: "pointer" }),
              background: "none", border: "none", padding: 0,
            }}
          >
            ← Back to Agents
          </button>
          {!editingAgent && (
            <div style={{
              display: "flex", gap: 2,
              backgroundColor: "var(--bg-secondary)", borderRadius: 8, padding: 3,
            }}>
              {(["form", "natural"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setBuilderMode(m)}
                  style={{
                    ...sg({ fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer" }),
                    backgroundColor: builderMode === m ? "var(--bg-tertiary)" : "transparent",
                    color: builderMode === m ? "var(--accent-color)" : "var(--text-secondary)",
                    boxShadow: builderMode === m ? "0 1px 3px var(--accent-glow)" : "none",
                  }}
                >
                  {m === "form" ? "Guided Builder" : "Natural Language"}
                </button>
              ))}
            </div>
          )}
        </div>
        {builderMode === "form" || editingAgent ? (
          <AgentBuilder agent={editingAgent} onSaved={handleAgentSaved} />
        ) : (
          <NaturalLanguageAgentBuilder onSaved={handleAgentSaved} />
        )}
      </div>
    );
  }

  // -- Loading skeletons --
  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 16px" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 100, borderRadius: 12, marginBottom: 12,
              backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color-secondary)",
              animation: "pulse-opacity 2s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }

  // -- Agent list --
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h2 style={sg({ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" })}>AI Agents</h2>
          <p style={sp({ fontSize: 14, color: "var(--text-secondary)", margin: 0 })}>
            Create and manage your AI teammates — each with their own personality, skills, and AI model.
          </p>
        </div>
        <button
          onClick={() => { setEditingAgent(undefined); setShowBuilder(true); }}
          style={{
            ...sg({ fontSize: 14, fontWeight: 600, color: "var(--card-bg)", padding: "10px 20px", borderRadius: 10, border: "none", backgroundColor: "var(--accent-color)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }),
          }}
        >
          <Plus size={18} /> New Agent
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: "none" }}
          />
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            style={{
              ...sg({ fontSize: 13, fontWeight: 500, padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border-color-secondary)", backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)", cursor: importing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 120ms ease" }),
              opacity: importing ? 0.6 : 1,
            }}
          >
            <Upload size={16} /> {importing ? "Importing..." : "Import"}
          </button>
          <button
            onClick={handleImportWayland}
            disabled={waylandImporting}
            style={{
              ...sg({ fontSize: 13, fontWeight: 500, padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(139,92,246,0.3)", backgroundColor: "rgba(139,92,246,0.1)", color: "#A78BFA", cursor: waylandImporting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 120ms ease" }),
              opacity: waylandImporting ? 0.6 : 1,
            }}
          >
            <Download size={16} /> {waylandImporting ? "Importing..." : "Wayland"}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {agents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: "var(--bg-tertiary)", borderRadius: 12, border: "1px solid var(--border-color-secondary)" }}>
          <Brain size={48} color="var(--text-tertiary)" style={{ marginBottom: 16, opacity: 0.4 }} />
          <p style={sg({ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 })}>No agents yet</p>
          <p style={sp({ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 })}>
            Create your first AI agent to get started. Choose from pre-built role templates like Orchestrator, Coach, or Assistant.
          </p>
          <button
            onClick={() => { setEditingAgent(undefined); setShowBuilder(true); setBuilderMode("form"); }}
            style={{ ...sg({ fontSize: 14, fontWeight: 600, color: "var(--card-bg)", padding: "10px 24px", borderRadius: 8, border: "none", backgroundColor: "var(--accent-color)", cursor: "pointer" }) }}
          >
            Create Your First Agent
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {agents.map((agent) => {
            const Icon = ROLE_ICONS[agent.role] || Brain;
            const roleColor = ROLE_COLORS[agent.role] || "#D4724A";
            const roleBg = ROLE_BG[agent.role] || "rgba(212,114,74,0.12)";
            return (
              <div
                key={agent.id}
                className="card-hover"
                style={{
                  backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-color-secondary)", borderRadius: 12, padding: 20,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 14, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, backgroundColor: roleBg,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Icon size={22} color={roleColor} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <h3 style={sg({ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: 0 })}>{agent.name}</h3>
                        <span style={sg({ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: roleColor, backgroundColor: roleBg, padding: "2px 8px", borderRadius: 4 })}>
                          {agent.role.replace("_", " ")}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={sp({ fontSize: 12, color: "var(--text-secondary)" })}>
                          {PROVIDER_LABELS[agent.llm_provider] || agent.llm_provider} / {agent.llm_model}
                        </span>
                        {agent.owner_email && (
                          <span style={sp({ fontSize: 12, color: "var(--text-tertiary)" })}>{agent.owner_email}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span style={sp({ fontSize: 11, color: "var(--text-tertiary)" })}>Temp: {(agent.temperature ?? 0.7).toFixed(1)}</span>
                        <span style={sp({ fontSize: 11, color: "var(--text-tertiary)" })}>Tokens: {agent.maxTokens ?? 2000}</span>
                        <span style={sp({ fontSize: 11, color: "var(--text-tertiary)" })}>{new Date(agent.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
                    <button
                      onClick={() => handleExport(agent.id)}
                      style={{ background: "none", border: "none", padding: 6, borderRadius: 6, cursor: "pointer", color: "var(--text-secondary)", opacity: 0.5 }}
                      title="Export JSON"
                    ><Download size={16} /></button>
                    <button
                      onClick={() => { setEditingAgent(agent); setShowBuilder(true); }}
                      style={{ background: "none", border: "none", padding: 6, borderRadius: 6, cursor: "pointer", color: "var(--text-secondary)" }}
                      title="Edit"
                    ><Edit size={16} /></button>
                    <a
                      href={`/agents/${agent.id}/chat`}
                      style={{
                        ...sg({ fontSize: 12, fontWeight: 500, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }),
                        padding: "6px 12px", borderRadius: 6, backgroundColor: roleBg, color: roleColor,
                      }}
                    >
                      <MessageSquare size={14} /> Chat
                    </a>
                    <button
                      onClick={() => handleDelete(agent.id)}
                      style={{ background: "none", border: "none", padding: 6, borderRadius: 6, cursor: "pointer", color: "var(--error-color)", opacity: 0.6 }}
                      title="Delete"
                    ><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}