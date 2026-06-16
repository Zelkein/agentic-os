"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Filter,
  X,
  ChevronDown,
  Save,
  Trash2,
  Clock,
  Calendar,
  ArrowUpDown,
} from "lucide-react";
import { useFilterStore, type SavedView, type FilterState } from "@/store/filter-store";

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent", color: "var(--error)" },
  { value: "high", label: "High", color: "var(--warning)" },
  { value: "normal", label: "Normal", color: "var(--text-primary)" },
  { value: "low", label: "Low", color: "var(--text-tertiary)" },
];

const STATUS_OPTIONS = [
  { value: "backlog", label: "Backlog" },
  { value: "queued", label: "Queued" },
  { value: "running", label: "Running" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

export function FilterBar() {
  const {
    filters,
    savedViews,
    activeViewId,
    setFilter,
    setFilters,
    resetFilters,
    hasActiveFilters,
    fetchSavedViews,
    saveView,
    deleteView,
    applyView,
  } = useFilterStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewName, setViewName] = useState("");
  const [showViews, setShowViews] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const saveInputRef = useRef<HTMLInputElement>(null);
  const active = hasActiveFilters();

  useEffect(() => {
    fetchSavedViews();
  }, [fetchSavedViews]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        setShowSaveDialog(false);
        setShowViews(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (showSaveDialog && saveInputRef.current) {
      saveInputRef.current.focus();
    }
  }, [showSaveDialog]);

  const handleSave = useCallback(() => {
    if (viewName.trim()) {
      saveView(viewName.trim(), "board");
      setViewName("");
      setShowSaveDialog(false);
    }
  }, [viewName, saveView]);

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 10px",
            borderRadius: 6,
            border: `1px solid ${active ? "var(--accent-color)" : "var(--border-color-tertiary)"}`,
            background: active ? "var(--accent-color)12" : "var(--bg-secondary)",
            color: active ? "var(--accent-color)" : "var(--text-secondary)",
            fontSize: 12,
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 120ms ease",
          }}
        >
          <Filter size={13} />
          Filters
          {active && <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--accent-color)" }} />}
          <ChevronDown size={11} />
        </button>

        {/* Saved Views button */}
        <button
          onClick={() => setShowViews(!showViews)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "5px 8px",
            borderRadius: 6,
            border: "1px solid var(--border-color-tertiary)",
            background: "var(--bg-secondary)",
            color: "var(--text-secondary)",
            fontSize: 11,
            fontFamily: "var(--font-inter), Inter, sans-serif",
            cursor: "pointer",
            transition: "all 120ms ease",
          }}
        >
          Views
          <ChevronDown size={10} />
        </button>

        {/* Active filter pills */}
        {filters.status && (
          <Pill
            label={`Status: ${filters.status}`}
            onRemove={() => setFilter("status", null)}
          />
        )}
        {filters.priority && (
          <Pill
            label={`Priority: ${filters.priority}`}
            color={
              PRIORITY_OPTIONS.find((p) => p.value === filters.priority)?.color
            }
            onRemove={() => setFilter("priority", null)}
          />
        )}
        {filters.tagIds.length > 0 && (
          <Pill
            label={`${filters.tagIds.length} tags`}
            onRemove={() => setFilter("tagIds", [])}
          />
        )}
        {activeViewId && (
          <Pill
            label={savedViews.find((v) => v.id === activeViewId)?.name || "View"}
            color="var(--accent-color)"
            onRemove={resetFilters}
          />
        )}

        {active && (
          <button
            onClick={resetFilters}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--text-tertiary)",
              fontSize: 11,
              cursor: "pointer",
              padding: "3px 6px",
              textDecoration: "underline",
              fontFamily: "var(--font-inter), Inter, sans-serif",
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter dropdown */}
      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            width: 260,
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            zIndex: 100,
            padding: 8,
          }}
        >
          {/* Status filter */}
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
                padding: "0 4px",
              }}
            >
              Status
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setFilter(
                      "status",
                      filters.status === opt.value ? null : opt.value
                    )
                  }
                  style={{
                    padding: "3px 8px",
                    borderRadius: 4,
                    border: "1px solid var(--border-color-tertiary)",
                    background:
                      filters.status === opt.value
                        ? "var(--accent-color)20"
                        : "transparent",
                    color:
                      filters.status === opt.value
                        ? "var(--accent-color)"
                        : "var(--text-secondary)",
                    fontSize: 11,
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                    cursor: "pointer",
                    transition: "all 100ms ease",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority filter */}
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
                padding: "0 4px",
              }}
            >
              Priority
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setFilter(
                      "priority",
                      filters.priority === opt.value ? null : opt.value
                    )
                  }
                  style={{
                    padding: "3px 8px",
                    borderRadius: 4,
                    border: "1px solid var(--border-color-tertiary)",
                    background:
                      filters.priority === opt.value
                        ? `${opt.color}20`
                        : "transparent",
                    color:
                      filters.priority === opt.value
                        ? opt.color
                        : "var(--text-secondary)",
                    fontSize: 11,
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                    cursor: "pointer",
                    transition: "all 100ms ease",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save as view */}
          <div
            style={{
              borderTop: "1px solid var(--border-color-tertiary)",
              paddingTop: 8,
              marginTop: 4,
            }}
          >
            {showSaveDialog ? (
              <div style={{ display: "flex", gap: 4 }}>
                <input
                  ref={saveInputRef}
                  type="text"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="View name..."
                  style={{
                    flex: 1,
                    padding: "4px 8px",
                    borderRadius: 4,
                    border: "1px solid var(--border-color-tertiary)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    fontSize: 12,
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleSave}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 4,
                    border: "none",
                    background: "var(--accent-color)",
                    color: "#fff",
                    fontSize: 11,
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveDialog(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 8px",
                  border: "none",
                  background: "transparent",
                  color: "var(--accent-color)",
                  fontSize: 11,
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  cursor: "pointer",
                  width: "100%",
                  borderRadius: 4,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <Save size={12} />
                Save as view
              </button>
            )}
          </div>
        </div>
      )}

      {/* Saved Views dropdown */}
      {showViews && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 80,
            width: 220,
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            zIndex: 100,
            padding: 4,
            maxHeight: 300,
            overflowY: "auto",
          }}
        >
          {savedViews.length === 0 ? (
            <div
              style={{
                padding: "12px 8px",
                textAlign: "center",
                fontSize: 11,
                color: "var(--text-tertiary)",
              }}
            >
              No saved views yet
            </div>
          ) : (
            savedViews.map((view) => (
              <div
                key={view.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "5px 8px",
                  borderRadius: 6,
                  background:
                    activeViewId === view.id
                      ? "var(--accent-color)12"
                      : "transparent",
                }}
              >
                <button
                  onClick={() => applyView(view)}
                  style={{
                    flex: 1,
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    color:
                      activeViewId === view.id
                        ? "var(--accent-color)"
                        : "var(--text-primary)",
                    fontSize: 12,
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                    cursor: "pointer",
                    padding: "2px 0",
                    fontWeight: activeViewId === view.id ? 600 : 400,
                  }}
                >
                  {view.name}
                </button>
                <button
                  onClick={() => deleteView(view.id)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--text-tertiary)",
                    cursor: "pointer",
                    padding: 2,
                    display: "flex",
                    opacity: 0.5,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.color = "var(--error)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.5";
                    e.currentTarget.style.color = "var(--text-tertiary)";
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Pill({
  label,
  color,
  onRemove,
}: {
  label: string;
  color?: string;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        padding: "2px 6px 2px 8px",
        borderRadius: 4,
        background: color ? `${color}18` : "var(--bg-hover)",
        fontSize: 11,
        fontFamily: "var(--font-inter), Inter, sans-serif",
        color: color || "var(--text-secondary)",
        fontWeight: 500,
      }}
    >
      {label}
      <button
        onClick={onRemove}
        style={{
          border: "none",
          background: "transparent",
          color: "inherit",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          opacity: 0.6,
        }}
      >
        <X size={10} />
      </button>
    </div>
  );
}
