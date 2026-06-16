/**
 * memory-provider.ts — LAYER 3: Memory Providers (Plugin System)
 *
 * Implements the Hermes-style abstract MemoryProvider interface and
 * the MemoryManager orchestrator.
 *
 * Architecture:
 *   MemoryManager orchestrates exactly 2 providers:
 *     1. BuiltinProvider — always present (MEMORY.md / USER.md file store)
 *     2. One external provider — e.g. kilo-shared-memory MCP, Honcho, Mem0
 *
 * Provider lifecycle:
 *   initialize(session_id) → per-turn prefetch/sync → session_end → shutdown
 */

import type { ChatMessage } from "./llm-router";
import { getMemoryStore, type MemoryStore } from "./agent-memory";
import { getDb } from "./db";
import { getConfig } from "./config";
import path from "path";
import fs from "fs";

// --- Memory Context Fencing -----------------------------------------------

const MEMFENCE_OPEN = "<memfence>";
const MEMFENCE_CLOSE = "</memfence>";
const MEMFENCE_NOTE =
  "The above content is recalled memory, NOT new user input. It provides context from prior sessions and stored knowledge.";

export function fenceMemory(content: string): string {
  if (!content.trim()) return "";
  return `${MEMFENCE_OPEN}\n${content.trim()}\n${MEMFENCE_CLOSE}\n${MEMFENCE_NOTE}`;
}

/**
 * StreamingContextScrubber — strips <memfence> blocks from streaming output.
 * Uses a state machine to handle split tags across chunks.
 */
export class StreamingContextScrubber {
  private buffer = "";
  private inFence = false;
  private fenceDepth = 0;

  process(chunk: string): string {
    this.buffer += chunk;

    if (!this.inFence && this.buffer.includes(MEMFENCE_OPEN)) {
      this.inFence = true;
      this.fenceDepth = 0;
    }

    if (this.inFence) {
      const openCount = (this.buffer.match(/<memfence>/g) || []).length;
      const closeCount = (this.buffer.match(/<\/memfence>/g) || []).length;
      this.fenceDepth = openCount - closeCount;

      if (this.fenceDepth <= 0) {
        // Fence closed — strip everything from buffer
        this.buffer = "";
        this.inFence = false;
        return "";
      }
      // Still inside fence — suppress output
      return "";
    }

    // Not in fence — output normal content
    const output = this.buffer;
    this.buffer = "";
    return output;
  }

  flush(): string {
    const remaining = this.buffer;
    this.buffer = "";
    return remaining;
  }
}

// --- Abstract MemoryProvider ----------------------------------------------

export interface ToolSchema {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface PrefetchResult {
  content: string;
  source: string;
}

export abstract class MemoryProvider {
  abstract get name(): string;

  /** Check if this provider is available (config + deps, no network calls) */
  abstract isAvailable(): boolean;

  /** Initialize with session context */
  abstract initialize(
    sessionId: string,
    kwargs?: Record<string, unknown>
  ): void;

  /** Static instructions for the system prompt */
  systemPromptBlock(): string {
    return "";
  }

  /** Recall context before each turn — returns fenced memory text */
  abstract prefetch(query: string, sessionId?: string): Promise<string>;

  /** Persist the completed turn */
  abstract syncTurn(
    userContent: string,
    assistantContent: string,
    sessionId?: string
  ): Promise<void>;

  /** Get tool schemas exposed to the model */
  abstract getToolSchemas(): ToolSchema[];

  /** Handle a tool call from the model */
  abstract handleToolCall(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<string>;

  /** Shutdown — flush queues, close connections */
  shutdown(): void {
    // noop
  }

  // -- Optional Hooks ------------------------------------------------------

  onTurnStart?(turnNumber: number, message: string): void;
  onSessionEnd?(messages: ChatMessage[]): Promise<void>;
  onSessionSwitch?(
    newSessionId: string,
    parentSessionId?: string
  ): void;
  onPreCompress?(messages: ChatMessage[]): Promise<string>;
  onMemoryWrite?(
    action: string,
    target: string,
    content: string,
    metadata?: Record<string, unknown>
  ): void;
}

// --- Builtin Memory Provider ----------------------------------------------

export class BuiltinMemoryProvider extends MemoryProvider {
  private memoryStore: MemoryStore | null = null;
  private agentId = "";
  private sessionId = "";

