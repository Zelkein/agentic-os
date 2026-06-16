"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Folder, FolderOpen, Cpu } from "lucide-react";
import type { FileNode } from "@/types/file";
import { useClientId, appendClientId } from "@/hooks/use-client-id";
import { asFileNodes, fetchFileNodes } from "@/lib/file-node-response";

interface SkillsFileTreeProps {
  onSelectFile: (path: string) => void;
  selectedPath: string | null;
}

export function SkillsFileTree({ onSelectFile, selectedPath }: SkillsFileTreeProps) {
  const clientId = useClientId();
  const [skillFolders, setSkillFolders] = useState<FileNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [childrenMap, setChildrenMap] = useState<Record<string, FileNode[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const nodes = await fetchFileNodes(
          appendClientId(`/api/files?dir=${encodeURIComponent(".claude/skills")}`, clientId)
        );
        if (mounted) {
          // Filter out _catalog and non-directories, sort alphabetically
          const folders = nodes
            .filter((n) => n.type === "directory" && n.name !== "_catalog")
            .sort((a, b) => a.name.localeCompare(b.name));
          setSkillFolders(folders);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [clientId]);

  const toggleDir = useCallback(
    (dirPath: string) => {
      setExpandedDirs((prev) => {
        const next = new Set(prev);
        if (next.has(dirPath)) {
          next.delete(dirPath);
        } else {
          next.add(dirPath);
          if (!childrenMap[dirPath]) {
            fetch(appendClientId(`/api/files?dir=${encodeURIComponent(dirPath)}`, clientId))
              .then(async (r) => {
                if (!r.ok) return [];
                const payload: unknown = await r.json();
                return asFileNodes(payload);
              })
              .then((children) => {
                setChildrenMap((prev) => ({ ...prev, [dirPath]: children }));
              })
              .catch(() => {
                setChildrenMap((prev) => ({ ...prev, [dirPath]: [] }));
              });
          }
        }
        return next;
      });
    },
    [childrenMap, clientId]
  );

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isDir = node.type === "directory";
    const isExpanded = expandedDirs.has(node.path);
    const isSelected = node.path === selectedPath;
    const children = childrenMap[node.path] || node.children || [];

    return (
      <div key={node.path}>
        <button
          onClick={() => (isDir ? toggleDir(node.path) : onSelectFile(node.path))}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "8px 12px",
            paddingLeft: 12 + depth * 16,
            border: "none",
            background: isSelected ? "var(--accent-terracotta-light-bg)" : "transparent",
            color: isSelected ? "var(--accent-terracotta-text)" : "var(--text-primary)",
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 13,
            cursor: "pointer",
            borderRadius: "0.25rem",
            textAlign: "left",
            transition: "background 150ms ease",
          }}
          onMouseEnter={(e) => {
            if (!isSelected) e.currentTarget.style.background = "var(--bg-secondary)";
          }}
          onMouseLeave={(e) => {
            if (!isSelected) e.currentTarget.style.background = "transparent";
          }}
        >
          {isDir ? (
            isExpanded ? (
              <FolderOpen size={16} style={{ color: "var(--accent-color)", flexShrink: 0 }} />
            ) : (
              <Folder size={16} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
            )
          ) : (
            <FileText size={16} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
          )}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {node.name}
          </span>
        </button>

        {isDir && isExpanded && (
          <div>
            {children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 16,
              width: `${60 + Math.random() * 40}%`,
              backgroundColor: "var(--skeleton-bg)",
              borderRadius: 4,
              animation: "pulse-dot 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }

  if (skillFolders.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Cpu size={32} style={{ color: "var(--text-secondary)", margin: "0 auto 8px" }} />
        <p style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontSize: 13, color: "var(--text-secondary)" }}>
          No skills installed
        </p>
      </div>
    );
  }

  // Group folders by category prefix
  const grouped: Record<string, FileNode[]> = {};
  for (const folder of skillFolders) {
    const category = folder.name.split("-")[0];
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(folder);
  }
  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div style={{ padding: "8px 0" }}>
      <div
        style={{
          padding: "6px 12px 10px",
          fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
          fontSize: 10,
          color: "var(--text-tertiary)",
        }}
      >
        {skillFolders.length} skills
      </div>
      {sortedGroups.map(([category, folders]) => (
        <div key={category} style={{ marginBottom: 4 }}>
          <div
            style={{
              padding: "6px 12px",
              fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-tertiary)",
            }}
          >
            {category}
          </div>
          {folders.map((folder) => {
            const isExpanded = expandedDirs.has(folder.path);
            const children = childrenMap[folder.path] || [];
            // Check if any child file is selected
            const hasSelectedChild = selectedPath?.startsWith(folder.path + "/") || false;

            return (
              <div key={folder.path}>
                <button
                  onClick={() => toggleDir(folder.path)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "8px 12px",
                    border: "none",
                    background: hasSelectedChild && !isExpanded ? "rgba(255, 219, 207, 0.3)" : "transparent",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                    fontSize: 13,
                    cursor: "pointer",
                    borderRadius: "0.25rem",
                    textAlign: "left",
                    transition: "background 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      hasSelectedChild && !isExpanded ? "rgba(255, 219, 207, 0.3)" : "transparent";
                  }}
                >
                  {isExpanded ? (
                    <FolderOpen size={16} style={{ color: "var(--accent-color)", flexShrink: 0 }} />
                  ) : (
                    <Folder size={16} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
                  )}
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                      fontWeight: 500,
                    }}
                  >
                    {folder.name}
                  </span>
                </button>

                {isExpanded && (
                  <div>
                    {children.map((child) => renderNode(child, 1))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
