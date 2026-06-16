"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { X, Plus, Tag as TagIcon } from "lucide-react";
import type { Tag } from "@/types/task";

export function TagPill({ tag, onRemove }: { tag: Tag; onRemove?: () => void }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px 2px 6px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 500,
        fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
        backgroundColor: tag.color + "20",
        color: tag.color,
        lineHeight: "18px",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: tag.color,
          flexShrink: 0,
        }}
      />
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 14,
            height: 14,
            border: "none",
            borderRadius: 3,
            background: "transparent",
            cursor: "pointer",
            padding: 0,
            color: tag.color,
            opacity: 0.6,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
        >
          <X size={10} />
        </button>
      )}
    </span>
  );
}

export function TagPicker({
  taskId,
  selectedTags,
  onTagsChange,
  value,
  onChange,
  onOpenChange,
}: {
  taskId?: string;
  selectedTags?: Tag[];
  onTagsChange?: (tags: Tag[]) => void;
  /** Single-tag mode: used by feed-view which passes a string tag name */
  value?: string | null;
  onChange?: (tag: string | null) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const [showCreate, setShowCreate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Normalize: support both multi-tag (selectedTags: Tag[]) and single-tag (value: string) modes
  const isSingleTagMode = value !== undefined;
  const effectiveTags: Tag[] = isSingleTagMode
    ? allTags.filter((t) => t.name === value)
    : (selectedTags || []);

  const handleTagsChange = (tags: Tag[]) => {
    if (isSingleTagMode) {
      const newVal = tags.length > 0 ? tags[tags.length - 1].name : null;
      onChange?.(newVal);
      onTagsChange?.(tags);
    } else {
      onTagsChange?.(tags);
    }
  };

  const COLORS = [
    "#EF4444", "#F97316", "#EAB308", "#22C55E", "#06B6D4",
    "#6366f1", "#A855F7", "#EC4899", "#6B7280",
  ];

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then(setAllTags)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selectedIds = new Set(effectiveTags.map((t) => t.id));

  const toggleTag = async (tagId: string) => {
    const isSelected = selectedIds.has(tagId);
    if (isSingleTagMode) {
      // Single-tag mode: just call onChange with the new tag name
      const tag = allTags.find((t) => t.id === tagId);
      onChange?.(tag ? tag.name : null);
      onOpenChange?.(false);
      return;
    }
    try {
      if (isSelected) {
        await fetch(`/api/tasks/${taskId}/tags`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagId }),
        });
        handleTagsChange(effectiveTags.filter((t) => t.id !== tagId));
      } else {
        const res = await fetch(`/api/tasks/${taskId}/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagId }),
        });
        const updated = await res.json();
        handleTagsChange(updated);
      }
    } catch {}
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      });
      const tag = await res.json();
      setAllTags((prev) => [...prev, tag]);
      setNewTagName("");
      setShowCreate(false);
      // Auto-add to task
      await toggleTag(tag.id);
    } catch {}
  };

  const availableTags = allTags.filter((t) => !selectedIds.has(t.id));

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Selected tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
        {effectiveTags.map((tag) => (
          <TagPill key={tag.id} tag={tag} onRemove={() => toggleTag(tag.id)} />
        ))}
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            border: "1px dashed var(--border-color)",
            borderRadius: 4,
            background: "transparent",
            cursor: "pointer",
            fontSize: 11,
            color: "var(--text-tertiary)",
            fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
            lineHeight: "18px",
            transition: "all 120ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-color)";
            e.currentTarget.style.color = "var(--accent-color)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-color)";
            e.currentTarget.style.color = "var(--text-tertiary)";
          }}
        >
          <Plus size={10} />
          Tag
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 4,
            minWidth: 220,
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--border-color)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            zIndex: 100,
            padding: 6,
          }}
        >
          {/* Existing tags */}
          {availableTags.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    border: "none",
                    borderRadius: 6,
                    background: "transparent",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                    textAlign: "left",
                    width: "100%",
                    transition: "background 100ms ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: tag.color,
                      flexShrink: 0,
                    }}
                  />
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          {/* Create new tag */}
          {showCreate ? (
            <div style={{ padding: "6px 4px", display: "flex", flexDirection: "column", gap: 6 }}>
              <input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name..."
                style={{
                  padding: "6px 8px",
                  border: "1px solid var(--border-color)",
                  borderRadius: 6,
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  outline: "none",
                }}
                onKeyDown={(e) => { if (e.key === "Enter") createTag(); }}
                autoFocus
              />
              <div style={{ display: "flex", gap: 4 }}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewTagColor(c)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: c === newTagColor ? "2px solid var(--text-primary)" : "2px solid transparent",
                      backgroundColor: c,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={createTag}
                  style={{
                    padding: "4px 12px",
                    border: "none",
                    borderRadius: 6,
                    background: "var(--accent-color)",
                    color: "var(--card-bg)",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                  }}
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  style={{
                    padding: "4px 12px",
                    border: "none",
                    borderRadius: 6,
                    background: "transparent",
                    color: "var(--text-secondary)",
                    fontSize: 11,
                    cursor: "pointer",
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                border: "none",
                borderRadius: 6,
                background: "transparent",
                color: "var(--text-tertiary)",
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "var(--font-inter), Inter, sans-serif",
                width: "100%",
                marginTop: 4,
                transition: "background 100ms ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <Plus size={12} />
              Create new tag
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* -- TagFilterBar ------------------------------ */

interface TagFilterBarProps {
  tasks: Array<{ tags?: Tag[] }>;
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
}

export function TagFilterBar({ tasks, activeTag, onTagChange }: TagFilterBarProps) {
  // Collect unique tags across all tasks
  const allTags = useMemo(() => {
    const map = new Map<string, Tag>();
    for (const task of tasks) {
      for (const tag of task.tags || []) {
        if (!map.has(tag.id)) map.set(tag.id, tag);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  if (allTags.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 12px",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--text-tertiary)",
          marginRight: 4,
        }}
      >
        Tags:
      </span>

      <button
        onClick={() => onTagChange(null)}
        style={{
          fontSize: 11,
          fontWeight: activeTag === null ? 700 : 500,
          fontFamily: "var(--font-inter), Inter, sans-serif",
          padding: "2px 8px",
          borderRadius: 4,
          border: "1px solid var(--border-color-secondary)",
          backgroundColor: activeTag === null ? "var(--accent-color)" : "transparent",
          color: activeTag === null ? "#fff" : "var(--text-secondary)",
          cursor: "pointer",
          transition: "all 120ms ease",
        }}
      >
        All
      </button>

      {allTags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => onTagChange(activeTag === tag.id ? null : tag.id)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontWeight: activeTag === tag.id ? 700 : 500,
            fontFamily: "var(--font-inter), Inter, sans-serif",
            padding: "2px 8px",
            borderRadius: 4,
            border: `1px solid ${tag.color}40`,
            backgroundColor: activeTag === tag.id ? `${tag.color}30` : "transparent",
            color: tag.color,
            cursor: "pointer",
            transition: "all 120ms ease",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: tag.color,
              display: "inline-block",
            }}
          />
          {tag.name}
        </button>
      ))}
    </div>
  );
}