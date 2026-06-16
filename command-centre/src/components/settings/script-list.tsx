"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, Check, XCircle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { ScriptConfirmModal } from "@/components/settings/script-confirm-modal";
import { ScriptRunner } from "@/components/settings/script-runner";
import type { ScriptDefinition } from "@/lib/script-registry";

export function ScriptList() {
  const [scripts, setScripts] = useState<ScriptDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedScript, setExpandedScript] = useState<string | null>(null);
  const [argValues, setArgValues] = useState<Record<string, string>>({});
  const [runningScript, setRunningScript] = useState<{
    executionId: string;
    id: string;
    label: string;
    args: Record<string, string>;
  } | null>(null);
  const [confirmScript, setConfirmScript] = useState<ScriptDefinition | null>(null);
  const [lastResult, setLastResult] = useState<Record<string, "success" | "error">>({});

  useEffect(() => {
    fetch("/api/settings/scripts")
      .then((r) => r.json())
      .then((data) => {
        setScripts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleRunClick = useCallback(
    (script: ScriptDefinition) => {
      // If script has args and isn't expanded yet, expand the form
      if (script.args.length > 0 && expandedScript !== script.id) {
        setExpandedScript(script.id);
        setArgValues({});
        return;
      }

      // Collect args
      const args: Record<string, string> = {};
      for (const arg of script.args) {
        args[arg.name] = argValues[arg.name] || "";
      }

      // If destructive, show confirmation
      if (script.destructive) {
        setConfirmScript(script);
        return;
      }

      // Start execution
      startExecution(script, args);
    },
    [expandedScript, argValues],
  );

  const handleExecuteFromForm = useCallback(
    (script: ScriptDefinition) => {
      const args: Record<string, string> = {};
      for (const arg of script.args) {
        args[arg.name] = argValues[arg.name] || "";
      }

      if (script.destructive) {
        setConfirmScript(script);
        return;
      }

      startExecution(script, args);
    },
    [argValues],
  );

  const startExecution = useCallback((script: ScriptDefinition, args: Record<string, string>) => {
    setRunningScript({
      executionId: crypto.randomUUID(),
      id: script.id,
      label: script.label,
      args,
    });
    setExpandedScript(null);
    setConfirmScript(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!confirmScript) return;
    const args: Record<string, string> = {};
    for (const arg of confirmScript.args) {
      args[arg.name] = argValues[arg.name] || "";
    }
    startExecution(confirmScript, args);
  }, [confirmScript, argValues, startExecution]);

  const handleComplete = useCallback(
    (success: boolean) => {
      if (runningScript) {
        setLastResult((prev) => ({
          ...prev,
          [runningScript.id]: success ? "success" : "error",
        }));
      }
    },
    [runningScript],
  );

  const handleRunnerClose = useCallback(() => {
    setRunningScript(null);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24, color: "#5E5E65", fontSize: 14 }}>
        Loading scripts...
      </div>
    );
  }

  const allArgsValid = (script: ScriptDefinition) =>
    script.args.every((arg) => !arg.required || (argValues[arg.name] || "").trim() !== "");

  return (
    <div>
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(218, 193, 185, 0.2)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-epilogue), Epilogue, sans-serif",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          System Scripts
        </div>
        <div style={{ fontSize: 13, color: "#5E5E65", marginTop: 4 }}>
          Run maintenance and setup scripts for your Agentic OS installation
        </div>
      </div>

      {/* Script cards */}
      {scripts.map((script) => (
        <div
          key={script.id}
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(218, 193, 185, 0.1)",
          }}
        >
          {/* Top row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1B1C1B" }}>
                {script.label}
              </div>
              <div style={{ fontSize: 13, color: "#5E5E65", marginTop: 2 }}>
                {script.description}
              </div>
              {script.helpUrl && (
                <a
                  href={script.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    color: "var(--accent-color)",
                    textDecoration: "none",
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                >
                  <ExternalLink size={12} />
                  Watch video guide
                </a>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 16, flexShrink: 0 }}>
              {script.destructive && (
                <span
                  style={{
                    display: "inline-flex",
                    padding: "2px 8px",
                    borderRadius: 4,
                    backgroundColor: "rgba(220, 38, 38, 0.08)",
                    color: "#dc2626",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Destructive
                </span>
              )}
              {script.longRunning && (
                <span
                  style={{
                    display: "inline-flex",
                    padding: "2px 8px",
                    borderRadius: 4,
                    backgroundColor: "rgba(245, 158, 11, 0.08)",
                    color: "#d97706",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Long-running
                </span>
              )}
              {lastResult[script.id] === "success" && (
                <Check size={16} color="#16a34a" />
              )}
              {lastResult[script.id] === "error" && (
                <XCircle size={16} color="#dc2626" />
              )}
              <button
                onClick={() => handleRunClick(script)}
                disabled={runningScript !== null}
                style={{
                  backgroundColor: runningScript !== null ? "rgba(147, 69, 42, 0.5)" : "var(--accent-color)",
                  color: "var(--card-bg)",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: runningScript !== null ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: runningScript !== null ? 0.5 : 1,
                }}
              >
                {script.args.length > 0 && expandedScript !== script.id ? (
                  <ChevronDown size={16} />
                ) : script.args.length > 0 && expandedScript === script.id ? (
                  <ChevronUp size={16} />
                ) : (
                  <Play size={16} />
                )}
                Run
              </button>
            </div>
          </div>

          {/* Arg form */}
          {expandedScript === script.id && script.args.length > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: 16,
                backgroundColor: "#FAFBFC",
                borderRadius: 8,
                border: "1px solid rgba(218, 193, 185, 0.2)",
              }}
            >
              {script.args.map((arg) => (
                <div key={arg.name} style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#5E5E65",
                      marginBottom: 4,
                    }}
                  >
                    {arg.label}
                    {arg.required && (
                      <span style={{ color: "#dc2626", marginLeft: 2 }}>*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={argValues[arg.name] || ""}
                    onChange={(e) =>
                      setArgValues((prev) => ({ ...prev, [arg.name]: e.target.value }))
                    }
                    placeholder={arg.placeholder || ""}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid rgba(218, 193, 185, 0.4)",
                      borderRadius: 6,
                      fontSize: 13,
                      fontFamily: "var(--font-inter), Inter, sans-serif",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent-color)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(218, 193, 185, 0.4)";
                    }}
                  />
                </div>
              ))}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => {
                    setExpandedScript(null);
                    setArgValues({});
                  }}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid rgba(218, 193, 185, 0.4)",
                    borderRadius: 8,
                    background: "transparent",
                    color: "#5E5E65",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleExecuteFromForm(script)}
                  disabled={!allArgsValid(script) || runningScript !== null}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: 8,
                    backgroundColor:
                      !allArgsValid(script) || runningScript !== null
                        ? "rgba(147, 69, 42, 0.5)"
                        : "var(--accent-color)",
                    color: "var(--card-bg)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor:
                      !allArgsValid(script) || runningScript !== null ? "not-allowed" : "pointer",
                    opacity: !allArgsValid(script) || runningScript !== null ? 0.5 : 1,
                  }}
                >
                  Execute
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Script runner */}
      {runningScript && (
        <ScriptRunner
          key={runningScript.executionId}
          executionId={runningScript.executionId}
          scriptId={runningScript.id}
          scriptLabel={runningScript.label}
          args={runningScript.args}
          onClose={handleRunnerClose}
          onComplete={handleComplete}
        />
      )}

      {/* Confirm modal */}
      {confirmScript && (
        <ScriptConfirmModal
          scriptLabel={confirmScript.label}
          scriptDescription={confirmScript.description}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmScript(null)}
        />
      )}
    </div>
  );
}
