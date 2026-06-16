"use client";

import { Terminal, KeyRound, Plug, FileCode, Cpu, Palette } from "lucide-react";
import type { ComponentType } from "react";

interface Tab {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
}

const tabs: Tab[] = [
  { id: "scripts", label: "Scripts", icon: Terminal },
  { id: "env", label: "Environment", icon: KeyRound },
  { id: "mcp", label: "MCP", icon: Plug },
  { id: "colors", label: "Colors", icon: Palette },
  { id: "kilo", label: "Kilo Config", icon: Cpu },
  { id: "claude", label: "Claude (legacy)", icon: FileCode },
];

interface SettingsTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        borderBottom: "1px solid var(--border-color-secondary)",
        padding: "0 24px",
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 20px",
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontSize: 14,
              fontWeight: 500,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: isActive ? "var(--accent-color)" : "var(--text-secondary)",
              borderBottom: isActive
                ? "2px solid var(--accent-color)"
                : "2px solid transparent",
              transition: "color 150ms ease, border-color 150ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = "var(--text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = "var(--text-secondary)";
              }
            }}
          >
            <Icon size={16} />
            <span style={{ marginLeft: 8 }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
