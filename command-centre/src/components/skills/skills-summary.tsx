"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Cpu, ChevronDown, ChevronUp, Plus } from "lucide-react";
import type { InstalledSkill } from "@/types/file";

interface SkillsSummaryProps {
  onSelectSkill: (folderPath: string) => void;
  onAddSkill: () => void;
}

function SkillSummaryCard({
  skill,
  onSelect,
}: {
  skill: InstalledSkill;
  onSelect: () => void;
}) {
  const [depsExpanded, setDepsExpanded] = useState(false);
  const hasDeps = skill.dependencies.length > 0;

  return (
    <div
      onClick={onSelect}
      style={{
        backgroundColor: "var(--card-bg)",
        borderRadius: "0.5rem",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        cursor: "pointer",
        transition: "box-shadow 200ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0px 12px 32px rgba(147, 69, 42, 0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            backgroundColor: "var(--accent-terracotta-light-bg)",
            color: "var(--accent-terracotta-text)",
            padding: "2px 8px",
            borderRadius: 4,
            fontWeight: 500,
          }}
        >
          {skill.category}
        </span>
        <span
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {skill.name}
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: "var(--font-inter), Inter, sans-serif",
          fontSize: 13,
          color: "var(--text-secondary)",
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {skill.description.length > 100
          ? skill.description.slice(0, 100).trimEnd() + "…"
          : skill.description}
      </p>

      {/* Triggers */}
      {skill.triggers.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
          {skill.triggers.map((trigger) => (
            <span
              key={trigger}
              style={{
                fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                fontSize: 10,
                backgroundColor: "var(--skeleton-bg)",
                color: "var(--text-secondary)",
                padding: "2px 8px",
                borderRadius: 4,
              }}
            >
              {trigger}
            </span>
          ))}
        </div>
      )}

      {/* Dependencies */}
      {hasDeps && (
        <div style={{ marginTop: 4 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDepsExpanded(!depsExpanded);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
              fontSize: 11,
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            {depsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Dependencies ({skill.dependencies.length})
          </button>

          {depsExpanded && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {skill.dependencies.map((dep) => (
                <div key={dep.skill} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                        fontSize: 11,
                        backgroundColor: dep.required ? "var(--accent-terracotta-light-bg)" : "var(--skeleton-bg)",
                        color: dep.required ? "var(--accent-terracotta-text)" : "var(--text-secondary)",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontWeight: 500,
                      }}
                    >
                      {dep.skill}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                        fontSize: 10,
                        color: dep.required ? "var(--accent-color)" : "var(--text-secondary)",
                      }}
                    >
                      {dep.required ? "Required" : "Optional"}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-inter), Inter, sans-serif",
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      margin: 0,
                      paddingLeft: 4,
                    }}
                  >
                    {dep.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SkillsSummary({ onSelectSkill, onAddSkill }: SkillsSummaryProps) {
  const [skills, setSkills] = useState<InstalledSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((data: InstalledSkill[]) => {
        setSkills(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return skills;
    const q = searchQuery.toLowerCase();
    return skills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.triggers.some((t) => t.toLowerCase().includes(q))
    );
  }, [skills, searchQuery]);

  const grouped = useMemo(() => {
    const map: Record<string, InstalledSkill[]> = {};
    for (const skill of filtered) {
      if (!map[skill.category]) map[skill.category] = [];
      map[skill.category].push(skill);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ height: 40, backgroundColor: "var(--skeleton-bg)", borderRadius: 8, marginBottom: 24, animation: "pulse-dot 1.5s ease-in-out infinite" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ backgroundColor: "var(--card-bg)", borderRadius: "0.5rem", padding: 16, minHeight: 100 }}>
              <div style={{ height: 16, width: "50%", backgroundColor: "var(--skeleton-bg)", borderRadius: 4, marginBottom: 8, animation: "pulse-dot 1.5s ease-in-out infinite" }} />
              <div style={{ height: 32, width: "100%", backgroundColor: "var(--skeleton-bg)", borderRadius: 4, animation: "pulse-dot 1.5s ease-in-out infinite" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <Cpu size={48} style={{ color: "var(--text-secondary)", margin: "0 auto 16px", display: "block" }} />
        <h4
          style={{
            fontFamily: "var(--font-epilogue), Epilogue, sans-serif",
            fontWeight: 600,
            fontSize: 16,
            color: "var(--text-primary)",
            margin: "0 0 8px 0",
          }}
        >
          No skills installed
        </h4>
        <p
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 14,
            color: "var(--text-secondary)",
            maxWidth: 360,
            margin: "0 auto 16px",
          }}
        >
          Add skills to extend your assistant&apos;s capabilities.
        </p>
        <button
          onClick={onAddSkill}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            backgroundColor: "var(--accent-color)",
            color: "var(--card-bg)",
            border: "none",
            borderRadius: "0.375rem",
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Plus size={14} /> Add Skill
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header with count, search, and add button */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
              fontSize: 13,
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            {skills.length} skills installed
          </p>
          <button
            onClick={onAddSkill}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              backgroundColor: "var(--accent-color)",
              color: "var(--card-bg)",
              border: "none",
              borderRadius: "0.375rem",
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 150ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            <Plus size={14} /> Add Skill
          </button>
        </div>

        <div style={{ position: "relative" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-secondary)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 36px",
              backgroundColor: "var(--card-bg)",
              border: "1px solid rgba(218, 193, 185, 0.2)",
              borderRadius: 8,
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontSize: 14,
              color: "var(--text-primary)",
              outline: "none",
              transition: "border-color 200ms ease",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-color)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(218, 193, 185, 0.2)"; }}
          />
        </div>
      </div>

      {/* Grouped skills */}
      {grouped.map(([category, categorySkills], idx) => (
        <div key={category} style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
              paddingBottom: 10,
              borderBottom: "1px solid rgba(218, 193, 185, 0.25)",
            }}
          >
            <h4
              style={{
                fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--text-primary)",
                margin: 0,
                fontWeight: 600,
              }}
            >
              {category}
            </h4>
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                fontSize: 10,
                color: "var(--text-tertiary)",
                fontWeight: 500,
              }}
            >
              ({categorySkills.length})
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
            {categorySkills.map((skill) => (
              <SkillSummaryCard
                key={skill.folderName}
                skill={skill}
                onSelect={() => onSelectSkill(`.claude/skills/${skill.folderName}/SKILL.md`)}
              />
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && searchQuery && (
        <p
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: 14,
            color: "var(--text-secondary)",
            textAlign: "center",
            padding: 40,
          }}
        >
          No skills match &quot;{searchQuery}&quot;
        </p>
      )}
    </div>
  );
}
