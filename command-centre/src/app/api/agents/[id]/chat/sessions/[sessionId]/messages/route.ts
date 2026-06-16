import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  callLLMWithHistory,
  streamLLMWithHistory,
  type ChatContentPart,
  type ChatMessage,
} from "@/lib/llm-router";
import {
  extractAttachments,
  buildAugmentedText,
  getVisionConfig,
} from "@/lib/attachment-content";
import type { AgentChatMessage } from "@/types/agent-chat";
import { createMemoryManager } from "@/lib/memory-provider";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id: agentId, sessionId } = await params;
    const db = getDb();

    // Verify agent exists
    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(agentId) as {
      id: string;
    } | undefined;
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Verify session exists and belongs to agent
    const session = db.prepare(
      "SELECT * FROM chat_sessions WHERE id = ? AND agent_id = ?"
    ).get(sessionId, agentId) as { id: string; agent_id: string } | undefined;
    if (!session) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }

    const messages = db
      .prepare(
        "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC"
      )
      .all(sessionId) as AgentChatMessage[];

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/agents/[id]/chat/sessions/[sessionId]/messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id: agentId, sessionId } = await params;
    const db = getDb();

    // Verify agent exists
    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(agentId) as {
      id: string; name: string; system_prompt: string; llm_model: string; llm_provider: string;
    } | undefined;
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Verify session exists and belongs to agent
    const session = db.prepare(
      "SELECT * FROM chat_sessions WHERE id = ? AND agent_id = ?"
    ).get(sessionId, agentId) as { id: string; agent_id: string } | undefined;
    if (!session) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content, files_json } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "content is required and must be a string" },
        { status: 400 }
      );
    }

    const finalFilesJson = typeof files_json === "string" ? files_json : "[]";

    const now = new Date().toISOString();
    const userMessageId = crypto.randomUUID();

    // Get agent details for LLM call
    let systemPrompt = agent.system_prompt ?? "";
    const modelUsed = agent.llm_model;
    const provider = agent.llm_provider;

    // -- Initialize Memory System ---------------------------------------
    // MemoryManager orchestrates builtin (MEMORY.md/USER.md) + optional
    // external (kilo-shared-memory) providers. The system prompt is
    // augmented with frozen memory snapshots for prefix-cache friendly
    // injection. Mid-session writes are durable but only visible on next
    // session start (frozen snapshot pattern).
    const memoryManager = createMemoryManager(agentId, sessionId);
    const memoryCtx = memoryManager.buildSystemPrompt();
    if (memoryCtx) {
      systemPrompt = `${systemPrompt}\n\n${memoryCtx}`;
    }

    // Prefetch relevant memories for this user message
    const prefetchedMemory = await memoryManager.prefetchAll(content, sessionId);

    // -- Read attachment content so the agent can actually "see" the files --
    // Text files inject directly; PDFs use embedded text or OCR; images use a
    // vision model when configured (.secrets/vision.conf) with OCR fallback.
    const visionConfig = getVisionConfig();
    const extraction = await extractAttachments(finalFilesJson, {
      visionAvailable: !!visionConfig,
    });
    const augmentedText = buildAugmentedText(content, extraction);

    // Persist augmented text only when extraction added something. Keeps the
    // column null for plain-text turns so the UI doesn't have to filter it.
    const extractedContentForDb =
      augmentedText !== content.trim() ? augmentedText : null;

    // Save user message AFTER extraction so extracted_content can be stored
    // alongside it — subsequent turns then "see" prior attachments via history.
    const userMessage: AgentChatMessage = {
      id: userMessageId,
      session_id: sessionId,
      role: "user",
      content: content.trim(),
      files_json: finalFilesJson,
      model_used: null,
      cost_usd: null,
      created_at: now,
    };

    db.prepare(
      `INSERT INTO chat_messages (id, session_id, role, content, files_json, extracted_content, model_used, cost_usd, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      userMessage.id,
      userMessage.session_id,
      userMessage.role,
      userMessage.content,
      userMessage.files_json,
      extractedContentForDb,
      userMessage.model_used,
      userMessage.cost_usd,
      userMessage.created_at
    );

    // -- Load conversation history for context --
    // CRITICAL: Without history, every LLM call is stateless — the agent
    // "forgets" previous messages and hallucinates past conversations.
    // Use extracted_content when present so prior attachments stay visible.
    const rawHistory = db
      .prepare(
        `SELECT role, content, extracted_content FROM chat_messages
         WHERE session_id = ? AND id != ?
         ORDER BY created_at ASC`
      )
      .all(sessionId, userMessageId) as Array<
        Pick<AgentChatMessage, "role" | "content"> & { extracted_content: string | null }
      >;

    const chatHistory: ChatMessage[] = rawHistory.map((msg) => ({
      role: msg.role === "agent" ? "assistant" : "user",
      content: msg.extracted_content ?? msg.content,
    }));
    // -- Inject prefetched memory into user message --
    // Prefetched memory is wrapped in <memfence> tags so the model
    // understands it's recalled context, not new user input.
    const finalUserContent = prefetchedMemory
      ? `${augmentedText}\n\n${prefetchedMemory}`
      : augmentedText;

    const useVision = !!visionConfig && extraction.images.length > 0;
    const visionUserContent: ChatContentPart[] = [
      { type: "text", text: finalUserContent },
      ...extraction.images.map((img) => ({
        type: "image_url" as const,
        image_url: { url: img.dataUrl },
      })),
    ];

    const wantsStream = request.nextUrl.searchParams.get("stream") === "1";

    // -- Streaming path (NDJSON, opt-in via ?stream=1) --
    if (wantsStream) {
      const agentMessageId = crypto.randomUUID();
      const encoder = new TextEncoder();

      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          const send = (obj: unknown) =>
            controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

          try {
            // Echo the persisted user message first
            send({ type: "user", message: userMessage });

            const startedAt = new Date().toISOString();
            send({ type: "start", id: agentMessageId, created_at: startedAt });

            let fullContent = "";
            let finalModel: string = useVision && visionConfig ? visionConfig.model : modelUsed;
            let finalCost: number | null = null;
            let deltaSent = false;

            // Vision-first when images are present and a vision provider is
            // configured; transparently fall back to the text model + OCR if
            // the vision call fails before producing any output.
            async function* runLLM() {
              if (useVision && visionConfig) {
                try {
                  yield* streamLLMWithHistory(
                    visionConfig.provider,
                    visionConfig.model,
                    [...chatHistory, { role: "user", content: visionUserContent }],
                    systemPrompt
                  );
                  return;
                } catch (visionErr) {
                  if (deltaSent) throw visionErr;
                  send({
                    type: "status",
                    text: "Vision model unavailable — falling back to text/OCR.",
                  });
                  finalModel = modelUsed;
                }
              }
              yield* streamLLMWithHistory(
                provider,
                modelUsed,
                [...chatHistory, { role: "user", content: finalUserContent }],
                systemPrompt
              );
            }

            for await (const chunk of runLLM()) {
              if (chunk.type === "delta") {
                fullContent += chunk.text;
                deltaSent = true;
                send({ type: "delta", text: chunk.text });
              } else if (chunk.type === "done") {
                finalModel = chunk.modelUsed ?? finalModel;
                finalCost = chunk.costUsd ?? null;
              }
            }

            const createdAt = new Date().toISOString();

            // Persist the completed agent message
            db.prepare(
              `INSERT INTO chat_messages (id, session_id, role, content, files_json, model_used, cost_usd, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            ).run(
              agentMessageId,
              sessionId,
              "agent",
              fullContent,
              "[]",
              finalModel,
              finalCost,
              createdAt
            );

            // -- Sync turn to memory providers --
            await memoryManager.syncAll(content, fullContent, sessionId);

            db.prepare(
              "UPDATE chat_sessions SET updated_at = ? WHERE id = ?"
            ).run(createdAt, sessionId);

            send({
              type: "done",
              id: agentMessageId,
              model_used: finalModel,
              cost_usd: finalCost,
              created_at: createdAt,
            });
          } catch (err) {
            send({
              type: "error",
              error: err instanceof Error ? err.message : "LLM streaming error",
            });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // -- Non-streaming path (legacy JSON response) --
    let llmResponse;
    if (useVision && visionConfig) {
      try {
        llmResponse = await callLLMWithHistory(
          visionConfig.provider,
          visionConfig.model,
          [...chatHistory, { role: "user", content: visionUserContent }],
          systemPrompt
        );
      } catch {
        // Fall back to the text model + OCR content if vision fails.
        llmResponse = await callLLMWithHistory(
          provider,
          modelUsed,
          [...chatHistory, { role: "user", content: finalUserContent }],
          systemPrompt
        );
      }
    } else {
      llmResponse = await callLLMWithHistory(
        provider,
        modelUsed,
        [...chatHistory, { role: "user", content: finalUserContent }],
        systemPrompt
      );
    }

    // -- Sync turn to memory providers --
    await memoryManager.syncAll(content, llmResponse.content, sessionId);

    // Save agent response
    const agentMessageId = crypto.randomUUID();
    const agentMessage: AgentChatMessage = {
      id: agentMessageId,
      session_id: sessionId,
      role: "agent",
      content: llmResponse.content,
      files_json: "[]",
      model_used: llmResponse.modelUsed ?? null,
      cost_usd: llmResponse.costUsd ?? null,
      created_at: new Date().toISOString(),
    };

    db.prepare(
      `INSERT INTO chat_messages (id, session_id, role, content, files_json, model_used, cost_usd, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      agentMessage.id,
      agentMessage.session_id,
      agentMessage.role,
      agentMessage.content,
      agentMessage.files_json,
      agentMessage.model_used,
      agentMessage.cost_usd,
      agentMessage.created_at
    );

    // Update session updated_at
    db.prepare(
      "UPDATE chat_sessions SET updated_at = ? WHERE id = ?"
    ).run(now, sessionId);

    return NextResponse.json(
      { userMessage, agentMessage },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/agents/[id]/chat/sessions/[sessionId]/messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}