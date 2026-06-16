"use client";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { useParams } from "next/navigation";

export default function AgentChatPage() {
  const params = useParams();
  const agentId = params.id as string;

  // In a real app, you'd get the user email from auth/session
  // For now, we'll use a placeholder
  const userEmail = "user@example.com";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-primary)",
        fontFamily: "var(--font-inter), Inter, sans-serif",
      }}
    >
      <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "32px 16px" }}>
        <div style={{ marginBottom: 24 }}>
          <a
            href="/agents"
            style={{
              color: "var(--accent-color)",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              transition: "opacity 150ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.75"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            ← Back to Agents
          </a>
          <h1
            style={{
              marginTop: 8,
              fontSize: 24,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "var(--font-epilogue), Epilogue, sans-serif",
            }}
          >
            Chat with Agent
          </h1>
        </div>

        <ChatWindow
          agentId={agentId}
          userEmail={userEmail}
        />
      </div>
    </div>
  );
}