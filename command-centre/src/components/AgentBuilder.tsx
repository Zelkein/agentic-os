"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Brain,
  User,
  Users,
  Zap,
  ChevronDown,
  Settings2,
  Wrench,
  Plus,
  X,
  Check,
} from "lucide-react";

interface Agent {
  id?: string;
  name: string;
  role: string;
  system_prompt?: string;
  context?: string;
  skills_json?: string[];
  workflows_json?: string[];
  llm_provider: string;
  llm_model: string;
  owner_email?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  customConfig?: Record<string, string>;
}

const ROLES = ["orchestrator", "coach", "assistant", "sub_agent"] as const;
const PROVIDERS = [
  "claude",
  "deepseek",
  "perplexity",
  "kimi",
  "minimax",
  "z-ai",
  "ollama",
  "vision",
] as const;

const MODELS: Record<string, string[]> = {
  claude: ["claude-opus-4", "claude-sonnet-4", "claude-haiku-3"],
  deepseek: ["deepseek-v4-flash", "deepseek-v3"],
  perplexity: ["sonar-pro", "sonar"],
  kimi: ["moonshot-v1-32k", "moonshot-v1"],
  minimax: ["abab6-5.5-chat"],
  "z-ai": ["z-1-long", "z-1"],
  ollama: ["llama2", "mistral", "neural-chat"],
  vision: ["gpt-4-vision", "claude-vision"],
};

const ROLE_TEMPLATES = [
  {
    role: "orchestrator",
    icon: Brain,
    label: "Orchestrator",
    description: "Coordinates team workflows and delegates tasks",
    color: "#D4724A",
    bgColor: "rgba(212,114,74,0.12)",
    prompt: `You are {name}, the primary orchestrator agent for the CMI engineering team.

Your role:
- Coordinate workflows and task assignment
- Manage team priorities aligned with goals
- Delegate to specialized agents
- Track progress across all phases

Personality: Noble, direct, honest about constraints.
Decision framework: Coordination → Calculation → Drawing (always in this order).`,
  },
  {
    role: "coach",
    icon: Sparkles,
    label: "Coach / Mentor",
    description: "Reviews work and teaches best practices",
    color: "#60A5FA",
    bgColor: "rgba(96,165,250,0.12)",
    prompt: `You are {name}, a rigorous MEP engineering mentor for the CMI team.

Your job:
- Review employee work (calcs, designs, coordination, code)
- Identify errors, inconsistencies, safety issues
- Suggest improvements grounded in MEP principles
- Teach: Explain WHY things work, not just WHAT to do
- Enforce discipline: Coordination → Calculation → Drawing

Personality: Direct and honest, constructive, patient, evidence-based.`,
  },
  {
    role: "assistant",
    icon: User,
    label: "Personal Assistant",
    description: "Supports daily work and individual tasks",
    color: "#34D399",
    bgColor: "rgba(52,211,153,0.12)",
    prompt: `You are {name}, a personal assistant for the CMI engineering team.

Your role:
- Support daily work with calculations, file modifications, reviews
- Answer questions about processes and standards
- Coordinate with other agents for complex tasks
- Track task progress and deadlines

Personality: Helpful, proactive, focused on the user's goals.`,
  },
  {
    role: "sub_agent",
    icon: Users,
    label: "Specialist Sub-Agent",
    description: "Handles specific technical domain tasks",
    color: "#A78BFA",
    bgColor: "rgba(167,139,250,0.12)",
    prompt: `You are {name}, a specialized sub-agent supporting the CMI team.

Your role:
- Handle specific engineering tasks
- Provide technical expertise in your domain
- Report results clearly for the orchestrating agent
- Ask clarifying questions when needed`,
  },
];

const PROVIDER_LABELS: Record<string, string> = {
  claude: "Claude",
  deepseek: "DeepSeek",
  perplexity: "Perplexity",
  kimi: "Kimi",
  minimax: "MiniMax",
  "z-ai": "Z-AI",
  ollama: "Ollama",
  vision: "Vision",
};

interface Props {
  agent?: Agent | null;
  onSaved: () => void;
}

