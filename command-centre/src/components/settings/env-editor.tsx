"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { parseEnv, serializeEnv, type EnvEntry } from "@/lib/env-parser";
import { EnvRow } from "./env-row";

export function EnvEditor() {
  const [entries, setEntries] = useState<EnvEntry[]>([]);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [addingNew, setAddingNew] = useState(false);

  useEffect(() => {
    fetch("/api/settings/env")
      .then((r) => r.json())
      .then((data) => {
        if (data.exists) {
          setEntries(parseEnv(data.content));
          setLastModified(data.lastModified);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load environment file");
        setLoading(false);
      });
  }, []);

  const handleUpdate = (key: string, value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.key === key && !e.isComment ? { ...e, value } : e))
    );
    setDirty(true);
  };

  const handleDelete = (key: string) => {
    setEntries((prev) => prev.filter((e) => e.isComment || e.key !== key));
    setDirty(true);
  };

  const handleAddNew = (key: string, value: string) => {
    setEntries((prev) => [...prev, { key, value, isComment: false, raw: "" }]);
    setAddingNew(false);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const content = serializeEnv(entries);
      const res = await fetch("/api/settings/env", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, lastModified }),
      });
      if (res.status === 409) {
        setError("File was modified externally. Reload the page to get latest changes.");
        setSaving(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }
      const data = await res.json();
      setLastModified(data.lastModified);
      setDirty(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save environment file");
    } finally {
      setSaving(false);
    }
  };

  const visibleEntries = entries.filter((e) => !e.isComment);

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 40,
              background: "var(--bg-secondary)",
              borderRadius: 6,
              margin: "8px 0",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          borderBottom: "1px solid rgba(218, 193, 185, 0.2)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-epilogue), Epilogue, sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: "#1B1C1B",
          }}
        >
          Environment Variables
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setAddingNew(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid #93452A",
              color: "var(--accent-color)",
              background: "transparent",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Add Variable
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            style={{
              background: "var(--accent-color)",
              color: "var(--card-bg)",
              border: "none",
              borderRadius: 8,
              padding: "8px 20px",
              fontSize: 13,
              fontWeight: 500,
              cursor: !dirty || saving ? "not-allowed" : "pointer",
              opacity: !dirty || saving ? 0.5 : 1,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ color: "#dc2626", fontSize: 13, padding: "12px 20px" }}>{error}</div>
      )}

      {/* Entries */}
      {visibleEntries.length === 0 && !addingNew ? (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "#5E5E65",
            fontSize: 14,
          }}
        >
          No .env file found. Add variables to create one.
        </div>
      ) : (
        <div>
          {visibleEntries.map((entry) => (
            <EnvRow
              key={entry.key}
              entry={entry}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {addingNew && (
        <EnvRow
          entry={{ key: "", value: "" }}
          isNew
          onUpdate={handleAddNew}
          onDelete={() => {}}
          onCancelNew={() => setAddingNew(false)}
        />
      )}
    </div>
  );
}
