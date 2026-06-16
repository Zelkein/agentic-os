/**
 * agent-memory.ts — LAYER 1: Injection Files (Hermes-style MemoryStore)
 *
 * Per-agent persistent memory using flat markdown files:
 *   $AGENTIC_OS_ROOT/memories/{agent_id}/
 *     SOUL.md       — Agent identity (overrides default system prompt identity)
 *     MEMORY.md     — Agent's personal notes (frozen snapshot, ~2200 chars)
 *     USER.md       — User profile shared across agents (~1375 chars)
 *     today.md      — Current session activity log
 *     yesterday.md  — Previous session activity log
 *
 * Frozen Snapshot Pattern:
 *   At loadFromDisk(), a snapshot is captured. The system prompt uses this
 *   frozen snapshot for the entire session (preserves API prefix cache).
 *   Mid-session writes go to disk immediately (durable) but don't change
 *   the system prompt until next session start.
 */

import fs from "fs";
import path from "path";
import { getConfig } from "./config";

// --- Constants ------------------------------------------------------------

const MEMORY_CHAR_LIMIT = 2200;
const USER_CHAR_LIMIT = 1375;
const SECTION_DELIMITER = "\n§\n";

type MemoryTarget = "memory" | "user" | "today" | "yesterday";

const FILE_NAMES: Record<MemoryTarget, string> = {
  memory: "MEMORY.md",
  user: "USER.md",
  today: "today.md",
  yesterday: "yesterday.md",
};

// --- Helpers --------------------------------------------------------------

function parseEntries(content: string): string[] {
  if (!content || !content.trim()) return [];
  return content
    .split(SECTION_DELIMITER)
    .map((e) => e.trim())
    .filter(Boolean);
}

function formatEntries(entries: string[]): string {
  return entries.join(SECTION_DELIMITER) + "\n";
}

function deduplicatePreserveOrder(entries: string[]): string[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    const key = e.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scanInjectionPatterns(text: string): string | null {
  // Security: reject prompt injection, role hijack, exfiltration patterns
  const dangerous = [
    /ignore all previous instructions/i,
    /you are now/i,
    /role:\s*system/i,
    /curl\s+(https?:\/\/)/i,
    /wget\s+(https?:\/\/)/i,
    /\/\/\s*secrets?/i,
    /sk-[a-zA-Z0-9]{20,}/,  // API key patterns
  ];
  for (const pattern of dangerous) {
    if (pattern.test(text)) {
      return `Content rejected: matched dangerous pattern`;
    }
  }
  return null;
}

// --- File I/O with Atomic Writes -----------------------------------------

function readFileSafe(filePath: string): string {
  try {
    if (!fs.existsSync(filePath)) return "";
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function atomicWriteFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  // Atomic write: temp file → fsync → rename
  const tmpPath = path.join(dir, `.tmp_${path.basename(filePath)}_${Date.now()}`);
  const fd = fs.openSync(tmpPath, "w");
  try {
    fs.writeSync(fd, content, 0, "utf-8");
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmpPath, filePath);
}

// Simple advisory lock file (per-agent) for cross-process safety
const LOCKS_DIR = path.join(
  getConfig().agenticOsDir,
  ".command-centre",
  ".memory-locks"
);

function withLock<T>(agentId: string, fn: () => T): T {
  fs.mkdirSync(LOCKS_DIR, { recursive: true });
  const lockFile = path.join(LOCKS_DIR, `${agentId}.lock`);

  // Retry loop for acquiring the lock
  const start = Date.now();
  const timeout = 5000; // 5s max wait
  while (Date.now() - start < timeout) {
    try {
      const fd = fs.openSync(lockFile, "wx"); // exclusive create
      fs.closeSync(fd);
      try {
        return fn();
      } finally {
        try { fs.unlinkSync(lockFile); } catch { /* best effort */ }
      }
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException)?.code !== "EEXIST") {
        // Non-conflict error — still proceed
        return fn();
      }
      // Lock exists — wait and retry
      const delay = 20 + Math.random() * 130; // 20-150ms jitter
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
    }
  }
  // Timeout — proceed without lock (degraded but safe)
  return fn();
}

// --- MemoryStore Class ----------------------------------------------------

export interface MemorySnapshot {
  memory: string;
  user: string;
  soul: string;
  today: string;
  yesterday: string;
}

export class MemoryStore {
  private agentId: string;
  private memoriesDir: string;

  // Live state (mid-session edits)
  private memoryEntries: string[] = [];
  private userEntries: string[] = [];

  // Frozen at session start — used for system prompt injection
  private snapshot: MemorySnapshot = {
    memory: "",
    user: "",
    soul: "",
    today: "",
    yesterday: "",
  };

