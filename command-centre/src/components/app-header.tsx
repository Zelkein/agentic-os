"use client";

import { useRouter, usePathname } from "next/navigation";
import { Bot, Radio, Layers } from "lucide-react";
import { SearchBar } from "@/components/shared/search-bar";
import { NotificationBell } from "@/components/shared/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  ...s,
});

/**
 * Shared nav button style — used both for routes and later for dashboard tabs.
 * Built as a function so callers can pass overrides.
 */
function navBtnStyle(isActive: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: isActive ? 600 : 500,
    fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
    border: "none",
    borderRadius: 6,
    backgroundColor: isActive ? "var(--bg-hover)" : "transparent",
    color: isActive ? "var(--accent-color)" : "var(--text-secondary)",
    cursor: "pointer",
    transition: "all 120ms ease",
    whiteSpace: "nowrap",
  };
}

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const routeButtons = [
    { key: "/agents", label: "Agents", icon: Bot },
    { key: "/mission-control", label: "Mission Ctl", icon: Radio },
    { key: "/swarms", label: "Swarms", icon: Layers },
  ];

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: 52,
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "var(--bg-primary)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      {/* Left: branding + nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <a
          href="https://skool.com/scrapes"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}
        >
          <img src="/logo.png" alt="" style={{ width: 26, height: 26, display: "block" }} />
          <h1
            style={{
              fontFamily: "var(--font-epilogue), Epilogue, sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              margin: 0,
              marginTop: 4,
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}
          >
            Agentic OS
          </h1>
        </a>

        <div
          style={{
            width: 1,
            height: 20,
            backgroundColor: "var(--border-color-tertiary)",
          }}
        />

        <nav style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {routeButtons.map((btn) => {
            const Icon = btn.icon;
            const isActive = pathname === btn.key;
            return (
              <button
                key={btn.key}
                onClick={() => router.push(btn.key)}
                style={navBtnStyle(isActive)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--accent-color)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
              >
                <Icon size={13} />
                {btn.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: search, notifications, theme */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <SearchBar />
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}
