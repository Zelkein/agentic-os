import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { callLLMWithHistory, ChatMessage } from "@/lib/llm-router";

export interface ExecuteAgentRequest {
  message: string;
  sessionId: string;
  attachedFiles?: Array<{
    id: string;
    filename: string;
    type: string;
    url?: string;
  }>;
}

export interface ExecuteAgentResponse {
  response: string;
  modelUsed: string;
  costUsd: number;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
}

/**
 * Execute an agent with a user message
 * Fetches agent config, builds context from chat history + files, calls LLM
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const body: ExecuteAgentRequest = await req.json();
    const { message, sessionId, attachedFiles } = body;

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: "message and sessionId are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // 1. Fetch agent configuration
    const agent = db
      .prepare("SELECT * FROM agents WHERE id = ?")
      .get(agentId) as any;

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // 2. Fetch chat history for context (last 10 messages)
    const chatHistory = db
      .prepare(
        `SELECT role, content FROM chat_messages
         WHERE session_id = ?
         ORDER BY created_at DESC
         LIMIT 10`
      )
      .all(sessionId) as Array<{ role: string; content: string }>;

    // Reverse to chronological order
    chatHistory.reverse();

    // 3. Build messages array for LLM
    const messages: ChatMessage[] = [];

    // Add chat history (excluding system messages)
    for (const msg of chatHistory) {
      if (msg.role !== "system") {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    // 4. Add file context if files are attached
    let userMessageWithContext = message;
    if (attachedFiles && attachedFiles.length > 0) {
      const fileContext = attachedFiles
        .map((f) => `- ${f.filename} (${f.type})`)
        .join("\n");
      userMessageWithContext = `${message}\n\nAttached files:\n${fileContext}`;
    }

    // Add current user message
    messages.push({
      role: "user",
      content: userMessageWithContext,
    });

    // 5. Call LLM with agent's system prompt
    const llmResponse = await callLLMWithHistory(
      agent.llm_provider,
      agent.llm_model,
      messages,
      agent.system_prompt
    );

    // 6. Store agent response in chat_messages table
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO chat_messages
       (id, session_id, role, content, model_used, cost_usd, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      messageId,
      sessionId,
      "agent",
      llmResponse.content,
      llmResponse.modelUsed,
      llmResponse.costUsd || 0,
      now
    );

    return NextResponse.json({
      response: llmResponse.content,
      modelUsed: llmResponse.modelUsed,
      costUsd: llmResponse.costUsd || 0,
      tokens: llmResponse.tokens || {
        prompt: 0,
        completion: 0,
        total: 0,
      },
    });
  } catch (error) {
    console.error("Agent execution error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to execute agent",
      },
      { status: 500 }
    );
  }
}