  constructor(agentId: string) {
    this.agentId = agentId;
    const config = getConfig();
    this.memoriesDir = path.join(config.agenticOsDir, "memories", agentId);
  }

  // -- Paths ---------------------------------------------------------------

  private filePath(target: MemoryTarget): string {
    return path.join(this.memoriesDir, FILE_NAMES[target]);
  }

  private soulPath(): string {
    return path.join(this.memoriesDir, "SOUL.md");
  }

  // -- Load from Disk ------------------------------------------------------

  loadFromDisk(): void {
    fs.mkdirSync(this.memoriesDir, { recursive: true });

    // Read and parse entries
    this.memoryEntries = parseEntries(readFileSafe(this.filePath("memory")));
    this.userEntries = parseEntries(readFileSafe(this.filePath("user")));

    // Deduplicate preserving order
    this.memoryEntries = deduplicatePreserveOrder(this.memoryEntries);
    this.userEntries = deduplicatePreserveOrder(this.userEntries);

    // Capture frozen snapshot for the system prompt
    const todayRaw = readFileSafe(this.filePath("today"));
    const yesterdayRaw = readFileSafe(this.filePath("yesterday"));

    // Today rollover: if today.md hasn't been updated today, roll content
    this.ensureTodayRollover(todayRaw);

    this.snapshot = {
      memory: this.renderBlock("memory", this.memoryEntries, MEMORY_CHAR_LIMIT),
      user: this.renderBlock("user", this.userEntries, USER_CHAR_LIMIT),
      soul: readFileSafe(this.soulPath()),
      today: readFileSafe(this.filePath("today")),
      yesterday: readFileSafe(this.filePath("yesterday")),
    };
  }

  private ensureTodayRollover(todayContent: string): void {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    if (todayContent && !todayContent.startsWith(today)) {
      // Previous session content → yesterday.md
      const yesterdayRaw = readFileSafe(this.filePath("yesterday"));
      const merged = yesterdayRaw
        ? `${yesterdayRaw}\n\n---\n${todayContent}`
        : todayContent;
      atomicWriteFile(this.filePath("yesterday"), merged.trim() + "\n");
      // Reset today
      atomicWriteFile(this.filePath("today"), `${today} — session start\n`);
    } else if (!todayContent) {
      atomicWriteFile(this.filePath("today"), `${today} — session start\n`);
    }
  }

  private renderBlock(
    target: string,
    entries: string[],
    charLimit: number
  ): string {
    if (entries.length === 0) return "";

    const rendered = entries.join(SECTION_DELIMITER);
    let truncated = rendered;
    if (rendered.length > charLimit) {
      // Truncate at the last complete entry boundary within limit
      let accum = "";
      for (const entry of entries) {
        const next = accum ? `${accum}${SECTION_DELIMITER}${entry}` : entry;
        if (next.length > charLimit) break;
        accum = next;
      }
      truncated = accum || entries[0].slice(0, charLimit);
    }

    return truncated;
  }

  // -- Frozen Snapshot (for System Prompt) ---------------------------------

  getSnapshot(): MemorySnapshot {
    return { ...this.snapshot };
  }

  formatForSystemPrompt(): string {
    const parts: string[] = [];

    if (this.snapshot.soul) {
      parts.push(this.snapshot.soul);
    }

    if (this.snapshot.memory) {
      const pct = Math.round(
        (this.snapshot.memory.length / MEMORY_CHAR_LIMIT) * 100
      );
      parts.push(
        `----------------------------------------------\n` +
        `MEMORY (personal notes) [${pct}% — ${this.snapshot.memory.length}/${MEMORY_CHAR_LIMIT} chars]\n` +
        `----------------------------------------------\n` +
        this.snapshot.memory
      );
    }

    if (this.snapshot.user) {
      const pct = Math.round(
        (this.snapshot.user.length / USER_CHAR_LIMIT) * 100
      );
      parts.push(
        `----------------------------------------------\n` +
        `USER PROFILE [${pct}% — ${this.snapshot.user.length}/${USER_CHAR_LIMIT} chars]\n` +
        `----------------------------------------------\n` +
        this.snapshot.user
      );
    }

    return parts.join("\n\n");
  }

  // -- CRUD Operations (mid-session) ---------------------------------------