export default function AgentBuilder({ agent, onSaved }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<Agent>({
    name: agent?.name || "",
    role: agent?.role || "orchestrator",
    system_prompt: agent?.system_prompt || "",
    context: agent?.context || "",
    skills_json: agent?.skills_json || [],
    workflows_json: agent?.workflows_json || [],
    llm_provider: agent?.llm_provider || "deepseek",
    llm_model: agent?.llm_model || "deepseek-v4-flash",
    owner_email: agent?.owner_email || "",
    temperature: agent?.temperature ?? 0.7,
    maxTokens: agent?.maxTokens ?? 2000,
    topP: agent?.topP ?? 1.0,
    frequencyPenalty: agent?.frequencyPenalty ?? 0.0,
    presencePenalty: agent?.presencePenalty ?? 0.0,
    customConfig: agent?.customConfig || {},
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const models = MODELS[formData.llm_provider] || [];

  useEffect(() => {
    if (agent?.role) setStep(2);
  }, [agent]);

  const selectRole = (role: string) => {
    const template = ROLE_TEMPLATES.find((t) => t.role === role);
    setFormData((prev) => ({
      ...prev,
      role,
      system_prompt: template
        ? template.prompt.replace("{name}", prev.name || template.label)
        : prev.system_prompt,
    }));
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const method = agent?.id ? "PUT" : "POST";
      const url = agent?.id ? `/api/agents/${agent.id}` : "/api/agents";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save agent");
      }
      setSuccessMsg(agent ? "Agent updated!" : "Agent created!");
      setTimeout(() => onSaved(), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving agent");
    } finally {
      setSaving(false);
    }
  };

  const set = (field: keyof Agent, value: unknown) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const sp = (styles: React.CSSProperties = {}): React.CSSProperties => ({
    fontFamily: "var(--font-inter), Inter, sans-serif",
    ...styles,
  });
  const sg = (styles: React.CSSProperties = {}): React.CSSProperties => ({
    fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
    ...styles,
  });

  // -- STEP 1: Choose a role template --
  if (step === 1) {
    return (
      <div style={sp({ maxWidth: 780, margin: "0 auto" })}>
        <div style={{ marginBottom: 32 }}>
          <h2
            style={sg({
              fontSize: 24,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 8,
            })}
          >
            Create an AI Agent
          </h2>
          <p
            style={sp({
              fontSize: 14,
              color: "var(--text-secondary)",
            })}
          >
            Choose a role template to get started. Each role comes with a
            pre-built personality and behavior profile.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {ROLE_TEMPLATES.map((tpl) => {
            const Icon = tpl.icon;
            return (
              <div
                key={tpl.role}
                onClick={() => selectRole(tpl.role)}
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color-secondary)",
                  borderRadius: 12,
                  padding: 24,
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
                className="agent-template-card"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = tpl.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color-secondary)";
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: tpl.bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Icon size={24} color={tpl.color} />
                </div>
                <h3
                  style={sg({
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 4,
                  })}
                >
                  {tpl.label}
                </h3>
                <p
                  style={sp({
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                  })}
                >
                  {tpl.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -- STEP 2: Configure details --
  return (
    <div style={sp({ maxWidth: 780, margin: "0 auto" })}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          {/* Step indicators */}
          <div
            onClick={() => setStep(1)}
            style={{
              ...sg({
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "4px 12px",
                borderRadius: 20,
                backgroundColor: "var(--bg-secondary)",
              }),
            }}
          >
            ← Role
          </div>
          <span style={{ color: "var(--text-tertiary)" }}>›</span>
          <span
            style={sg({
              fontSize: 12,
              fontWeight: 600,
              color: "var(--accent-color)",
              padding: "4px 12px",
              borderRadius: 20,
              backgroundColor: "var(--accent-light)",
            })}
          >
            Configure
          </span>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "rgba(220,38,38,0.1)",
            border: "1px solid rgba(220,38,38,0.3)",
            color: "var(--error-color)",
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      {successMsg && (
        <div
          style={{
            backgroundColor: "rgba(45,212,191,0.1)",
            border: "1px solid rgba(45,212,191,0.3)",
            color: "var(--success-color)",
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <Check size={14} style={{ display: "inline", marginRight: 4 }} />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* -- Name + Role -- */}
        <div
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 12,
            padding: 24,
            marginBottom: 16,
          }}
        >
          <h3
            style={sg({
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 16,
            })}
          >
            Identity
          </h3>
          <div style={{ marginBottom: 16 }}>
            <label
              style={sp({
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              })}
            >
              Agent Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g., Jasper, Sensei, My Assistant"
              required
              style={{
                ...sp({ fontSize: 14 }),
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid var(--border-color-tertiary)",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
          </div>
          <div>
            <label
              style={sp({
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              })}
            >
              Owner Email
            </label>
            <input
              type="email"
              value={formData.owner_email || ""}
              onChange={(e) => set("owner_email", e.target.value)}
              placeholder="Team member email (optional)"
              style={{
                ...sp({ fontSize: 14 }),
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid var(--border-color-tertiary)",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* -- System Prompt -- */}
        <div
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 12,
            padding: 24,
            marginBottom: 16,
          }}
        >
          <h3
            style={sg({
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 12,
            })}
          >
            System Prompt
          </h3>
          <p
            style={sp({
              fontSize: 12,
              color: "var(--text-tertiary)",
              marginBottom: 12,
            })}
          >
            This defines your agent&apos;s personality, behavior, and
            responsibilities. The template provides a great starting point — you
            can customize it freely.
          </p>
          <textarea
            value={formData.system_prompt}
            onChange={(e) => set("system_prompt", e.target.value)}
            rows={10}
            required
            style={{
              ...sp({ fontSize: 13 }),
              width: "100%",
              padding: "14px",
              borderRadius: 8,
              border: "1px solid var(--border-color-tertiary)",
              backgroundColor: "var(--bg-primary)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-space-grotesk), monospace",
              lineHeight: 1.7,
              resize: "vertical",
              outline: "none",
            }}
          />
          <div
            style={{
              marginTop: 8,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {ROLE_TEMPLATES.filter((t) => t.role !== formData.role).map(
              (tpl) => (
                <button
                  key={tpl.role}
                  type="button"
                  onClick={() =>
                    set(
                      "system_prompt",
                      tpl.prompt.replace("{name}", formData.name || tpl.label)
                    )
                  }
                  style={{
                    ...sp({ fontSize: 11 }),
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "1px solid var(--border-color-tertiary)",
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  Use {tpl.label} prompt
                </button>
              )
            )}
          </div>
        </div>

        {/* -- LLM Provider + Model -- */}
        <div
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 12,
            padding: 24,
            marginBottom: 16,
          }}
        >
          <h3
            style={sg({
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 16,
            })}
          >
            AI Model
          </h3>
          <p
            style={sp({
              fontSize: 12,
              color: "var(--text-tertiary)",
              marginBottom: 12,
            })}
          >
            Choose which AI provider and model powers this agent. Different
            models have different strengths, speeds, and costs.
          </p>
          {/* Provider cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 8,
              marginBottom: 16,
            }}
          >
            {PROVIDERS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  set("llm_provider", p);
                  const defaultModel = MODELS[p]?.[0] || "";
                  set("llm_model", defaultModel);
                }}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border:
                    formData.llm_provider === p
                      ? `2px solid var(--accent-color)`
                      : "2px solid var(--border-color-tertiary)",
                  backgroundColor:
                    formData.llm_provider === p
                      ? "var(--accent-light)"
                      : "var(--bg-primary)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  transition: "all 120ms ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <span style={sg({ fontSize: 13, fontWeight: 600 })}>
                  {PROVIDER_LABELS[p] || p}
                </span>
                <span style={sp({ fontSize: 10, color: "var(--text-tertiary)" })}>
                  {p}
                </span>
              </button>
            ))}
          </div>
          {/* Model dropdown */}
          <div>
            <label
              style={sp({
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              })}
            >
              Model
            </label>
            <select
              value={formData.llm_model}
              onChange={(e) => set("llm_model", e.target.value)}
              style={{
                ...sp({ fontSize: 14 }),
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid var(--border-color-tertiary)",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* -- Context -- */}
        <div
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 12,
            padding: 24,
            marginBottom: 16,
          }}
        >
          <h3
            style={sg({
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 12,
            })}
          >
            Context (Optional)
          </h3>
          <p
            style={sp({
              fontSize: 12,
              color: "var(--text-tertiary)",
              marginBottom: 12,
            })}
          >
            Provide additional background information: team structure, project
            details, design standards, or any knowledge the agent needs.
          </p>
          <textarea
            value={formData.context || ""}
            onChange={(e) => set("context", e.target.value)}
            rows={4}
            placeholder="e.g., Team is working on commercial HVAC projects. Design standard is ASHRAE 90.1-2022..."
            style={{
              ...sp({ fontSize: 13 }),
              width: "100%",
              padding: "14px",
              borderRadius: 8,
              border: "1px solid var(--border-color-tertiary)",
              backgroundColor: "var(--bg-primary)",
              color: "var(--text-primary)",
              lineHeight: 1.6,
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>

        {/* -- Advanced Settings (collapsible) -- */}
        <div
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-color-secondary)",
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              cursor: "pointer",
              width: "100%",
              padding: 0,
              marginBottom: showAdvanced ? 16 : 0,
            }}
          >
            <Settings2 size={16} color="var(--text-secondary)" />
            <span
              style={sg({
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
              })}
            >
              Advanced Settings
            </span>
            <ChevronDown
              size={14}
              color="var(--text-tertiary)"
              style={{
                transform: showAdvanced ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 150ms",
              }}
            />
          </button>
          {showAdvanced && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              <div>
                <label
                  style={sp({
                    display: "block",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: 4,
                  })}
                >
                  Temperature ({formData.temperature?.toFixed(1)})
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature ?? 0.7}
                  onChange={(e) =>
                    set("temperature", parseFloat(e.target.value))
                  }
                  style={{ width: "100%", accentColor: "var(--accent-color)" }}
                />
              </div>
              <div>
                <label
                  style={sp({
                    display: "block",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: 4,
                  })}
                >
                  Max Tokens
                </label>
                <input
                  type="number"
                  min={1}
                  max={8000}
                  value={formData.maxTokens ?? 2000}
                  onChange={(e) =>
                    set("maxTokens", parseInt(e.target.value) || 2000)
                  }
                  style={{
                    ...sp({ fontSize: 13 }),
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid var(--border-color-tertiary)",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label
                  style={sp({
                    display: "block",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: 4,
                  })}
                >
                  Top P ({formData.topP?.toFixed(2)})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={formData.topP ?? 1.0}
                  onChange={(e) => set("topP", parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent-color)" }}
                />
              </div>
              <div>
                <label
                  style={sp({
                    display: "block",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: 4,
                  })}
                >
                  Frequency Penalty
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={formData.frequencyPenalty ?? 0.0}
                  onChange={(e) =>
                    set("frequencyPenalty", parseFloat(e.target.value))
                  }
                  style={{ width: "100%", accentColor: "var(--accent-color)" }}
                />
                <span style={sp({ fontSize: 10, color: "var(--text-tertiary)" })}>
                  {formData.frequencyPenalty?.toFixed(1)} — Higher = less
                  repetition
                </span>
              </div>
              <div>
                <label
                  style={sp({
                    display: "block",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: 4,
                  })}
                >
                  Presence Penalty
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={formData.presencePenalty ?? 0.0}
                  onChange={(e) =>
                    set("presencePenalty", parseFloat(e.target.value))
                  }
                  style={{ width: "100%", accentColor: "var(--accent-color)" }}
                />
                <span style={sp({ fontSize: 10, color: "var(--text-tertiary)" })}>
                  {formData.presencePenalty?.toFixed(1)} — Higher = more
                  topical variety
                </span>
              </div>
            </div>
          )}
        </div>

        {/* -- Submit -- */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              ...sg({ fontSize: 14, fontWeight: 600 }),
              padding: "12px 32px",
              borderRadius: 10,
              border: "none",
              backgroundColor: "var(--accent-color)",
              color: "var(--card-bg)",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              transition: "opacity 150ms",
            }}
          >
            {saving
              ? "Saving..."
              : agent
                ? "Update Agent"
                : "Create Agent"}
          </button>
          {!agent && (
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                ...sg({ fontSize: 14, fontWeight: 500 }),
                padding: "12px 24px",
                borderRadius: 10,
                border: "1px solid var(--border-color-tertiary)",
                backgroundColor: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              Back to Templates
            </button>
          )}
        </div>
      </form>
    </div>
  );
}