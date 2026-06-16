"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, ArrowRight, FileText, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    type: "task";
  }>;
  comments: Array<{
    taskId: string;
    taskTitle: string;
    snippet: string;
    type: "comment";
  }>;
  likeResults: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    type: "task";
  }>;
}

const statusColors: Record<string, string> = {
  backlog: "var(--text-tertiary)",
  queued: "var(--warning)",
  running: "var(--accent-color)",
  review: "var(--warning)",
  done: "var(--success)",
};

const priorityColors: Record<string, string> = {
  urgent: "var(--error)",
  high: "var(--warning)",
  normal: "var(--text-primary)",
  low: "var(--text-tertiary)",
  none: "var(--text-tertiary)",
};

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const performSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=15`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
        setIsOpen(true);
        setSelectedIndex(0);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, performSearch]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const allResults = [
    ...(results?.tasks || []),
    ...(results?.likeResults || []),
    ...(results?.comments || []),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allResults[selectedIndex]) {
      e.preventDefault();
      const item = allResults[selectedIndex];
      if (item.type === "task") {
        router.push(`/?task=${item.id}`);
      } else if (item.type === "comment") {
        router.push(`/?task=${item.taskId}`);
      }
      setIsOpen(false);
      setQuery("");
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div style={{ position: "relative", width: 280 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px",
          borderRadius: 8,
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-color-tertiary)",
          transition: "border-color 150ms ease",
        }}
      >
        <Search size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results && query.length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search tasks..."
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            color: "var(--text-primary)",
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 13,
            outline: "none",
          }}
        />
        {isLoading && (
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              border: "2px solid var(--border-color)",
              borderTopColor: "var(--accent-color)",
              animation: "spin 0.6s linear infinite",
              flexShrink: 0,
            }}
          />
        )}
        {query && !isLoading && (
          <button
            onClick={() => {
              setQuery("");
              setResults(null);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              padding: 0,
              display: "flex",
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && allResults.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            zIndex: 100,
            maxHeight: 400,
            overflowY: "auto",
          }}
        >
          {/* Task results */}
          {results?.tasks && results.tasks.length > 0 && (
            <div>
              <div
                style={{
                  padding: "8px 12px 4px",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Tasks
              </div>
              {results.tasks.map((task, i) => (
                <SearchResultItem
                  key={task.id}
                  icon={<FileText size={14} />}
                  title={task.title}
                  subtitle={task.status}
                  badge={task.priority}
                  badgeColor={priorityColors[task.priority] || "var(--text-tertiary)"}
                  isSelected={selectedIndex === i}
                  onClick={() => {
                    router.push(`/?task=${task.id}`);
                    setIsOpen(false);
                    setQuery("");
                  }}
                />
              ))}
            </div>
          )}

          {/* LIKE fallback results */}
          {results?.likeResults && results.likeResults.length > 0 && (
            <div>
              <div
                style={{
                  padding: "8px 12px 4px",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                More results
              </div>
              {results.likeResults.map((task, i) => {
                const idx = (results?.tasks?.length || 0) + i;
                return (
                  <SearchResultItem
                    key={`like-${task.id}`}
                    icon={<FileText size={14} />}
                    title={task.title}
                    subtitle={task.status}
                    badge={task.priority}
                    badgeColor={priorityColors[task.priority] || "var(--text-tertiary)"}
                    isSelected={selectedIndex === idx}
                    onClick={() => {
                      router.push(`/?task=${task.id}`);
                      setIsOpen(false);
                      setQuery("");
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Comment results */}
          {results?.comments && results.comments.length > 0 && (
            <div>
              <div
                style={{
                  padding: "8px 12px 4px",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Comments
              </div>
              {results.comments.map((comment, i) => {
                const offset = (results?.tasks?.length || 0) + (results?.likeResults?.length || 0);
                const idx = offset + i;
                return (
                  <SearchResultItem
                    key={`cmt-${comment.taskId}-${i}`}
                    icon={<MessageSquare size={14} />}
                    title={comment.taskTitle}
                    subtitle={comment.snippet}
                    isSelected={selectedIndex === idx}
                    onClick={() => {
                      router.push(`/?task=${comment.taskId}`);
                      setIsOpen(false);
                      setQuery("");
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Keyboard hint */}
          <div
            style={{
              padding: "6px 12px",
              fontSize: 10,
              color: "var(--text-tertiary)",
              borderTop: "1px solid var(--border-color-tertiary)",
              display: "flex",
              gap: 12,
            }}
          >
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>Esc Close</span>
          </div>
        </div>
      )}

      {isOpen && query.length >= 2 && allResults.length === 0 && !isLoading && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            zIndex: 100,
            padding: "16px 12px",
            textAlign: "center",
            fontSize: 12,
            color: "var(--text-tertiary)",
          }}
        >
          No results
        </div>
      )}
    </div>
  );
}

function SearchResultItem({
  icon,
  title,
  subtitle,
  badge,
  badgeColor,
  isSelected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "7px 12px",
        border: "none",
        background: isSelected ? "var(--bg-hover)" : "transparent",
        color: "var(--text-primary)",
        fontSize: 13,
        fontFamily: "var(--font-inter), Inter, sans-serif",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 80ms ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? "var(--bg-hover)" : "transparent"; }}
    >
      <span style={{ color: "var(--text-tertiary)", flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 11,
              color: "var(--text-tertiary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginTop: 1,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {badge && badge !== "none" && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: badgeColor || "var(--text-tertiary)",
            padding: "1px 6px",
            borderRadius: 4,
            backgroundColor: `${badgeColor || "var(--text-tertiary)"}18`,
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
      )}
      <ArrowRight size={12} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
    </button>
  );
}
