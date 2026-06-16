"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function DarkModeStyles() {
  return (
    <style
      id="dark-mode-overrides"
      dangerouslySetInnerHTML={{
        __html: `
          html.dark [style*="background-color:#FFFFFF"],
          html.dark [style*="background-color: #FFFFFF"],
          html.dark [style*="background-color:#FAFAF9"],
          html.dark [style*="background-color: #FAFAF9"],
          html.dark [style*="backgroundColor:#FFFFFF"],
          html.dark [style*="backgroundColor: #FFFFFF"],
          html.dark [style*="backgroundColor:#FAFAF9"],
          html.dark [style*="backgroundColor: #FAFAF9"],
          html.dark [style*="background:#FFFFFF"],
          html.dark [style*="background: #FFFFFF"] {
            background-color: var(--card-bg) !important;
          }
          html.dark [style*="background-color:#F6F3F1"],
          html.dark [style*="background-color: #F6F3F1"],
          html.dark [style*="backgroundColor:#F6F3F1"],
          html.dark [style*="backgroundColor: #F6F3F1"] {
            background-color: var(--bg-secondary) !important;
          }
          html.dark [style*="background-color:#FCF9F7"],
          html.dark [style*="background-color: #FCF9F7"],
          html.dark [style*="backgroundColor:#FCF9F7"],
          html.dark [style*="backgroundColor: #FCF9F7"] {
            background-color: var(--bg-primary) !important;
          }
          html.dark [style*="background-color:#FFFAF8"],
          html.dark [style*="background-color: #FFFAF8"],
          html.dark [style*="backgroundColor:#FFFAF8"],
          html.dark [style*="backgroundColor: #FFFAF8"] {
            background-color: var(--card-bg-tertiary) !important;
          }
          html.dark [style*="background-color:#FFF5F3"],
          html.dark [style*="background-color: #FFF5F3"],
          html.dark [style*="backgroundColor:#FFF5F3"],
          html.dark [style*="backgroundColor: #FFF5F3"] {
            background-color: var(--error-bg) !important;
          }
          html.dark [style*="background-color:#FFF5F0"],
          html.dark [style*="background-color: #FFF5F0"],
          html.dark [style*="backgroundColor:#FFF5F0"],
          html.dark [style*="backgroundColor: #FFF5F0"] {
            background-color: var(--accent-light) !important;
          }
          html.dark [style*="background-color:#EAE8E6"],
          html.dark [style*="background-color: #EAE8E6"],
          html.dark [style*="backgroundColor:#EAE8E6"],
          html.dark [style*="backgroundColor: #EAE8E6"] {
            background-color: var(--skeleton-bg) !important;
          }
          html.dark [style*="color:#1B1C1B"],
          html.dark [style*="color: #1B1C1B"] {
            color: var(--text-primary) !important;
          }
          html.dark [style*="color:#5E5E65"],
          html.dark [style*="color: #5E5E65"] {
            color: var(--text-secondary) !important;
          }
          html.dark [style*="color:#9C9CA0"],
          html.dark [style*="color: #9C9CA0"] {
            color: var(--text-tertiary) !important;
          }
          html.dark [style*="color:#93452A"],
          html.dark [style*="color: #93452A"] {
            color: var(--accent-color) !important;
          }
          html.dark [style*="color:#C04030"],
          html.dark [style*="color: #C04030"] {
            color: var(--error) !important;
          }
          html.dark [style*="color:#6B8E6B"],
          html.dark [style*="color: #6B8E6B"] {
            color: var(--success) !important;
          }
          html.dark [style*="color:#5B7FBF"],
          html.dark [style*="color: #5B7FBF"] {
            color: var(--info) !important;
          }
          html.dark [style*="color:#390C00"],
          html.dark [style*="color: #390C00"] {
            color: var(--accent-terracotta-text) !important;
          }
          html.dark [style*="color:#D4724A"],
          html.dark [style*="color: #D4724A"] {
            color: var(--accent-terracotta-dark) !important;
          }
          html.dark [style*="background-color:#FFDBCF"],
          html.dark [style*="background-color: #FFDBCF"],
          html.dark [style*="backgroundColor:#FFDBCF"],
          html.dark [style*="backgroundColor: #FFDBCF"] {
            background-color: var(--accent-terracotta-light-bg) !important;
          }
          html.dark [style*="background-color:#f3f0ee"],
          html.dark [style*="background-color: #f3f0ee"],
          html.dark [style*="backgroundColor:#f3f0ee"],
          html.dark [style*="backgroundColor: #f3f0ee"],
          html.dark [style*="background:#f3f0ee"],
          html.dark [style*="background: #f3f0ee"] {
            background-color: var(--dropdown-bg) !important;
          }
          html.dark [style*="border:1px solid #e5e1dc"],
          html.dark [style*="border: 1px solid #e5e1dc"] {
            border-color: var(--border-color-tertiary) !important;
          }
          html.dark [style*="border:1px solid rgba(218, 193, 185, 0.2)"],
          html.dark [style*="border: 1px solid rgba(218, 193, 185, 0.2)"] {
            border-color: var(--border-color-secondary) !important;
          }
          html.dark [style*="backgroundColor: rgba(252, 249, 247, 0.8)"],
          html.dark [style*="backgroundColor:rgba(252, 249, 247, 0.8)"],
          html.dark [style*="backgroundColor:rgba(252, 249, 247,0.8)"] {
            background-color: var(--header-bg) !important;
          }
          html.dark [style*="background-color:#EFF6FF"],
          html.dark [style*="background-color: #EFF6FF"],
          html.dark [style*="backgroundColor:#EFF6FF"],
          html.dark [style*="backgroundColor: #EFF6FF"] {
            background-color: var(--info-bg) !important;
          }
          html.dark [style*="background-color:#F5F3FF"],
          html.dark [style*="background-color: #F5F3FF"],
          html.dark [style*="backgroundColor:#F5F3FF"],
          html.dark [style*="backgroundColor: #F5F3FF"] {
            background-color: var(--purple-bg) !important;
          }
          html.dark [style*="background-color:#FEF2F2"],
          html.dark [style*="background-color: #FEF2F2"],
          html.dark [style*="backgroundColor:#FEF2F2"],
          html.dark [style*="backgroundColor: #FEF2F2"] {
            background-color: var(--error-bg) !important;
          }
          html.dark [style*="color:#EF4444"],
          html.dark [style*="color: #EF4444"] {
            color: var(--error) !important;
          }
          html.dark [style*="color:#3B82F6"],
          html.dark [style*="color: #3B82F6"] {
            color: var(--info) !important;
          }
          html.dark [style*="color:#6D28D9"],
          html.dark [style*="color: #6D28D9"] {
            color: var(--accent-purple) !important;
          }
          html.dark [style*="background-color:#EEE8E2"],
          html.dark [style*="background-color: #EEE8E2"],
          html.dark [style*="backgroundColor:#EEE8E2"],
          html.dark [style*="backgroundColor: #EEE8E2"],
          html.dark [style*="background-color:#F1ECE7"],
          html.dark [style*="background-color: #F1ECE7"],
          html.dark [style*="backgroundColor:#F1ECE7"],
          html.dark [style*="backgroundColor: #F1ECE7"] {
            background-color: var(--warm-gray-bg) !important;
          }
          html.dark [style*="color:#D97853"],
          html.dark [style*="color: #D97853"] {
            color: var(--accent-terracotta) !important;
          }
          /* -- Border/dividers (#EAE8E6 is the most common) -- */
          html.dark [style*="borderTop:\"1px solid #EAE8E6\""],
          html.dark [style*="borderTop: \"1px solid #EAE8E6\""],
          html.dark [style*="borderBottom:\"1px solid #EAE8E6\""],
          html.dark [style*="borderBottom: \"1px solid #EAE8E6\""],
          html.dark [style*="border:\"1px solid #EAE8E6\""],
          html.dark [style*="border: \"1px solid #EAE8E6\""],
          html.dark [style*="borderLeft:\"1px solid #EAE8E6\""],
          html.dark [style*="borderLeft: \"1px solid #EAE8E6\""],
          html.dark [style*="borderRight:\"1px solid #EAE8E6\""],
          html.dark [style*="borderRight: \"1px solid #EAE8E6\""],
          html.dark [style*="border:\"1px dashed #EAE8E6\""],
          html.dark [style*="border: \"1px dashed #EAE8E6\""],
          html.dark [style*="1px solid #EAE8E6"],
          html.dark [style*="1px dashed #EAE8E6"],
          html.dark [style*="border:1px solid #EAE8E6"],
          html.dark [style*="border: 1px solid #EAE8E6"] {
            --_dm-border: var(--border-color-secondary);
          }
          /* -- Height+background dividers -- */
          html.dark [style*="backgroundColor:\"#EAE8E6\""],
          html.dark [style*="backgroundColor: \"#EAE8E6\""] {
            background-color: var(--skeleton-bg) !important;
          }
          /* -- borderTopColor white in dark mode -- */
          html.dark [style*="borderTopColor:\"#FFFFFF\""],
          html.dark [style*="borderTopColor: \"#FFFFFF\""] {
            border-top-color: var(--card-bg) !important;
          }
          html.dark .custom-shadow {
            box-shadow: 0px 12px 32px rgba(232, 149, 109, 0.08) !important;
          }
          html.dark [style*="stroke:#EAE8E6"],
          html.dark [style*="stroke: #EAE8E6"] {
            stroke: var(--skeleton-bg) !important;
          }
          html.dark [style*="border-left:2px solid #93452A"],
          html.dark [style*="border-left: 2px solid #93452A"] {
            border-left-color: var(--accent-color) !important;
          }
          html.dark [style*="color:#CDCDCD"],
          html.dark [style*="color: #CDCDCD"] {
            color: var(--text-tertiary) !important;
          }
        `,
      }}
    />
  );
}

