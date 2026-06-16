"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";

interface BoardColumn {
  id: string;
  title: string;
  statuses: string[];
  wipLimit: number | null;
  columnOrder: number;
}

const ALL_STATUSES = [
  { value: "backlog", label: "Backlog" },
  { value: "queued", label: "Queued" },
  { value: "running", label: "Running" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  ...s,
});
const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-inter), Inter, sans-serif",
  ...s,
});

interface BoardSettingsProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function BoardSettings({ open, onClose, onSaved }: BoardSettingsProps) {
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newStatuses, setNewStatuses] = useState<string[]>(["queued"]);
  const [newWipLimit, setNewWipLimit] = useState<string>("");

  const fetchColumns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/board-columns");
      const data = await res.json();
      setColumns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching board columns:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchColumns();
  }, [open, fetchColumns]);

  const handleAdd = async () => {
    if (!newTitle.trim() || newStatuses.length === 0) return;
    try {
      await fetch("/api/board-columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          statuses: newStatuses,
          wipLimit: newWipLimit ? parseInt(newWipLimit) : null,
        }),
      });
      setNewTitle("");
      setNewStatuses(["queued"]);
      setNewWipLimit("");
      await fetchColumns();
      onSaved();
    } catch (err) {
      console.error("Error adding column:", err);
    }
  };

  const handleUpdate = async (col: BoardColumn) => {
    try {
      await fetch("/api/board-columns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(col),
      });
      setEditingId(null);
      await fetchColumns();
      onSaved();
    } catch (err) {
      console.error("Error updating column:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/board-columns?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete");
        return;
      }
      await fetchColumns();
      onSaved();
    } catch (err) {
      console.error("Error deleting column:", err);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= columns.length) return;

    const updated = [...columns];
    const temp = updated[index].columnOrder;
    updated[index].columnOrder = updated[newIndex].columnOrder;
    updated[newIndex].columnOrder = temp;
    updated.sort((a, b) => a.columnOrder - b.columnOrder);

    // Save both
    try {
      await fetch("/api/board-columns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: updated[index].id, columnOrder: updated[index].columnOrder }),
      });
      await fetch("/api/board-columns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: updated[newIndex].id, columnOrder: updated[newIndex].columnOrder }),
      });
      await fetchColumns();
      onSaved();
    } catch (err) {
      console.error("Error reordering:", err);
    }
  };

  const toggleStatus = (status: string) => {
    setNewStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: "var(--bg-tertiary)",
          border: "1px solid var(--border-color-secondary)",
          borderRadius: 16,
          width: 520,
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-color-secondary)",
          }}
        >
          <h3 style={sg({ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: 0 })}>
            Board Settings
          </h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
          {loading ? (
            <p style={sp({ fontSize: 13, color: "var(--text-tertiary)" })}>Loading...</p>
          ) : (
            <>
              {/* Existing columns */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {columns.map((col, idx) => (
                  <div
                    key={col.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-secondary)",
                    }}
                  >
                    <GripVertical size={14} color="var(--text-tertiary)" style={{ flexShrink: 0, cursor: "grab" }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={sg({ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 })}>
                        {col.title}
                      </p>
                      <p style={sp({ fontSize: 11, color: "var(--text-tertiary)", margin: "2px 0 0" })}>
                        Statuses: {col.statuses.join(", ")}
                        {col.wipLimit !== null && ` · WIP: ${col.wipLimit}`}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={() => handleMove(idx, "up")}
                        disabled={idx === 0}
                        style={{ background: "none", border: "none", cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.3 : 1, color: "var(--text-secondary)", padding: 4 }}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => handleMove(idx, "down")}
                        disabled={idx === columns.length - 1}
                        style={{ background: "none", border: "none", cursor: idx === columns.length - 1 ? "not-allowed" : "pointer", opacity: idx === columns.length - 1 ? 0.3 : 1, color: "var(--text-secondary)", padding: 4 }}
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(col.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--error)", padding: 4 }}
                        title="Delete column"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add new column */}
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 8,
                  border: "1px dashed var(--border-color-secondary)",
                  backgroundColor: "var(--bg-secondary)",
                }}
              >
                <p style={sg({ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 10px" })}>
                  Add Column
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Column name..."
                    style={{
                      ...sp({ fontSize: 13 }),
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid var(--border-color-secondary)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                  />

                  {/* Status checkboxes */}
                  <div>
                    <p style={sp({ fontSize: 11, color: "var(--text-tertiary)", margin: "0 0 4px" })}>
                      Maps to statuses:
                    </p>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {ALL_STATUSES.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => toggleStatus(s.value)}
                          style={{
                            ...sp({ fontSize: 11, fontWeight: 500 }),
                            padding: "4px 10px",
                            borderRadius: 4,
                            border: `1px solid ${newStatuses.includes(s.value) ? "var(--accent-color)" : "var(--border-color-secondary)"}`,
                            backgroundColor: newStatuses.includes(s.value) ? "rgba(212,114,74,0.12)" : "transparent",
                            color: newStatuses.includes(s.value) ? "var(--accent-color)" : "var(--text-secondary)",
                            cursor: "pointer",
                            transition: "all 120ms ease",
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* WIP limit */}
                  <input
                    value={newWipLimit}
                    onChange={(e) => setNewWipLimit(e.target.value.replace(/\D/g, ""))}
                    placeholder="WIP limit (optional)"
                    type="number"
                    min={0}
                    style={{
                      ...sp({ fontSize: 13 }),
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid var(--border-color-secondary)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      outline: "none",
                      width: 160,
                    }}
                  />

                  <button
                    onClick={handleAdd}
                    disabled={!newTitle.trim() || newStatuses.length === 0}
                    style={{
                      ...sp({ fontSize: 12, fontWeight: 600 }),
                      padding: "8px 16px",
                      borderRadius: 6,
                      border: "none",
                      backgroundColor: !newTitle.trim() || newStatuses.length === 0 ? "var(--bg-elevated)" : "var(--accent-color)",
                      color: !newTitle.trim() || newStatuses.length === 0 ? "var(--text-tertiary)" : "#fff",
                      cursor: !newTitle.trim() || newStatuses.length === 0 ? "not-allowed" : "pointer",
                      alignSelf: "flex-start",
                    }}
                  >
                    <Plus size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    Add Column
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}