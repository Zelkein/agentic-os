"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Cpu } from "lucide-react";
import { SkillCard } from "@/components/skills/skill-card";
import type { InstalledSkill } from "@/types/file";

export function SkillsGrid() {
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
      <div>
        {/* Search skeleton */}
        <div style={{ height: 40, backgroundColor: "var(--skeleton-bg)", borderRadius: 8, marginBottom: 24, animation: "pulse-dot 1.5s ease-in-out infinite" }} />
        {/* Card skeletons */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "var(--card-bg)",
                borderRadius: "0.5rem",
                padding: 16,
                minHeight: 100,
              }}
            >
              <div style={{ height: 16, width: "50%", backgroundColor: "var(--skeleton-bg)", borderRadius: 4, marginBottom: 8, animation: "pulse-dot 1.5s ease-in-out infinite" }} />
              <div style={{ height: 32, width: "100%", backgroundColor: "var(--skeleton-bg)", borderRadius: 4, marginBottom: 8, animation: "pulse-dot 1.5s ease-in-out infinite" }} />
              <div style={{ height: 12, width: "40%", backgroundColor: "var(--skeleton-bg)", borderRadius: 4, animation: "pulse-dot 1.5s ease-in-out infinite" }} />
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
            margin: "0 auto",
          }}
        >
          No skills installed. Add skills with <code style={{ fontFamily: "var(--font-space-grotesk), Space Grotesk, monospace", fontSize: 13, backgroundColor: "var(--bg-secondary)", padding: "2px 6px", borderRadius: 4 }}>bash scripts/add-skill.sh</code>
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Count + search */}
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
            fontSize: 13,
            color: "var(--text-secondary)",
            margin: "0 0 12px 0",
          }}
        >
          {skills.length} skills installed
        </p>

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
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent-color)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(218, 193, 185, 0.2)";
            }}
          />
        </div>
      </div>

      {/* Grouped skills */}
      {grouped.map(([category, categorySkills]) => (
        <div key={category} style={{ marginBottom: 24 }}>
          <h4
            style={{
              fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--text-secondary)",
              margin: "0 0 10px 0",
            }}
          >
            {category}
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "1rem",
            }}
          >
            {categorySkills.map((skill) => (
              <SkillCard key={skill.folderName} skill={skill} />
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