/**
 * Walk the DOM and patch any inline light-mode background colors
 * to dark equivalents. More reliable than CSS attribute selectors
 * because it works directly with the element's computed style.
 */
function patchDarkMode() {
  const lightBgSet = new Set([
    "#ffffff", "#FFFFFF", "#fff", "#FFF",
    "#fcf9f7", "#FCF9F7", "#f6f3f1", "#F6F3F1",
    "#fafaf9", "#FAFAF9", "#fffaf8", "#FFFAF8",
    "#fff5f3", "#FFF5F3", "#fff5f0", "#FFF5F0",
    "#eae8e6", "#EAE8E6", "#f3f0ee", "#F3F0EE",
    "#efedea", "#EFEDEA", "#eee8e2", "#EEE8E2",
    "#f1ece7", "#F1ECE7", "#eff6ff", "#EFF6FF",
    "#f5f3ff", "#F5F3FF", "#fef2f2", "#FEF2F2",
    "#ffdbcf", "#FFDBCF",
  ]);

  const lightBorderSet = new Set([
    "#eae8e6", "#EAE8E6", "#e5e1dc", "#E5E1DC",
  ]);

  document.querySelectorAll("[style]").forEach((el) => {
    const e = el as HTMLElement;
    const bg = (e.style.backgroundColor || "").replace(/\s/g, "");
    const border = (e.style.borderColor || "").replace(/\s/g, "");
    const borderTop = (e.style.borderTopColor || "").replace(/\s/g, "");
    const borderBottom = (e.style.borderBottomColor || "").replace(/\s/g, "");
    const borderFull = (e.style.border || "");

    if (bg && lightBgSet.has(bg)) {
      e.style.setProperty("background-color", "var(--card-bg)", "important");
    }
    if (border && lightBorderSet.has(border)) {
      e.style.setProperty("border-color", "var(--skeleton-bg)", "important");
    }
    if (borderTop && lightBorderSet.has(borderTop)) {
      e.style.setProperty("border-top-color", "var(--skeleton-bg)", "important");
    }
    if (borderBottom && lightBorderSet.has(borderBottom)) {
      e.style.setProperty("border-bottom-color", "var(--skeleton-bg)", "important");
    }
    for (const c of lightBorderSet) {
      if (borderFull.includes(c)) {
        e.style.setProperty("border-color", "var(--skeleton-bg)", "important");
        break;
      }
    }
  });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") as Theme | null;
    // Default to dark mode if never set
    const initial = saved || "dark";
    setTheme(initial);
    applyTheme(initial);

    // MutationObserver: patch light backgrounds in dark mode
    const observer = new MutationObserver(() => {
      if (document.documentElement.classList.contains("dark")) {
        patchDarkMode();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      applyTheme(newTheme);
      return newTheme;
    });
  };

  const applyTheme = (newTheme: Theme) => {
    const html = document.documentElement;
    if (newTheme === "dark") {
      html.classList.add("dark");
      setTimeout(() => patchDarkMode(), 100);
    } else {
      html.classList.remove("dark");
    }
  };

  if (!mounted) {
    // Always provide context so children don't throw during SSR,
    // but defer dark-mode class application until client mount.
    return (
      <ThemeContext.Provider value={{ theme: "light", toggleTheme: () => {} }}>
        <DarkModeStyles />
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <DarkModeStyles />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}