  constructor() {
    super();
  }

  get name(): string {
    return "builtin";
  }

  isAvailable(): boolean {
    return true; // Always available
  }

  initialize(
    sessionId: string,
    kwargs?: Record<string, unknown>
  ): void {
    this.sessionId = sessionId;
    this.agentId = (kwargs?.agentId as string) || "";
    if (this.agentId) {
      this.memoryStore = getMemoryStore(this.agentId);
    }
  }

  systemPromptBlock(): string {
    if (!this.memoryStore) return "";
    return this.memoryStore.formatForSystemPrompt();
  }

  async prefetch(query: string, sessionId?: string): Promise<string> {
    if (!this.memoryStore) return "";

    const entries = this.memoryStore.getMemoryEntries();
    if (entries.length === 0) return "";

    // Simple keyword relevance: find entries matching words in the query
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    if (queryWords.length === 0) return "";

    const relevant = entries.filter((entry) =>
      queryWords.some((word) => entry.toLowerCase().includes(word))
    );

    if (relevant.length === 0) return "";

    return fenceMemory(
      `Relevant personal memories:\n${relevant.join("\n\n---\n\n")}`
    );
  }

  async syncTurn(
    userContent: string,
    assistantContent: string,
    sessionId?: string
  ): Promise<void> {
    if (!this.memoryStore) return;
    this.memoryStore.logToToday(
      `Q: ${userContent.slice(0, 200)}\nA: ${assistantContent.slice(0, 200)}`
    );
  }

