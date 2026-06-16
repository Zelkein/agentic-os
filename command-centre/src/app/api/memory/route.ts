/**
 * POST /api/memory
 *
 * Agentic OS Memory API — CRUD for agent personal memories.
 * Used by agents to save/read/update/delete their MEMORY.md and USER.md entries.
 *
 * Body: {
 *   action: "add" | "replace" | "remove" | "search" | "list",
 *   agent_id: string,
 *   target?: "memory" | "user",
 *   content?: string,
 *   old_text?: string,
 *   new_content?: string,
 *   query?: string,
 *   limit?: number
 * }
 *
 * Also supports session_search via:
 *   action: "session_search",
 *   agent_id: string,
 *   query?: string,
 *   limit?: number,
 *   session_id?: string,
 *   around_message_id?: string,
 *   window?: number,
 *   sort?: "newest" | "oldest" | "relevance"
 */

import { NextRequest, NextResponse } from "next/server";
import { getMemoryStore } from "@/lib/agent-memory";
import { createMemoryManager, clearMemoryManager } from "@/lib/memory-provider";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, agent_id } = body;

    if (!agent_id) {
      return NextResponse.json({ error: "agent_id is required" }, { status: 400 });
    }

    // Verify agent exists
    const db = getDb();
    const agent = db.prepare("SELECT id FROM agents WHERE id = ?").get(agent_id);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    switch (action) {
      case "add": {
        const store = getMemoryStore(agent_id);
        const result = store.add(body.target ?? "memory", body.content ?? "");
        return NextResponse.json(result);
      }

      case "replace": {
        const store = getMemoryStore(agent_id);
        const result = store.replace(
          body.target ?? "memory",
          body.old_text ?? "",
          body.new_content ?? ""
        );
        return NextResponse.json(result);
      }

      case "remove": {
        const store = getMemoryStore(agent_id);
        const result = store.remove(body.target ?? "memory", body.text ?? "");
        return NextResponse.json(result);
      }

      case "list": {
        const store = getMemoryStore(agent_id);
        const target = body.target ?? "memory";
        if (target === "memory") {
          return NextResponse.json({ entries: store.getMemoryEntries() });
        } else if (target === "user") {
          return NextResponse.json({ entries: store.getUserEntries() });
        }
        return NextResponse.json({
          memory: store.getMemoryEntries(),
          user: store.getUserEntries(),
        });
      }

      case "search": {
        const query = body.query ?? "";
        if (!query.trim()) {
          return NextResponse.json({ error: "query is required for search" }, { status: 400 });
        }
        const limit = Math.min(body.limit ?? 5, 20);

        const rows = db
          .prepare(
            `SELECT id, agent_id, scope, category, title, content, summary, tags,
                    source_session_id, created_at, updated_at
             FROM agent_memories
             WHERE agent_id = ?
               AND (content LIKE ? OR title LIKE ? OR summary LIKE ? OR tags LIKE ?)
             ORDER BY created_at DESC
             LIMIT ?`
          )
          .all(
            agent_id,
            `%${query}%`,
            `%${query}%`,
            `%${query}%`,
            `%${query}%`,
            limit
          );

        return NextResponse.json({ query, count: (rows as unknown[]).length, results: rows });
      }

      case "session_search": {
        const manager = createMemoryManager(agent_id, "api-search");
        const result = await manager.handleToolCall("session_search", {
          query: body.query ?? "",
          limit: body.limit ?? 5,
          session_id: body.session_id,
          around_message_id: body.around_message_id,
          window: body.window ?? 5,
          sort: body.sort ?? "relevance",
          role_filter: body.role_filter,
        });
        clearMemoryManager(agent_id, "api-search");
        const parsed = JSON.parse(result);
        return NextResponse.json(parsed);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Supported: add, replace, remove, list, search, session_search` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("POST /api/memory error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/memory?agent_id=:id&target=memory|user
 *
 * Return the memory store info for an agent.
 */
export async function GET(request: NextRequest) {
  try {
    const agent_id = request.nextUrl.searchParams.get("agent_id");
    const target = request.nextUrl.searchParams.get("target") ?? "memory";

    if (!agent_id) {
      return NextResponse.json({ error: "agent_id query param is required" }, { status: 400 });
    }

    const store = getMemoryStore(agent_id);

    if (target === "memory") {
      return NextResponse.json({
        agent_id,
        entries: store.getMemoryEntries(),
        memories_dir: store.getMemoriesDir(),
      });
    } else if (target === "user") {
      return NextResponse.json({
        agent_id,
        entries: store.getUserEntries(),
        memories_dir: store.getMemoriesDir(),
      });
    }

    return NextResponse.json({
      agent_id,
      memory: store.getMemoryEntries(),
      user: store.getUserEntries(),
      memories_dir: store.getMemoriesDir(),
      snapshot: store.getSnapshot(),
    });
  } catch (error) {
    console.error("GET /api/memory error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
