"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function BoardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Board page error:", error);
  }, [error]);

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "80px auto",
        padding: "40px 24px",
        textAlign: "center",
        backgroundColor: "var(--bg-tertiary)",
        border: "1px solid var(--border-color-secondary)",
        borderRadius: 14,
      }}
    >
      <AlertTriangle
        size={40}
        color="var(--error)"
        style={{ marginBottom: 16, opacity: 0.6 }}
      />
      <h2
        style={{
          fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
          fontSize: 18,
          fontWeight: 700,
          color: "var(--text-primary)",
          margin: "0 0 8px",
        }}
      >
        Board failed to load
      </h2>
      <p
        style={{
          fontFamily: "var(--font-inter), Inter, sans-serif",
          fontSize: 14,
          color: "var(--text-secondary)",
          margin: "0 0 24px",
          lineHeight: 1.5,
        }}
      >
        The task board encountered an error. Please try again or navigate back.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            backgroundColor: "var(--accent-color)",
            color: "var(--card-bg)",
            fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <RotateCcw size={16} />
          Try again
        </button>
        <a
          href="/"
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "1px solid var(--border-color-secondary)",
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Go home
        </a>
      </div>
    </div>
  );
}
