"use client";

import { usePathname } from "next/navigation";
import {
  Brain,
  LayoutDashboard,
  MessageSquare,
  Bot,
  Calendar,
  FileText,
  FolderOpen,
  Settings,
  Kanban,
  Clock,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: Brain },
  { href: "/board", label: "Board", icon: Kanban },
  { href: "/skills", label: "Skills", icon: Bot },
  { href: "/tasks", label: "Tasks", icon: Clock },
  { href: "/autonomous", label: "Chat", icon: MessageSquare },
  { href: "/context", label: "Context", icon: FolderOpen },
  { href: "/docs", label: "Docs", icon: FileText },
  { href: "/cron", label: "Cron", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Settings },
];

const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-inter), Inter, sans-serif", ...s,
});
const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif", ...s,
});

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <div
      style={{
        width: 240,
        minHeight: "100vh",
        backgroundColor: "var(--bg-secondary)",
        borderRight: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 12px",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 40,
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 8px 24px",
          borderBottom: "1px solid var(--border-color)",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, var(--accent-color) 0%, #E88B5F 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Brain size={18} color="#FFF" />
        </div>
        <span
          style={sg({
            fontSize: 16,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
          })}
        >
          Command Centre
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              style={{
                ...sp({ fontSize: 13, fontWeight: 500, textDecoration: "none" }),
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 8,
                color: isActive ? "var(--accent-color)" : "var(--text-secondary)",
                backgroundColor: isActive ? "var(--accent-light)" : "transparent",
                transition: "all 120ms ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <Icon size={16} />
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid var(--border-color)",
          paddingTop: 16,
        }}
      >
        <p
          style={sp({
            fontSize: 11,
            color: "var(--text-tertiary)",
            margin: 0,
            paddingLeft: 8,
          })}
        >
          Agentic OS v1.0
        </p>
      </div>
    </div>
  );
}