import type { ChatAttachment } from "@/types/chat-composer";

export type AgentChatMessageRole = "user" | "agent" | "system";

export interface AgentChatSession {
  id: string;
  agent_id: string;
  user_email: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentChatMessage {
  id: string;
  session_id: string;
  role: AgentChatMessageRole;
  content: string;
  files_json: string; // JSON string of ChatAttachment[]
  model_used: string | null;
  cost_usd: number | null;
  created_at: string;
}