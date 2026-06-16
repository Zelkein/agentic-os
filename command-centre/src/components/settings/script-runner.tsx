"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { createScriptRunnerSession, type ScriptRunnerSession } from "@/lib/script-runner-session";

interface ScriptRunnerProps {
  executionId: string;
  scriptId: string;
  scriptLabel: string;
  args: Record<string, string>;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

interface OutputLine {
  type: "stdout" | "stderr";
  data: string;
}

export function ScriptRunner({
  executionId,
  scriptId,
  scriptLabel,
  args,
  onClose,
  onComplete,
}: ScriptRunnerProps) {
  const [lines, setLines] = useState<OutputLine[]>([]);
  const [status, setStatus] = useState<"running" | "success" | "error">("running");
  const [exitCode, setExitCode] = useState<number | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<ScriptRunnerSession | null>(null);
  const onCompleteRef = useRef(onComplete);

  if (!sessionRef.current) {
    sessionRef.current = createScriptRunnerSession();
  }

  onCompleteRef.current = onComplete;

  useEffect(() => {
    const session = sessionRef.current!;
    const shouldStart = session.begin();

    const completeOnce = (success: boolean, code: number) => {
      if (!session.complete()) return;
      if (session.isDisposed()) return;
      setStatus(success ? "success" : "error");
      setExitCode(code);
      onCompleteRef.current(success);
    };

    if (!shouldStart) {
      return () => {
        session.dispose();
      };
    }

    async function run() {
      const appendLine = (type: "stdout" | "stderr", data: string) => {
        if (session.isDisposed()) return;
        setLines((prev) => [...prev, { type, data }]);
      };

      try {
        const response = await fetch("/api/settings/scripts/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scriptId, args }),
        });

        if (!response.ok) {
          const text = await response.text();
          appendLine("stderr", `Error: ${response.status} - ${text}`);
          completeOnce(false, 1);
          return;
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            if (!part.trim()) continue;
            try {
              const parsed = JSON.parse(part);
              if (parsed.type === "stdout" || parsed.type === "stderr") {
                appendLine(parsed.type, parsed.data || "");
              } else if (parsed.type === "exit") {
                const success = parsed.code === 0;
                completeOnce(success, parsed.code ?? 1);
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
          try {
            const parsed = JSON.parse(buffer);
            if (parsed.type === "exit") {
              const success = parsed.code === 0;
              completeOnce(success, parsed.code ?? 1);
            }
          } catch {
            // Ignore
          }
        }
      } catch (err: unknown) {
        appendLine("stderr", `Connection error: ${err instanceof Error ? err.message : "Unknown error"}`);
        completeOnce(false, 1);
      }
    }

    run();

    return () => {
      session.dispose();
    };
  }, [args, executionId, scriptId]);

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
  }, [lines]);

  return (
    <div
      style={{
        backgroundColor: "#1B1C1B",
        borderRadius: 8,
        overflow: "hidden",
        margin: "0 20px 20px",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 16px",
          backgroundColor: "rgba(255,255,255,0.05)",
        }}
      >
        <span style={{ color: "var(--bg-secondary)", fontSize: 13, fontWeight: 500 }}>
          {scriptLabel}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: status === "error" ? "#dc2626" : "#16a34a",
              animation: status === "running" ? "pulse-dot 1.5s ease-in-out infinite" : "none",
            }}
          />
          <span
            style={{
              fontSize: 12,
              color: status === "error" ? "#dc2626" : "#16a34a",
            }}
          >
            {status === "running" ? "Running..." : status === "success" ? "Completed" : "Failed"}
          </span>
        </div>

        {status !== "running" && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={16} color="#5E5E65" />
          </button>
        )}
        {status === "running" && <div style={{ width: 24 }} />}
      </div>

      {/* Output area */}
      <div
        ref={outputRef}
        style={{
          maxHeight: 400,
          overflowY: "auto",
          padding: 16,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          lineHeight: 1.7,
        }}
      >
        {lines.map((line, i) => (
          <pre
            key={i}
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              color: line.type === "stderr" ? "#fbbf24" : "#d4d4d8",
            }}
          >
            {line.data}
          </pre>
        ))}
        {lines.length === 0 && status === "running" && (
          <span style={{ color: "#5E5E65", fontSize: 12 }}>Waiting for output...</span>
        )}
      </div>

      {/* Exit code footer */}
      {status !== "running" && exitCode !== null && (
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            fontSize: 12,
            color: exitCode === 0 ? "#16a34a" : "#dc2626",
          }}
        >
          Exited with code {exitCode}
        </div>
      )}
    </div>
  );
}
