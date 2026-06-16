"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useContextStore } from "@/store/context-store";
import { useTaskStore } from "@/store/task-store";
import { useClientStore } from "@/store/client-store";

export function BrandContextBanner() {
  const hasBrandContext = useContextStore((s) => s.hasBrandContext);
  const fetchContextStatus = useContextStore((s) => s.fetchContextStatus);
  const createTask = useTaskStore((s) => s.createTask);
  const selectedClientId = useClientStore((s) => s.selectedClientId);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchContextStatus(selectedClientId);
  }, [selectedClientId, fetchContextStatus]);

  if (hasBrandContext !== false) return null;

  const handleRunStartHere = async () => {
    setCreating(true);
    try {
      await createTask(
        "Start Here",
        "Run /start-here",
        "task",
        null,  // projectSlug
        null,  // parentId
        "bypassPermissions"
      );
      // Find the newly created task and queue it
      const tasks = useTaskStore.getState().tasks;
      const startHereTask = tasks.find(
        (t) => t.title === "Start Here" && t.status === "backlog"
      );
      if (startHereTask) {
        await useTaskStore.getState().updateTask(startHereTask.id, { status: "queued" });
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        marginBottom: 12,
        borderRadius: 8,
        backgroundColor: "rgba(218, 193, 185, 0.15)",
        border: "1px solid rgba(218, 193, 185, 0.3)",
      }}
    >
      <Sparkles size={18} style={{ color: "var(--accent-color)", flexShrink: 0 }} />
      <span
        style={{
          flex: 1,
          fontSize: 13,
          fontFamily: "var(--font-inter), Inter, sans-serif",
          color: "var(--text-primary)",
        }}
      >
        Brand context is missing. Run the onboarding flow to set up your voice, positioning, and ICP.
      </span>
      <button
        onClick={handleRunStartHere}
        disabled={creating}
        style={{
          padding: "6px 14px",
          borderRadius: 6,
          border: "none",
          backgroundColor: "var(--accent-color)",
          color: "var(--card-bg)",
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
          cursor: creating ? "not-allowed" : "pointer",
          opacity: creating ? 0.6 : 1,
          whiteSpace: "nowrap",
        }}
      >
        {creating ? "Creating..." : "Run Start-Here"}
      </button>
    </div>
  );
}
