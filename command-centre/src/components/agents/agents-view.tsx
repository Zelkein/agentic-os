"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, MessageSquare, Share2 } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  role: string;
  system_prompt?: string;
  llm_model: string;
  llm_provider: string;
  visibility: string;
  created_at: string;
}

interface AgentFormData {
  name: string;
  role: string;
  system_prompt: string;
  visibility: "private" | "team" | "public";
  llm_provider: string;
  llm_model: string;
}

const ROLES = [
  { value: "orchestrator", label: "Orchestrator — Coordinate team, manage priorities" },
  { value: "coach", label: "Coach — Review work, teach principles" },
  { value: "assistant", label: "Assistant — Personal help and support" },
  { value: "specialist", label: "Specialist — Expert in specific domain" },
];

export function AgentsView() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [formData, setFormData] = useState<AgentFormData>({
    name: "",
    role: "assistant",
    system_prompt: "",
    visibility: "private",
    llm_provider: "deepseek",
    llm_model: "deepseek-v4-flash",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareDialogAgent, setShareDialogAgent] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareAccessLevel, setShareAccessLevel] = useState<"view" | "edit" | "admin">("view");

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const res = await fetch("/api/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load agents:", err);
      setError("Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Agent name is required");
      return;
    }

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newAgent = await res.json();
        setAgents([...agents, newAgent]);
        setFormData({
          name: "",
          role: "assistant",
          system_prompt: "",
          visibility: "private",
          llm_provider: "deepseek",
          llm_model: "deepseek-v4-flash",
        });
        setShowBuilder(false);
      } else {
        setError("Failed to create agent");
      }
    } catch (err) {
      console.error("Error creating agent:", err);
      setError("Error creating agent");
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm("Delete this agent?")) return;

    try {
      const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAgents(agents.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Error deleting agent:", err);
      setError("Failed to delete agent");
    }
  };

  const handleShareAgent = async () => {
    if (!shareEmail.trim()) {
      setError("Email is required");
      return;
    }

    try {
      const res = await fetch(`/api/agents/${shareDialogAgent}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: shareEmail, access_level: shareAccessLevel }),
      });

      if (res.ok) {
        setShareEmail("");
        setShareAccessLevel("view");
        setShareDialogAgent(null);
      } else {
        setError("Failed to share agent");
      }
    } catch (err) {
      console.error("Error sharing agent:", err);
      setError("Failed to share agent");
    }
  };

  return (
    <div>
      {/* Header with create button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
              marginBottom: 4,
            }}
          >
            Agents
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            Create and manage AI agents with custom roles and prompts
          </p>
        </div>
        <button
          onClick={() => setShowBuilder(!showBuilder)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            backgroundColor: "#D97853",
            border: "none",
            borderRadius: 6,
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 120ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#c46644"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#D97853"; }}
        >
          <Plus size={16} />
          New Agent
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            backgroundColor: "rgba(220, 38, 38, 0.1)",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            borderRadius: 6,
            color: "#dc2626",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* Builder form */}
      {showBuilder && (
        <div
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 8,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "0 0 20px 0",
            }}
          >
            Create New Agent
          </h3>
          <form onSubmit={handleCreateAgent}>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Agent Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sensei, Jasper"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color-tertiary)",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-inter), sans-serif",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color-tertiary)",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-inter), sans-serif",
                  boxSizing: "border-box",
                }}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Visibility
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as "private" | "team" | "public" })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color-tertiary)",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-inter), sans-serif",
                  boxSizing: "border-box",
                }}
              >
                <option value="private">Private — Only you</option>
                <option value="team">Team — Shared with team</option>
                <option value="public">Public — Everyone</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                System Prompt
              </label>
              <textarea
                value={formData.system_prompt}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                placeholder="Describe the agent's personality, expertise, and constraints..."
                style={{
                  width: "100%",
                  minHeight: 120,
                  padding: "10px 12px",
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color-tertiary)",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-inter), sans-serif",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowBuilder(false)}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border-color-secondary)",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 120ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#D97853",
                  border: "none",
                  borderRadius: 6,
                  color: "white",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 120ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#c46644"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#D97853"; }}
              >
                Create Agent
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Agents list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>
          Loading agents...
        </div>
      ) : agents.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 8,
            color: "var(--text-secondary)",
          }}
        >
          <p style={{ margin: 0, marginBottom: 12 }}>No agents yet</p>
          <button
            onClick={() => setShowBuilder(true)}
            style={{
              padding: "8px 12px",
              backgroundColor: "#D97853",
              border: "none",
              borderRadius: 6,
              color: "white",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 120ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#c46644"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#D97853"; }}
          >
            Create your first agent
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {agents.map((agent) => (
            <div
              key={agent.id}
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color-secondary)",
                borderRadius: 8,
                padding: 16,
                transition: "all 120ms ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color-secondary)";
                e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      margin: 0,
                    }}
                  >
                    {agent.name}
                  </h3>
                  {agent.visibility === "private" && (
                    <span style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      backgroundColor: "rgba(217, 120, 83, 0.1)",
                      color: "#D97853",
                      borderRadius: 3,
                      fontWeight: 600,
                    }}>
                      🔒 Private
                    </span>
                  )}
                  {agent.visibility === "team" && (
                    <span style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                      color: "#3b82f6",
                      borderRadius: 3,
                      fontWeight: 600,
                    }}>
                      👥 Team
                    </span>
                  )}
                  {agent.visibility === "public" && (
                    <span style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      backgroundColor: "rgba(34, 197, 94, 0.1)",
                      color: "#22c55e",
                      borderRadius: 3,
                      fontWeight: 600,
                    }}>
                      🌐 Public
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "#D97853",
                    margin: 0,
                    textTransform: "capitalize",
                  }}
                >
                  {agent.role}
                </p>
              </div>

              {agent.system_prompt && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    margin: 0,
                    marginBottom: 12,
                    lineHeight: 1.5,
                    maxHeight: 60,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {agent.system_prompt}
                </p>
              )}

              <div
                style={{
                  paddingTop: 12,
                  borderTop: "1px solid var(--border-color-tertiary)",
                  marginBottom: 12,
                  fontSize: 11,
                  color: "var(--text-secondary)",
                }}
              >
                <span>{agent.llm_model}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                }}
              >
                <button
                  onClick={() => window.location.href = `/agents/${agent.id}/chat`}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    backgroundColor: "#D97853",
                    border: "none",
                    borderRadius: 6,
                    color: "white",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 120ms ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#c46644"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#D97853"; }}
                >
                  <MessageSquare size={14} />
                  Chat
                </button>
                {agent.visibility === "private" && (
                  <button
                    onClick={() => setShareDialogAgent(agent.id)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "var(--bg-tertiary)",
                      border: "1px solid var(--border-color-tertiary)",
                      borderRadius: 6,
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "all 120ms ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#3b82f6";
                      e.currentTarget.style.color = "#3b82f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-color-tertiary)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                    title="Share with team"
                  >
                    <Share2 size={14} />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteAgent(agent.id)}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color-tertiary)",
                    borderRadius: 6,
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 120ms ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#dc2626";
                    e.currentTarget.style.color = "#dc2626";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color-tertiary)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Dialog */}
      {shareDialogAgent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShareDialogAgent(null)}
        >
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color-secondary)",
              borderRadius: 8,
              padding: 24,
              maxWidth: 400,
              width: "90%",
              boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: "0 0 16px 0",
              }}
            >
              Share Agent
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="user@groupecmi.com"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color-tertiary)",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-inter), sans-serif",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}
              >
                Access Level
              </label>
              <select
                value={shareAccessLevel}
                onChange={(e) => setShareAccessLevel(e.target.value as "view" | "edit" | "admin")}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color-tertiary)",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-inter), sans-serif",
                  boxSizing: "border-box",
                }}
              >
                <option value="view">View — Read-only</option>
                <option value="edit">Edit — Can modify settings</option>
                <option value="admin">Admin — Full control</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShareDialogAgent(null)}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border-color-secondary)",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 120ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                Cancel
              </button>
              <button
                onClick={handleShareAgent}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#D97853",
                  border: "none",
                  borderRadius: 6,
                  color: "white",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 120ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#c46644"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#D97853"; }}
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
