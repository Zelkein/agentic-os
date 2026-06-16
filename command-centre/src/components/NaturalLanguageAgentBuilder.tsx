"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Brain,
  Zap,
  ArrowRight,
  RotateCcw,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-react";

interface ParsedAgent {
  name: string;
  role: string;
  system_prompt: string;
  confidence: number;
}

interface Props {
  onSaved: () => void;
}

const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-inter), Inter, sans-serif",
  ...s,
});

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  ...s,
});

const ROLE_TEMPLATES = [
  {
    role: "orchestrator",
    icon: Brain,
    label: "Orchestrator",
    description: "Coordinates team workflows and delegates tasks",
    color: "#D4724A",
    bgColor: "rgba(212,114,74,0.12)",
  },
  {
    role: "coach",
    icon: Zap,
    label: "Coach",
    description: "Reviews work and teaches best practices",
    color: "var(--success)",
    bgColor: "rgba(107,142,107,0.12)",
  },
  {
    role: "assistant",
    icon: Sparkles,
    label: "Assistant",
    description: "Handles daily tasks and calculations",
    color: "#5B7FBF",
    bgColor: "rgba(91,127,191,0.12)",
  },
  {
    role: "sub_agent",
    icon: Brain,
    label: "Specialist",
    description: "Expert domain knowledge for specific tasks",
    color: "#8B6BAA",
    bgColor: "rgba(139,107,170,0.12)",
  },
];

function getRoleMeta(role: string) {
  return ROLE_TEMPLATES.find((t) => t.role === role) || ROLE_TEMPLATES[2];
}

const EXAMPLE_PROMPTS = [
  "Make me a coach that reviews MEP calculations and teaches best practices for ductwork design",
  "Create an orchestrator that coordinates HVAC, electrical, and plumbing teams for commercial projects",
  "Build a specialist that validates structural calculations against Quebec building codes",
  "I need an assistant that takes meeting notes, tracks action items, and sends follow-ups",
];

