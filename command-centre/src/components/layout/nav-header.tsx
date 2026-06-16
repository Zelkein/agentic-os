"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Activity, Clock, Bot, Cpu, FileText, Settings, Home, BarChart3, Layers, Radio,
} from "lucide-react";
import { SearchBar } from "@/components/shared/search-bar";
import { NotificationBell } from "@/components/shared/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  ...s,
});

const NAV_ITEMS: { key: string; label: string; icon: typeof Activity; href: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: Activity, href: "/" },
  { key: "agents", label: "Agents", icon: Bot, href: "/agents" },
  { key: "mission-control", label: "Mission Ctl", icon: Radio, href: "/mission-control" },
  { key: "swarms", label: "Swarms", icon: Layers, href: "/swarms" },
];

export default function NavHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

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
      {/* Left: branding + tabs */}
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
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.key}
                onClick={() => router.push(item.href)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                  border: "none",
                  borderRadius: 6,
                  backgroundColor: active ? "var(--bg-hover)" : "transparent",
                  color: active ? "var(--accent-color)" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 120ms ease",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={13} />
                {item.label}
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
