"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 6,
        border: "none",
        backgroundColor: theme === "light" ? "rgba(147, 69, 42, 0.08)" : "rgba(147, 69, 42, 0.2)",
        color: theme === "light" ? "var(--accent-color)" : "var(--accent-terracotta-dark)",
        cursor: "pointer",
        transition: "all 120ms ease",
        padding: 0,
      }}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      aria-label={`Toggle ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Moon size={16} />
      ) : (
        <Sun size={16} />
      )}
    </button>
  );
}
