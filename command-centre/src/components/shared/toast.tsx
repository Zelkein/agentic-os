"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Check, X, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

const ICONS: Record<ToastType, typeof Check> = {
  success: Check, error: X, warning: AlertTriangle, info: Info,
};
const COLORS: Record<ToastType, string> = {
  success: "var(--success-color)", error: "var(--error-color)",
  warning: "var(--warning-color)", info: "var(--info-color)",
};
const BG_COLORS: Record<ToastType, string> = {
  success: "rgba(45,212,191,0.12)", error: "rgba(248,113,113,0.12)",
  warning: "rgba(251,191,36,0.12)", info: "rgba(96,165,250,0.12)",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
        );
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 250);
      }, 3500);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          display: "flex", flexDirection: "column", gap: 8, maxWidth: 380,
        }}
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "12px 16px", borderRadius: 10,
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-color-secondary)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                opacity: t.exiting ? 0 : 1,
                transform: t.exiting ? "translateX(40px)" : "translateX(0)",
                transition: "all 200ms ease",
                fontFamily: "var(--font-inter), Inter, sans-serif",
                fontSize: 13,
                color: "var(--text-primary)",
              }}
            >
              <div
                style={{
                  width: 28, height: 28, borderRadius: 7,
                  backgroundColor: BG_COLORS[t.type],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={14} color={COLORS[t.type]} />
              </div>
              <p style={{ margin: 0, lineHeight: 1.5, flex: 1 }}>{t.message}</p>
              <button
                onClick={() => {
                  setToasts((prev) =>
                    prev.map((x) => (x.id === t.id ? { ...x, exiting: true } : x))
                  );
                  setTimeout(() => {
                    setToasts((prev) => prev.filter((x) => x.id !== t.id));
                  }, 250);
                }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-tertiary)", padding: 2, flexShrink: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}