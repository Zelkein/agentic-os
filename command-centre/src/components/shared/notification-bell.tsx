"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotificationStore, type AppNotification } from "@/store/notification-store";

const typeIcons: Record<string, string> = {
  task_completed: "✅",
  task_failed: "❌",
  task_assigned: "📋",
  task_comment: "💬",
  task_status_change: "🔄",
  system: "⚙️",
};

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markRead,
    markAllRead,
  } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications(true);
    // Poll for new notifications every 30s
    const interval = setInterval(() => fetchNotifications(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleClick = useCallback(
    (n: AppNotification) => {
      if (!n.read) markRead(n.id);
      if (n.taskId) {
        router.push(`/?task=${n.taskId}`);
        setIsOpen(false);
      }
    },
    [markRead, router]
  );

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications(false);
        }}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 8,
          border: "1px solid var(--border-color-tertiary)",
          background: "var(--bg-secondary)",
          color: "var(--text-secondary)",
          cursor: "pointer",
          transition: "all 120ms ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-secondary)"; }}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: "var(--error)",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
              lineHeight: 1,
              boxShadow: "0 0 0 2px var(--bg-primary)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            width: 340,
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            zIndex: 100,
            maxHeight: 420,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px 8px",
              borderBottom: "1px solid var(--border-color-tertiary)",
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "var(--font-inter), Inter, sans-serif",
                color: "var(--text-primary)",
              }}
            >
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  border: "none",
                  background: "transparent",
                  color: "var(--accent-color)",
                  fontSize: 11,
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  cursor: "pointer",
                  padding: "2px 4px",
                  borderRadius: 4,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "24px 12px",
                  textAlign: "center",
                  fontSize: 12,
                  color: "var(--text-tertiary)",
                }}
              >
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 50).map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  style={{
                    display: "flex",
                    gap: 8,
                    width: "100%",
                    padding: "8px 12px",
                    border: "none",
                    borderBottom: "1px solid var(--border-color-tertiary)",
                    background: n.read ? "transparent" : "var(--accent-color)08",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                    transition: "background 80ms ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = n.read
                      ? "transparent"
                      : "var(--accent-color)08";
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>
                    {typeIcons[n.type] || "📌"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-primary)",
                        fontWeight: n.read ? 400 : 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {n.title}
                    </div>
                    {n.message && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-tertiary)",
                          marginTop: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {n.message}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-tertiary)",
                        marginTop: 2,
                        opacity: 0.7,
                      }}
                    >
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>
                  {!n.read && (
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        backgroundColor: "var(--accent-color)",
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    />
                  )}
                  {n.taskId && (
                    <ExternalLink
                      size={11}
                      style={{
                        color: "var(--text-tertiary)",
                        flexShrink: 0,
                        marginTop: 3,
                      }}
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
