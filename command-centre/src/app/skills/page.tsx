"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SkillsFileTree } from "@/components/skills/skills-file-tree";
import { SkillsSummary } from "@/components/skills/skills-summary";
import { SkillUploadModal } from "@/components/skills/skill-upload-modal";
import { ContentViewer } from "@/components/context/content-viewer";

export default function SkillsPage() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showUpload, setShowUpload] = useState(false);

  const handleFileDeleted = useCallback(() => {
    setSelectedPath(null);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleAddSkill = useCallback(() => {
    setShowUpload(true);
  }, []);

  const handleUploadComplete = useCallback(() => {
    setShowUpload(false);
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <AppShell title="Skills">
      <div
        style={{
          display: "flex",
          minHeight: "calc(100vh - 200px)",
          borderRadius: "0.5rem",
          overflow: "hidden",
        }}
      >
        {/* File tree sidebar */}
        <div
          style={{
            width: 280,
            flexShrink: 0,
            backgroundColor: "var(--bg-secondary)",
            overflowY: "auto",
            borderRight: "1px solid rgba(218, 193, 185, 0.2)",
          }}
        >
          <SkillsFileTree
            key={refreshKey}
            onSelectFile={setSelectedPath}
            selectedPath={selectedPath}
          />
        </div>

        {/* Content area: summary when nothing selected, viewer when a file is picked */}
        <div style={{ flex: 1, backgroundColor: "var(--bg-tertiary)", minHeight: 400 }}>
          {selectedPath ? (
            <div>
              <button
                onClick={() => setSelectedPath(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 16px",
                  border: "none",
                  borderBottom: "1px solid rgba(218, 193, 185, 0.2)",
                  background: "transparent",
                  color: "var(--accent-color)",
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  width: "100%",
                  transition: "background 150ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(147, 69, 42, 0.04)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                ← All Skills
              </button>
              <ContentViewer selectedPath={selectedPath} onFileDeleted={handleFileDeleted} />
            </div>
          ) : (
            <SkillsSummary onSelectSkill={setSelectedPath} onAddSkill={handleAddSkill} />
          )}
        </div>
      </div>

      {showUpload && (
        <SkillUploadModal
          onClose={() => setShowUpload(false)}
          onComplete={handleUploadComplete}
        />
      )}
    </AppShell>
  );
}