  getToolSchemas(): ToolSchema[] {
    return [
      {
        name: "memory_add",
        description:
          "Add an entry to your personal memory (MEMORY.md). Entries persist across sessions.",
        inputSchema: {
          type: "object",
          properties: {
            target: {
              type: "string",
              enum: ["memory", "user"],
              description: "memory = agent notes, user = user profile",
            },
            content: {
              type: "string",
              description: "The memory content to save",
            },
          },
          required: ["target", "content"],
        },
      },
      {
        name: "memory_replace",
        description:
          "Replace an existing memory entry by matching text substring.",
        inputSchema: {
          type: "object",
          properties: {
            target: {
              type: "string",
              enum: ["memory", "user"],
            },
            old_text: {
              type: "string",
              description: "Text to find (substring match)",
            },
            new_content: {
              type: "string",
              description: "Replacement content",
            },
          },
          required: ["target", "old_text", "new_content"],
        },
      },
      {
        name: "memory_remove",
        description:
          "Remove a memory entry by matching text substring.",
        inputSchema: {
          type: "object",
          properties: {
            target: {
              type: "string",
              enum: ["memory", "user"],
            },
            text: {
              type: "string",
              description: "Text to find and remove (substring match)",
            },
          },
          required: ["target", "text"],
        },
      },
      {
        name: "session_search",
        description:
          "Search past conversations for decisions, implementations, or context.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query (supports AND, OR, -NOT, 'phrase')",
            },
            limit: {
              type: "number",
              description: "Max results (default 5, max 20)",
            },
            session_id: {
              type: "string",
              description: "Scroll: get context around a specific session",
            },
            around_message_id: {
              type: "string",
              description: "Scroll anchor point",
            },
            window: {
              type: "number",
              description: "Messages around anchor (±N, default 5)",
            },
            sort: {
              type: "string",
              enum: ["newest", "oldest", "relevance"],
              description: "Sort order (default: relevance/BM25)",
            },
          },
          required: [],
        },
      },
    ];
  }

  async handleToolCall(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<string> {
    if (!this.memoryStore) {
      return JSON.stringify({ error: "Memory store not initialized" });
    }

    switch (toolName) {
      case "memory_add": {
        const target = args.target as "memory" | "user";
        const content = args.content as string;
        const result = this.memoryStore.add(target, content);
        this.onMemoryWrite?.("add", target, content);
        return JSON.stringify(result);
      }
      case "memory_replace": {
        const target = args.target as "memory" | "user";
        const oldText = args.old_text as string;
        const newContent = args.new_content as string;
        const result = this.memoryStore.replace(target, oldText, newContent);
        return JSON.stringify(result);
      }
      case "memory_remove": {
        const target = args.target as "memory" | "user";
        const text = args.text as string;
        const result = this.memoryStore.remove(target, text);
        return JSON.stringify(result);
      }
      case "session_search": {
        return await handleSessionSearch(args);
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  }

  async onSessionEnd(messages: ChatMessage[]): Promise<void> {
    if (!this.memoryStore) return;
    // Archive today → yesterday at session end
    this.memoryStore.rollTodayToYesterday();
  }
}

// --- Session Search (LAYER 2 integration) ---------------------------------

async function handleSessionSearch(
  args: Record<string, unknown>
): Promise<string> {
  const query = (args.query as string) || "";
  const limit = Math.min((args.limit as number) || 5, 20);
  const sessionId = args.session_id as string | undefined;
  const aroundMessageId = args.around_message_id as string | undefined;
  const window = (args.window as number) || 5;
  const sort = (args.sort as string) || "relevance";
  const roleFilter = args.role_filter as string | undefined;

  const db = getDb();

  // -- BROWSE: No args → recent sessions --
  if (!query && !sessionId) {
    const sessions = db
      .prepare(
        `SELECT id, agent_id, title, created_at, updated_at,
                (SELECT content FROM chat_messages WHERE session_id = s.id ORDER BY created_at ASC LIMIT 1) as first_message,
                (SELECT COUNT(*) FROM chat_messages WHERE session_id = s.id) as message_count
         FROM chat_sessions s
         ORDER BY updated_at DESC
         LIMIT ?`
      )
      .all(limit) as Array<{
      id: string;
      agent_id: string;
      title: string | null;
      created_at: string;
      updated_at: string;
      first_message: string | null;
      message_count: number;
    }>;

    return JSON.stringify({
      mode: "browse",
      count: sessions.length,
      results: sessions.map((s) => ({
        session_id: s.id,
        agent_id: s.agent_id,
        title: s.title,
        created_at: s.created_at,
        updated_at: s.updated_at,
        message_count: s.message_count,
        snippet: s.first_message?.slice(0, 200) || null,
      })),
    });
  }

  // -- SCROLL: session_id + around_message_id → context window --
  if (sessionId && aroundMessageId) {
    // Get the anchor message's position
    const anchor = db
      .prepare(
        `SELECT id, created_at FROM chat_messages WHERE id = ? AND session_id = ?`
      )
      .get(aroundMessageId, sessionId) as { id: string; created_at: string } | undefined;

    if (!anchor) {
      return JSON.stringify({ error: "Message not found" });
    }

    // Get messages before and after the anchor
    const before = db
      .prepare(
        `SELECT id, role, content, created_at FROM chat_messages
         WHERE session_id = ? AND created_at < ?
         ORDER BY created_at DESC LIMIT ?`
      )
      .all(sessionId, anchor.created_at, window) as Array<{
      id: string;
      role: string;
      content: string;
      created_at: string;
    }>;

    const after = db
      .prepare(
        `SELECT id, role, content, created_at FROM chat_messages
         WHERE session_id = ? AND created_at > ?
         ORDER BY created_at ASC LIMIT ?`
      )
      .all(sessionId, anchor.created_at, window) as Array<{
      id: string;
      role: string;
      content: string;
      created_at: string;
    }>;

    // Get session info
    const session = db
      .prepare("SELECT id, title, agent_id FROM chat_sessions WHERE id = ?")
      .get(sessionId) as { id: string; title: string | null; agent_id: string } | undefined;

    return JSON.stringify({
      mode: "scroll",
      session_id: sessionId,
      session_title: session?.title || null,
      agent_id: session?.agent_id || null,
      anchor_message_id: aroundMessageId,
      messages_before: before.reverse(),
      messages_after: after,
    });
  }

  // -- DISCOVERY: FTS5 text search (uses LIKE as fallback since FTS5 table may not exist) --
  // Check if FTS5 tables exist
  const ftsExists = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'messages_fts'`
    )
    .get();

  interface SearchResult {
    session_id: string;
    title: string | null;
    agent_id: string;
    created_at: string;
    snippet: string;
    role: string;
    message_id: string;
    rank?: number;
  }

  let results: SearchResult[] = [];

  if (ftsExists) {
    // Use FTS5 search with BM25 ranking
    const ftsQuery = query
      .replace(/\s+OR\s+/g, " OR ")
      .replace(/\s+NOT\s+/g, " NOT ")
      .replace(/"([^"]+)"/g, '"$1"')
      .split(/\s+/)
      .filter((w) => w && !["OR", "NOT"].includes(w.toUpperCase()))
      .map((w) => {
        if (w.startsWith('"') && w.endsWith('"')) return w;
        if (["OR", "NOT"].includes(w.toUpperCase())) return w;
        return `${w}*`;
      })
      .join(" ");

    try {
      const ftsResults = db
        .prepare(
          `SELECT m.id as message_id, m.session_id, m.role, m.content,
                  s.title, s.agent_id, s.created_at,
                  rank
           FROM messages_fts f
           JOIN chat_messages m ON f.rowid = m.id
           JOIN chat_sessions s ON m.session_id = s.id
           WHERE messages_fts MATCH ?
           ${roleFilter ? "AND m.role = ?" : ""}
           ORDER BY rank
           LIMIT ?`
        )
        .all(
          roleFilter ? [ftsQuery, roleFilter, limit] : [ftsQuery, limit]
        ) as Array<{
        message_id: string;
        session_id: string;
        role: string;
        content: string;
        title: string | null;
        agent_id: string;
        created_at: string;
        rank: number;
      }>;

      results = ftsResults.map((r) => ({
        session_id: r.session_id,
        title: r.title,
        agent_id: r.agent_id,
        created_at: r.created_at,
        snippet: r.content.slice(0, 300),
        role: r.role,
        message_id: r.message_id,
        rank: r.rank,
      }));
    } catch {
      // FTS5 query failed — fall through to LIKE search
    }
  }

  // Fallback: LIKE-based search if FTS5 not available or query failed
  if (results.length === 0) {
    const likePattern = `%${query}%`;
    const likeResults = db
      .prepare(
        `SELECT m.id as message_id, m.session_id, m.role, m.content,
                s.title, s.agent_id, s.created_at
         FROM chat_messages m
         JOIN chat_sessions s ON m.session_id = s.id
         WHERE m.content LIKE ?
         ${roleFilter ? "AND m.role = ?" : ""}
         ORDER BY m.created_at DESC
         LIMIT ?`
      )
      .all(
        roleFilter
          ? [likePattern, roleFilter, limit]
          : [likePattern, limit]
      ) as Array<{
      message_id: string;
      session_id: string;
      role: string;
      content: string;
      title: string | null;
      agent_id: string;
      created_at: string;
    }>;

    results = likeResults.map((r) => ({
      session_id: r.session_id,
      title: r.title,
      agent_id: r.agent_id,
      created_at: r.created_at,
      snippet: r.content.slice(0, 300),
      role: r.role,
      message_id: r.message_id,
    }));
  }

  // Get bookend messages for each unique session
  const uniqueSessions = [...new Set(results.map((r) => r.session_id))];
  const bookended = uniqueSessions.map((sid) => {
    const sessionResults = results.filter((r) => r.session_id === sid);
    const firstMsg = db
      .prepare(
        "SELECT content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 3"
      )
      .all(sid) as Array<{ content: string }>;

    const lastMsg = db
      .prepare(
        "SELECT content FROM chat_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 3"
      )
      .all(sid) as Array<{ content: string }>;

    return {
      session_id: sid,
      title: sessionResults[0]?.title || null,
      agent_id: sessionResults[0]?.agent_id || null,
      snippet: sessionResults[0]?.snippet || "",
      role: sessionResults[0]?.role || null,
      bookend_start: firstMsg.map((m) => m.content.slice(0, 200)),
      bookend_end: lastMsg.reverse().map((m) => m.content.slice(0, 200)),
      match_count: sessionResults.length,
    };
  });

  return JSON.stringify({
    mode: "discovery",
    query,
    count: bookended.length,
    results: bookended,
  });
}

// --- External Memory Provider (kilo-shared-memory MCP integration) --------

export class KiloSharedMemoryProvider extends MemoryProvider {
  private available = false;

  get name(): string {
    return "kilo-shared-memory";
  }

  isAvailable(): boolean {
    return this.available;
  }

  initialize(sessionId: string, kwargs?: Record<string, unknown>): void {
    // The kilo-shared-memory MCP server is wired at the Kilo CLI level
    // via .mcp.json. This provider wraps the tool calls to use it.
    // Check if the MCP server is configured (look for env or config marker)
    const config = getConfig();
    const mcpConfigPath = path.join(config.agenticOsDir, ".mcp.json");
    this.available = fs.existsSync(mcpConfigPath);
  }

  async prefetch(query: string, sessionId?: string): Promise<string> {
    if (!this.available) return "";
    // Delegated to MCP tool call at the orchestrator level
    return "";
  }

  async syncTurn(
    userContent: string,
    assistantContent: string,
    sessionId?: string
  ): Promise<void> {
    // Delegated to MCP at session end
  }

  getToolSchemas(): ToolSchema[] {
    if (!this.available) return [];
    return [
      {
        name: "shared_memory_search",
        description:
          "Search shared memory across all agents. Queries the kilo-shared-memory MCP store for decisions, implementations, bugs, workflows, or context from any agent.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            scope: {
              type: "string",
              description: "Filter by scope (global, team, project)",
            },
            category: { type: "string", description: "Filter by category" },
            limit: {
              type: "number",
              description: "Max results (default 5, max 20)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "shared_memory_save",
        description:
          "Save a durable memory visible to all agents. Use for cross-agent decisions, architecture, workflows, and project facts.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short title" },
            summary: { type: "string", description: "One-line summary" },
            details: { type: "string", description: "Full details" },
            category: {
              type: "string",
              description: "e.g. architecture, decision, bugfix, workflow",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Searchable tags",
            },
            scope: {
              type: "string",
              default: "team",
              description: "Visibility scope",
            },
          },
          required: ["title", "summary", "details"],
        },
      },
    ];
  }

  async handleToolCall(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<string> {
    if (!this.available) {
      return JSON.stringify({ error: "Shared memory MCP not available" });
    }

    // The actual execution is delegated to the Kilo MCP layer.
    // This provider just exposes the schemas and routing.
    // The MCP call is made by the calling context (orchestrator).
    return JSON.stringify({
      ok: false,
      message:
        "Use the shared-memory MCP server directly via the orchestrator",
      mcp_server: "shared-memory",
      mcp_tool: toolName === "shared_memory_search" ? "search_memory" : "save_memory",
      arguments: args,
    });
  }
}

// --- MemoryManager Orchestrator -------------------------------------------

export class MemoryManager {
  private providers: MemoryProvider[] = [];
  private hasExternal = false;

  /** Maximum one external provider. Builtin always accepted. */
  addProvider(provider: MemoryProvider): boolean {
    if (provider instanceof BuiltinMemoryProvider) {
      // Builtin always accepted — replace existing if any
      const existingBuiltin = this.providers.findIndex(
        (p) => p instanceof BuiltinMemoryProvider
      );
      if (existingBuiltin >= 0) {
        this.providers[existingBuiltin] = provider;
      } else {
        this.providers.push(provider);
      }
      return true;
    }

    if (this.hasExternal) {
      return false; // Only one external provider allowed
    }

    if (!provider.isAvailable()) {
      this.providers.push(provider); // Add but mark as unavailable
      return true;
    }

    this.providers.push(provider);
    this.hasExternal = true;
    return true;
  }

  initializeAll(sessionId: string, kwargs?: Record<string, unknown>): void {
    for (const provider of this.providers) {
      provider.initialize(sessionId, kwargs);
    }
  }

  /** Build system prompt block from all providers */
  buildSystemPrompt(): string {
    const blocks: string[] = [];
    for (const provider of this.providers) {
      try {
        const block = provider.systemPromptBlock();
        if (block) blocks.push(block);
      } catch {
        // Isolate provider errors
      }
    }
    return blocks.join("\n\n");
  }

  /** Get all tool schemas from all providers */
  getAllToolSchemas(): ToolSchema[] {
    const schemas: ToolSchema[] = [];
    for (const provider of this.providers) {
      try {
        schemas.push(...provider.getToolSchemas());
      } catch {
        // Isolate provider errors
      }
    }
    return schemas;
  }

  /** Prefetch memory from all providers */
  async prefetchAll(
    query: string,
    sessionId?: string
  ): Promise<string> {
    const results: string[] = [];
    for (const provider of this.providers) {
      try {
        const result = await provider.prefetch(query, sessionId);
        if (result) results.push(result);
      } catch {
        // Isolate provider errors
      }
    }
    return results.join("\n\n");
  }

  /** Sync completed turn to all providers */
  async syncAll(
    userContent: string,
    assistantContent: string,
    sessionId?: string
  ): Promise<void> {
    for (const provider of this.providers) {
      try {
        await provider.syncTurn(userContent, assistantContent, sessionId);
      } catch {
        // Isolate provider errors
      }
    }
  }

  /** Handle a tool call — dispatch to the right provider */
  async handleToolCall(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<string> {
    // Builtin tools
    if (
      ["memory_add", "memory_replace", "memory_remove", "session_search"].includes(
        toolName
      )
    ) {
      const builtin = this.providers.find(
        (p) => p instanceof BuiltinMemoryProvider
      );
      if (builtin) return builtin.handleToolCall(toolName, args);
    }

    // Shared memory tools
    if (
      ["shared_memory_search", "shared_memory_save"].includes(toolName)
    ) {
      const external = this.providers.find(
        (p) => !(p instanceof BuiltinMemoryProvider)
      );
      if (external) return external.handleToolCall(toolName, args);
    }

    return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }

  /** Session end hooks */
  async onSessionEnd(messages: ChatMessage[]): Promise<void> {
    for (const provider of this.providers) {
      try {
        await provider.onSessionEnd?.(messages);
      } catch {
        // Isolate provider errors
      }
    }
  }

  /** Session switch hooks */
  onSessionSwitch(
    newSessionId: string,
    parentSessionId?: string
  ): void {
    for (const provider of this.providers) {
      try {
        provider.onSessionSwitch?.(newSessionId, parentSessionId);
      } catch {
        // Isolate provider errors
      }
    }
  }

  /** Pre-compression hook — extract insights before context is compressed */
  async onPreCompress(messages: ChatMessage[]): Promise<string> {
    const insights: string[] = [];
    for (const provider of this.providers) {
      try {
        const result = await provider.onPreCompress?.(messages);
        if (result) insights.push(result);
      } catch {
        // Isolate provider errors
      }
    }
    return insights.join("\n");
  }

  shutdownAll(): void {
    for (const provider of this.providers) {
      try {
        provider.shutdown();
      } catch {
        // Isolate provider errors
      }
    }
    this.providers = [];
    this.hasExternal = false;
  }
}

// --- Factory --------------------------------------------------------------

const managerCache = new Map<string, MemoryManager>();

export function createMemoryManager(
  agentId: string,
  sessionId: string,
  enableExternal?: boolean
): MemoryManager {
  const cacheKey = `${agentId}:${sessionId}`;
  if (managerCache.has(cacheKey)) {
    return managerCache.get(cacheKey)!;
  }

  const manager = new MemoryManager();

  // Always add builtin provider
  manager.addProvider(new BuiltinMemoryProvider());

  // Optionally add external provider
  if (enableExternal !== false) {
    const external = new KiloSharedMemoryProvider();
    if (external.isAvailable()) {
      manager.addProvider(external);
    }
  }

  manager.initializeAll(sessionId, { agentId });

  // Cache for the session lifecycle
  managerCache.set(cacheKey, manager);

  return manager;
}

export function clearMemoryManager(agentId: string, sessionId: string): void {
  const cacheKey = `${agentId}:${sessionId}`;
  const manager = managerCache.get(cacheKey);
  if (manager) {
    manager.shutdownAll();
    managerCache.delete(cacheKey);
  }
}

export function clearAllMemoryManagers(): void {
  for (const [key, manager] of managerCache) {
    manager.shutdownAll();
  }
  managerCache.clear();
}
