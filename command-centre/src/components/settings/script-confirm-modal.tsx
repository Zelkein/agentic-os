"use client";

import { AlertTriangle } from "lucide-react";

interface ScriptConfirmModalProps {
  scriptLabel: string;
  scriptDescription: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ScriptConfirmModal({
  scriptLabel,
  scriptDescription,
  onConfirm,
  onCancel,
}: ScriptConfirmModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 420,
          width: "90%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <AlertTriangle size={24} color="#dc2626" />
        </div>

        <div
          style={{
            fontFamily: "var(--font-epilogue), Epilogue, sans-serif",
            fontSize: 18,
            fontWeight: 600,
            color: "#1B1C1B",
            textAlign: "center",
            marginTop: 12,
          }}
        >
          Confirm: {scriptLabel}
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#5E5E65",
            textAlign: "center",
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          {scriptDescription}
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#dc2626",
            backgroundColor: "rgba(220, 38, 38, 0.05)",
            padding: "10px 16px",
            borderRadius: 8,
            marginTop: 16,
            textAlign: "center",
          }}
        >
          This action may modify or remove files. Are you sure?
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px 16px",
              border: "1px solid rgba(218, 193, 185, 0.4)",
              borderRadius: 8,
              background: "transparent",
              color: "#5E5E65",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "10px 16px",
              border: "none",
              borderRadius: 8,
              background: "#dc2626",
              color: "var(--card-bg)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Run Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