  add(target: MemoryTarget, content: string): { ok: boolean; error?: string } {
    if (!content.trim()) {
      return { ok: false, error: "Content cannot be empty" };
    }

    const injectionIssue = scanInjectionPatterns(content);
    if (injectionIssue) {
      return { ok: false, error: injectionIssue };
    }

    return withLock(this.agentId, () => {
      const entries =
        target === "memory"
          ? this.memoryEntries
          : target === "user"
          ? this.userEntries
          : null;

      if (entries === null) {
        // today/yesterday — append directly
        const filePath = this.filePath(target);
        const existing = readFileSafe(filePath);
        const updated = existing
          ? `${existing}\n${content.trim()}`
          : content.trim();
        atomicWriteFile(filePath, updated + "\n");
        return { ok: true };
      }

      // Check duplicate
      const normalized = content.trim().toLowerCase();
      if (entries.some((e) => e.toLowerCase() === normalized)) {
        return { ok: false, error: "Duplicate entry" };
      }

      entries.push(content.trim());
      this.flushToDisk(target);

      return { ok: true };
    });
  }

  replace(
    target: MemoryTarget,
    oldText: string,
    newContent: string
  ): { ok: boolean; error?: string } {
    if (!newContent.trim()) {
      return { ok: false, error: "Content cannot be empty" };
    }

    return withLock(this.agentId, () => {
      const entries =
        target === "memory"
          ? this.memoryEntries
          : target === "user"
          ? this.userEntries
          : null;

      if (entries === null) return { ok: false, error: "Target not supported for replace" };

      const idx = entries.findIndex((e) =>
        e.toLowerCase().includes(oldText.toLowerCase())
      );
      if (idx === -1) {
        return { ok: false, error: "Entry not found" };
      }

      const injectionIssue = scanInjectionPatterns(newContent);
      if (injectionIssue) {
        return { ok: false, error: injectionIssue };
      }

      entries[idx] = newContent.trim();
      this.flushToDisk(target);

      return { ok: true };
    });
  }

  remove(
    target: MemoryTarget,
    text: string
  ): { ok: boolean; error?: string } {
    return withLock(this.agentId, () => {
      const entries =
        target === "memory"
          ? this.memoryEntries
          : target === "user"
          ? this.userEntries
          : null;

      if (entries === null) return { ok: false, error: "Target not supported for remove" };

      const idx = entries.findIndex((e) =>
        e.toLowerCase().includes(text.toLowerCase())
      );
      if (idx === -1) {
        return { ok: false, error: "Entry not found" };
      }

      entries.splice(idx, 1);
      this.flushToDisk(target);

      return { ok: true };
    });
  }

  private flushToDisk(target: MemoryTarget): void {
    const entries =
      target === "memory"
        ? this.memoryEntries
        : target === "user"
        ? this.userEntries
        : [];

    const formatted = formatEntries(entries);
    atomicWriteFile(this.filePath(target), formatted);
  }

  // -- Utility -------------------------------------------------------------

  getMemoriesDir(): string {
    return this.memoriesDir;
  }

  getMemoryEntries(): string[] {
    return [...this.memoryEntries];
  }

  getUserEntries(): string[] {
    return [...this.userEntries];
  }

  // -- Session Logging -----------------------------------------------------

  logToToday(entry: string): void {
    const timestamp = new Date().toISOString();
    withLock(this.agentId, () => {
      const filePath = this.filePath("today");
      const existing = readFileSafe(filePath);
      const updated = `${existing}\n[${timestamp}] ${entry.trim()}`;
      atomicWriteFile(filePath, updated.trim() + "\n");
    });
  }

  rollTodayToYesterday(): void {
    withLock(this.agentId, () => {
      const todayContent = readFileSafe(this.filePath("today"));
      if (!todayContent.trim()) return;

      const yesterdayPath = this.filePath("yesterday");
      const existingYesterday = readFileSafe(yesterdayPath);
      const merged = existingYesterday
        ? `${todayContent}\n\n---\n${existingYesterday}`
        : todayContent;

      // Keep only last ~10 "sessions" in yesterday to avoid bloat
      const sessions = merged.split("\n---\n");
      const recent = sessions.slice(0, 10);

      atomicWriteFile(yesterdayPath, recent.join("\n---\n").trim() + "\n");
      atomicWriteFile(this.filePath("today"), "");
    });
  }
}

// --- Factory --------------------------------------------------------------

const storeCache = new Map<string, MemoryStore>();

export function getMemoryStore(agentId: string): MemoryStore {
  if (!storeCache.has(agentId)) {
    const store = new MemoryStore(agentId);
    store.loadFromDisk();
    storeCache.set(agentId, store);
  }
  return storeCache.get(agentId)!;
}

export function clearMemoryStoreCache(agentId?: string): void {
  if (agentId) {
    storeCache.delete(agentId);
  } else {
    storeCache.clear();
  }
}