export default function NaturalLanguageAgentBuilder({ onSaved }: Props) {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedAgent | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [showExamples, setShowExamples] = useState(true);

  // LLM provider/model
  const [provider, setProvider] = useState("deepseek");
  const [model, setModel] = useState("deepseek-v4-flash");

  const PROVIDERS = useMemo(() => [
    { id: "deepseek", label: "DeepSeek" },
    { id: "claude", label: "Claude" },
    { id: "perplexity", label: "Perplexity" },
    { id: "kimi", label: "Kimi" },
  ], []);

  const MODELS: Record<string, string[]> = useMemo(() => ({
    deepseek: ["deepseek-v4-flash", "deepseek-v3"],
    claude: ["claude-opus-4", "claude-sonnet-4", "claude-haiku-3"],
    perplexity: ["sonar-pro", "sonar"],
    kimi: ["moonshot-v1-32k", "moonshot-v1"],
  }), []);

  const handleParse = async () => {
    if (!text.trim()) {
      setError("Please describe what agent you want to create");
      return;
    }

    setError("");
    setParsing(true);

    try {
      const res = await fetch("/api/parse-agent-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse intent");
      }

      const data = await res.json();
      setParsed(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error parsing intent");
    } finally {
      setParsing(false);
    }
  };

  const handleCreate = async () => {
    if (!parsed) return;

    setError("");
    setCreating(true);

    try {
      const body: Record<string, unknown> = {
        name: parsed.name,
        role: parsed.role,
        system_prompt: parsed.system_prompt,
        llm_provider: provider,
        llm_model: model,
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1.0,
        skills_json: [],
        workflows_json: [],
      };

      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create agent");
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating agent");
    } finally {
      setCreating(false);
    }
  };

  const handleReset = () => {
    setParsed(null);
    setText("");
    setError("");
  };

  const roleMeta = parsed ? getRoleMeta(parsed.role) : null;
  const confidenceLevel =
    !parsed ? "none" :
    parsed.confidence >= 0.85 ? "high" :
    parsed.confidence >= 0.6 ? "medium" : "low";

  const confidenceColor =
    confidenceLevel === "high" ? "var(--success)" :
    confidenceLevel === "medium" ? "var(--warning)" : "var(--error)";

  return (
    <div
      style={{
        maxWidth: 720,
        borderRadius: 14,
        border: "1px solid var(--border-color-secondary)",
        backgroundColor: "var(--bg-tertiary)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Sparkles size={20} color="var(--accent-color)" />
        <div>
          <h2 style={sg({ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 })}>
            Natural Language Agent Builder
          </h2>
          <p style={sp({ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" })}>
            Describe what you need and we'll generate the agent configuration
          </p>
        </div>
      </div>

      <div style={{ padding: "16px 24px 24px" }}>
        {/* Error banner */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 10,
              backgroundColor: "rgba(192, 64, 48, 0.08)",
              border: "1px solid rgba(192, 64, 48, 0.22)",
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={16} color="var(--error)" />
            <span style={sp({ fontSize: 13, color: "var(--error)", flex: 1 })}>{error}</span>
            <button
              onClick={() => setError("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--error)",
                fontSize: 12,
                fontFamily: "var(--font-inter), Inter, sans-serif",
                textDecoration: "underline",
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {!parsed ? (
          <>
            {/* Text input */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={sg({ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 })}
              >
                Describe your agent
              </label>
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (e.target.value.length > 0) setShowExamples(false);
                }}
                onFocus={() => setShowExamples(true)}
                placeholder="e.g., Make me a coach that reviews MEP calculations and teaches best practices..."
                rows={6}
                style={{
                  width: "100%",
                  minHeight: 120,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--border-color-tertiary)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  fontSize: 14,
                  lineHeight: 1.6,
                  resize: "vertical",
                  outline: "none",
                  transition: "border-color 150ms ease",
                  boxSizing: "border-box",
                }}
                onFocusCapture={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-color)";
                }}
                onBlurCapture={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color-tertiary)";
                }}
              />
            </div>

            {/* Example prompts */}
            {showExamples && text.length === 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={sp({ fontSize: 11, color: "var(--text-tertiary)", margin: "0 0 8px" })}>
                  Try an example:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {EXAMPLE_PROMPTS.map((example, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setText(example);
                        setShowExamples(false);
                      }}
                      style={{
                        textAlign: "left",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-secondary)",
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-inter), Inter, sans-serif",
                        fontSize: 12,
                        cursor: "pointer",
                        transition: "all 120ms ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent-color)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-color)";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Parse button */}
            <button
              onClick={handleParse}
              disabled={parsing || !text.trim()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                backgroundColor: text.trim() ? "var(--accent-color)" : "var(--bg-elevated)",
                color: text.trim() ? "var(--card-bg)" : "var(--text-tertiary)",
                fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                cursor: parsing || !text.trim() ? "not-allowed" : "pointer",
                transition: "all 150ms ease",
                opacity: parsing ? 0.7 : 1,
              }}
            >
              {parsing ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Parse Intent
                </>
              )}
            </button>
          </>
        ) : (
          <>
            {/* Parsed result */}
            <div
              style={{
                padding: "16px 20px",
                borderRadius: 12,
                border: "1px solid rgba(107, 142, 107, 0.22)",
                backgroundColor: "rgba(107, 142, 107, 0.04)",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                {/* Role icon */}
                {roleMeta && (
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: roleMeta.bgColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <roleMeta.icon size={22} color={roleMeta.color} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <h3 style={sg({ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 })}>
                      {parsed.name}
                    </h3>
                    {roleMeta && (
                      <span
                        style={sg({
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: roleMeta.color,
                          backgroundColor: roleMeta.bgColor,
                          padding: "2px 8px",
                          borderRadius: 999,
                        })}
                      >
                        {roleMeta.label}
                      </span>
                    )}
                  </div>
                  <p style={sp({ fontSize: 12, color: "var(--text-tertiary)", margin: "4px 0 0" })}>
                    {roleMeta?.description}
                  </p>
                </div>

                {/* Confidence badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 999,
                    backgroundColor:
                      confidenceLevel === "high"
                        ? "rgba(107,142,107,0.12)"
                        : confidenceLevel === "medium"
                          ? "rgba(212,114,74,0.12)"
                          : "rgba(192,64,48,0.12)",
                    flexShrink: 0,
                  }}
                >
                  <Check size={12} color={confidenceColor} />
                  <span style={sp({ fontSize: 11, fontWeight: 600, color: confidenceColor })}>
                    {(parsed.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* System prompt preview */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 8,
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  maxHeight: 160,
                  overflowY: "auto",
                  marginBottom: 16,
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontSize: 12,
                    lineHeight: 1.55,
                    color: "var(--text-secondary)",
                    whiteSpace: "pre-wrap",
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                  }}
                >
                  {parsed.system_prompt}
                </pre>
              </div>

              {/* Provider & Model pickers */}
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={sg({ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 })}>
                    LLM Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value);
                      setModel(MODELS[e.target.value]?.[0] || "");
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--border-color-tertiary)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-inter), Inter, sans-serif",
                      fontSize: 13,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={sg({ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 })}>
                    Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--border-color-tertiary)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-inter), Inter, sans-serif",
                      fontSize: 13,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    {(MODELS[provider] || []).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={handleReset}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "1px solid var(--border-color-secondary)",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 120ms ease",
                }}
              >
                <RotateCcw size={14} />
                Try Again
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 24px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: "var(--success)",
                  color: "var(--card-bg)",
                  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: creating ? "not-allowed" : "pointer",
                  transition: "all 150ms ease",
                  opacity: creating ? 0.7 : 1,
                }}
              >
                {creating ? (
                  <>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Agent
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
