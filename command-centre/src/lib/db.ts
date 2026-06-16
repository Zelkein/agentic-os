import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { getConfig } from "./config";
import { getExecutionPermissionMode, normalizePermissionMode } from "./permission-mode";

let db: Database.Database | null = null;

function cronRunsSupportsTimeout(database: Database.Database): boolean {
  const row = database
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'cron_runs'")
    .get() as { sql?: string } | undefined;

  return row?.sql?.includes("'timeout'") ?? false;
}

function migrateCronRunsForTimeout(database: Database.Database) {
  database.exec(`
    BEGIN;
    CREATE TABLE cron_runs_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobSlug TEXT NOT NULL,
      taskId TEXT,
      startedAt TEXT NOT NULL,
      completedAt TEXT,
      result TEXT NOT NULL DEFAULT 'running' CHECK (result IN ('success', 'failure', 'timeout', 'running')),
      durationSec REAL,
      costUsd REAL,
      exitCode INTEGER,
      trigger TEXT DEFAULT 'scheduled',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO cron_runs_new (id, jobSlug, taskId, startedAt, completedAt, result, durationSec, costUsd, exitCode, trigger, createdAt)
    SELECT id, jobSlug, taskId, startedAt, completedAt, result, durationSec, costUsd, exitCode, trigger, createdAt
    FROM cron_runs;
    DROP TABLE cron_runs;
    ALTER TABLE cron_runs_new RENAME TO cron_runs;
    CREATE INDEX IF NOT EXISTS idx_cron_runs_jobSlug ON cron_runs(jobSlug);
    CREATE INDEX IF NOT EXISTS idx_cron_runs_startedAt ON cron_runs(startedAt);
    COMMIT;
  `);
}

export function getDb(): Database.Database {
  if (db) return db;

  const config = getConfig();

  db = new Database(config.dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma("journal_mode = WAL");

  // Read and execute schema
  const schemaPath = path.join(__dirname, "schema.sql");
  let schemaSql: string;

  try {
    schemaSql = fs.readFileSync(schemaPath, "utf-8");
  } catch {
    // In Next.js bundled environment, __dirname may not resolve correctly.
    // Fall back to the repo-local command-centre source tree.
    const fallbackPath = path.join(config.agenticOsDir, "command-centre", "src", "lib", "schema.sql");
    schemaSql = fs.readFileSync(fallbackPath, "utf-8");
  }

  // ── Pre-migration: ensure agents table has created_by and visibility columns ──
  // The schema.sql creates an index on agents(created_by, visibility), but older
  // databases may have an agents table that predates those columns. Migrate them
  // in first so db.exec(schemaSql) can succeed.
  // Wrapped in try-catch because on a fresh DB the agents table doesn't exist yet.
  try {
    const agentCols = db.prepare("PRAGMA table_info(agents)").all() as Array<{ name: string }>;
    if (!agentCols.some((c) => c.name === "created_by")) {
      db.exec("ALTER TABLE agents ADD COLUMN created_by TEXT");
    }
    if (!agentCols.some((c) => c.name === "visibility")) {
      db.exec("ALTER TABLE agents ADD COLUMN visibility TEXT DEFAULT 'private'");
    }
  } catch {
    // Fresh DB — agents table created by schema.sql below
  }

  db.exec(schemaSql);

  // Migration: add clientId column if it doesn't exist
  const columns = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
  if (!columns.some((c) => c.name === "clientId")) {
    db.exec("ALTER TABLE tasks ADD COLUMN clientId TEXT");
    db.exec("CREATE INDEX IF NOT EXISTS idx_tasks_clientId ON tasks(clientId)");
  }

  // Migration: add description column if it doesn't exist
  const descCol = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
  if (!descCol.some((c) => c.name === "description")) {
    db.exec("ALTER TABLE tasks ADD COLUMN description TEXT");
  }

  // Migration: add projectSlug column if it doesn't exist
  const projCol = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
  if (!projCol.some((c) => c.name === "projectSlug")) {
    db.exec("ALTER TABLE tasks ADD COLUMN projectSlug TEXT");
    db.exec("CREATE INDEX IF NOT EXISTS idx_tasks_projectSlug ON tasks(projectSlug)");
  }

  // Migration: add needsInput column if it doesn't exist
  const needsCol = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
  if (!needsCol.some((c) => c.name === "needsInput")) {
    db.exec("ALTER TABLE tasks ADD COLUMN needsInput INTEGER NOT NULL DEFAULT 0");
  }

  // Migration: add claudeSessionId column for --resume support
  const sessionCol = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
  if (!sessionCol.some((c) => c.name === "claudeSessionId")) {
    db.exec("ALTER TABLE tasks ADD COLUMN claudeSessionId TEXT");
  }

  // Migration: add contextSources column — JSON of what context was loaded at task start
  const ctxCol = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
  if (!ctxCol.some((c) => c.name === "contextSources")) {
    db.exec("ALTER TABLE tasks ADD COLUMN contextSources TEXT");
  }

  // Migration: add phaseNumber and gsdStep columns for GSD sub-tasks
  const phaseCol = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
  if (!phaseCol.some((c) => c.name === "phaseNumber")) {
    db.exec("ALTER TABLE tasks ADD COLUMN phaseNumber INTEGER");
  }
  if (!phaseCol.some((c) => c.name === "gsdStep")) {
    db.exec("ALTER TABLE tasks ADD COLUMN gsdStep TEXT CHECK (gsdStep IN ('discuss', 'plan', 'execute', 'verify'))");
  }

  // Migration: add cronJobSlug column for cron-to-task linking
  const cronCol = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
  if (!cronCol.some((c) => c.name === "cronJobSlug")) {
    db.exec("ALTER TABLE tasks ADD COLUMN cronJobSlug TEXT");
    db.exec("CREATE INDEX IF NOT EXISTS idx_tasks_cronJobSlug ON tasks(cronJobSlug)");
  }

  // Migration: add claudePid column for process-alive reaper
  const pidCol = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
  if (!pidCol.some((c) => c.name === "claudePid")) {
    db.exec("ALTER TABLE tasks ADD COLUMN claudePid INTEGER");
  }

  // Migration: add taskId column to cron_runs for linking runs to task outputs
  const cronRunCols = db.prepare("PRAGMA table_info(cron_runs)").all() as Array<{ name: string }>;
  if (!cronRunCols.some((c) => c.name === "taskId")) {
    db.exec("ALTER TABLE cron_runs ADD COLUMN taskId TEXT");
  }

  // Migration: add trigger column to cron_runs for manual vs scheduled distinction
  const cronRunTriggerCol = db.prepare("PRAGMA table_info(cron_runs)").all() as Array<{ name: string }>;
  if (!cronRunTriggerCol.some((c) => c.name === "trigger")) {
    db.exec("ALTER TABLE cron_runs ADD COLUMN trigger TEXT DEFAULT 'scheduled'");
  }

  if (!cronRunsSupportsTimeout(db)) {
    migrateCronRunsForTimeout(db);
  }

  // Migration: add files_json and extracted_content columns to chat_messages
  // so multi-turn chat can preserve attachment context across turns.
  {
    const chatMsgCols = db.prepare("PRAGMA table_info(chat_messages)").all() as Array<{ name: string }>;
    if (!chatMsgCols.some((c) => c.name === "files_json")) {
      db.exec("ALTER TABLE chat_messages ADD COLUMN files_json TEXT DEFAULT '[]'");
    }
    if (!chatMsgCols.some((c) => c.name === "extracted_content")) {
      db.exec("ALTER TABLE chat_messages ADD COLUMN extracted_content TEXT");
    }
  }

  // Migration: add permissionMode column for controlling Claude CLI permission mode per task
  const permCol = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
  if (!permCol.some((c) => c.name === "permissionMode")) {
    db.exec("ALTER TABLE tasks ADD COLUMN permissionMode TEXT DEFAULT 'bypassPermissions'");
  }
  if (!permCol.some((c) => c.name === "executionPermissionMode")) {
    db.exec("ALTER TABLE tasks ADD COLUMN executionPermissionMode TEXT DEFAULT 'bypassPermissions'");
  }

  // Fix cron tasks that were incorrectly stored with 'default' permission mode
  db.exec("UPDATE tasks SET permissionMode = 'bypassPermissions' WHERE cronJobSlug IS NOT NULL AND permissionMode = 'default'");
  db.exec("UPDATE tasks SET permissionMode = 'bypassPermissions' WHERE permissionMode = 'auto'");
  db.exec("UPDATE tasks SET executionPermissionMode = permissionMode WHERE executionPermissionMode IS NULL OR executionPermissionMode = ''");

  // Normalize stored permission modes so UI and execution share the same canonical values
  const taskPermissionRows = db.prepare(
    "SELECT id, permissionMode, executionPermissionMode FROM tasks"
  ).all() as Array<{ id: string; permissionMode: string | null; executionPermissionMode: string | null }>;
  const updateTaskPerms = db.prepare(
    "UPDATE tasks SET permissionMode = ?, executionPermissionMode = ? WHERE id = ?"
  );
  for (const row of taskPermissionRows) {
    const normalizedPermission = normalizePermissionMode(row.permissionMode, "bypassPermissions");
    const normalizedExecution = getExecutionPermissionMode(row.executionPermissionMode ?? row.permissionMode, "bypassPermissions");
    if (normalizedPermission !== row.permissionMode || normalizedExecution !== row.executionPermissionMode) {
      updateTaskPerms.run(normalizedPermission, normalizedExecution, row.id);
    }
  }

  // Migration: add priority column (schema was updated without migration)
  {
    const priCol = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
    if (!priCol.some((c) => c.name === "priority")) {
      db.exec("ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'none' CHECK (priority IN ('none', 'urgent', 'high', 'normal', 'low'))");
    }
    if (!priCol.some((c) => c.name === "dueDate")) {
      db.exec("ALTER TABLE tasks ADD COLUMN dueDate TEXT");
    }
    if (!priCol.some((c) => c.name === "startDate")) {
      db.exec("ALTER TABLE tasks ADD COLUMN startDate TEXT");
    }
  }

  // Migration: add model column for selecting Claude model per task
  const modelCol = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
  if (!modelCol.some((c) => c.name === "model")) {
    db.exec("ALTER TABLE tasks ADD COLUMN model TEXT");
  }

  // Migration: add conversationId column to tasks for autonomous mode linkage
  const convCol = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
  if (!convCol.some((c) => c.name === "conversationId")) {
    db.exec("ALTER TABLE tasks ADD COLUMN conversationId TEXT");
    db.exec("CREATE INDEX IF NOT EXISTS idx_tasks_conversationId ON tasks(conversationId)");
  }

  // Migration: add originMessageId column to tasks
  if (!convCol.some((c) => c.name === "originMessageId")) {
    db.exec("ALTER TABLE tasks ADD COLUMN originMessageId TEXT");
  }

  // Migration: add teamId column to tasks for Claude teams
  if (!convCol.some((c) => c.name === "teamId")) {
    db.exec("ALTER TABLE tasks ADD COLUMN teamId TEXT");
  }

  // Migration: add coordinationLevel column to tasks
  if (!convCol.some((c) => c.name === "coordinationLevel")) {
    db.exec("ALTER TABLE tasks ADD COLUMN coordinationLevel TEXT");
  }

  // Migration: add lastReplyAt column — tracks when the user last interacted
  const replyAtCol = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
  if (!replyAtCol.some((c) => c.name === "lastReplyAt")) {
    db.exec("ALTER TABLE tasks ADD COLUMN lastReplyAt TEXT");
  }

  // Migration: add surfacedToConversation to task_logs
  const logSurfCol = db.prepare("PRAGMA table_info(task_logs)").all() as Array<{ name: string }>;
  if (!logSurfCol.some((c) => c.name === "surfacedToConversation")) {
    db.exec("ALTER TABLE task_logs ADD COLUMN surfacedToConversation INTEGER DEFAULT 0");
  }

  // Migration: add goalGroup column for semantic task clustering
  const goalCol = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
  if (!goalCol.some((c) => c.name === "goalGroup")) {
    db.exec("ALTER TABLE tasks ADD COLUMN goalGroup TEXT");
    db.exec("CREATE INDEX IF NOT EXISTS idx_tasks_goalGroup ON tasks(goalGroup)");
  }

  // Migration: add tag column for user-defined project tagging
  if (!goalCol.some((c) => c.name === "tag")) {
    db.exec("ALTER TABLE tasks ADD COLUMN tag TEXT");
    db.exec("CREATE INDEX IF NOT EXISTS idx_tasks_tag ON tasks(tag)");
  }

  // Migration: add pinnedAt column for pinning tasks to the top of goals
  if (!goalCol.some((c) => c.name === "pinnedAt")) {
    db.exec("ALTER TABLE tasks ADD COLUMN pinnedAt TEXT");
  }

  // Migration: add questionSpec + questionAnswers columns to task_logs for
  // the structured-question system (pre- and mid-execution).
  const logCols = db.prepare("PRAGMA table_info(task_logs)").all() as Array<{ name: string }>;
  if (!logCols.some((c) => c.name === "questionSpec")) {
    db.exec("ALTER TABLE task_logs ADD COLUMN questionSpec TEXT");
  }
  if (!logCols.some((c) => c.name === "questionAnswers")) {
    db.exec("ALTER TABLE task_logs ADD COLUMN questionAnswers TEXT");
  }

  // Migration: older installs have a CHECK constraint on task_logs.type that
  // doesn't include 'structured_question'. SQLite can't alter CHECK
  // constraints in place, so recreate the table if needed.
  try {
    const tableSql = db
      .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'task_logs'")
      .get() as { sql: string } | undefined;
    if (tableSql && !tableSql.sql.includes("structured_question")) {
      console.log("[db] Migrating task_logs CHECK constraint to include structured_question");
      db.exec("BEGIN");
      try {
        db.exec(`CREATE TABLE task_logs_new (
          id TEXT PRIMARY KEY,
          taskId TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('text', 'tool_use', 'tool_result', 'question', 'structured_question', 'user_reply', 'system')),
          timestamp TEXT NOT NULL,
          content TEXT NOT NULL DEFAULT '',
          toolName TEXT,
          toolArgs TEXT,
          toolResult TEXT,
          isCollapsed INTEGER DEFAULT 0,
          surfacedToConversation INTEGER DEFAULT 0,
          questionSpec TEXT,
          questionAnswers TEXT,
          FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
        )`);
        // Copy data — use only columns known to exist in both tables
        const oldCols = db.prepare("PRAGMA table_info(task_logs)").all() as Array<{ name: string }>;
        const colNames = oldCols.map((c) => c.name);
        const shared = [
          "id", "taskId", "type", "timestamp", "content",
          "toolName", "toolArgs", "toolResult", "isCollapsed",
          "surfacedToConversation", "questionSpec", "questionAnswers",
        ].filter((c) => colNames.includes(c));
        const colList = shared.join(", ");
        db.exec(`INSERT INTO task_logs_new (${colList}) SELECT ${colList} FROM task_logs`);
        db.exec("DROP TABLE task_logs");
        db.exec("ALTER TABLE task_logs_new RENAME TO task_logs");
        db.exec("CREATE INDEX IF NOT EXISTS idx_task_logs_taskId ON task_logs(taskId)");
        db.exec("COMMIT");
      } catch (err) {
        db.exec("ROLLBACK");
        throw err;
      }
    }
  } catch (err) {
    console.error("[db] Failed to migrate task_logs CHECK constraint:", err);
  }

  // Migration: add permissionMode column to task_logs — records which mode was active per user reply
  try {
    db.exec("ALTER TABLE task_logs ADD COLUMN permissionMode TEXT");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/duplicate column/i.test(msg)) throw err;
  }

  // Migration: add dependsOnTaskIds column — JSON array of task IDs this task depends on
  try {
    db.exec("ALTER TABLE tasks ADD COLUMN dependsOnTaskIds TEXT");
  } catch (err) {
    // SQLite doesn't support IF NOT EXISTS on ADD COLUMN — swallow duplicate column error
    const msg = err instanceof Error ? err.message : String(err);
    if (!/duplicate column/i.test(msg)) throw err;
  }

// Migration: add startSnapshot column for diff-aware Files tab
  try {
    db.exec("ALTER TABLE tasks ADD COLUMN startSnapshot TEXT");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/duplicate column/i.test(msg)) throw err;
  }

  // ── ClickUp Clone Migrations ──────────────────────────────────────

  // Migration: add priority column
  try {
    db.exec("ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'none'");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/duplicate column/i.test(msg)) throw err;
  }

  // Migration: add dueDate column
  try {
    db.exec("ALTER TABLE tasks ADD COLUMN dueDate TEXT");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/duplicate column/i.test(msg)) throw err;
  }

  // Migration: add startDate column
  try {
    db.exec("ALTER TABLE tasks ADD COLUMN startDate TEXT");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/duplicate column/i.test(msg)) throw err;
  }

  // Migration: create tags table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366f1',
      clientId TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  try { db.exec("CREATE INDEX IF NOT EXISTS idx_tags_clientId ON tags(clientId)"); } catch { /* */ }

  // Migration: create task_tags junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_tags (
      taskId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      PRIMARY KEY (taskId, tagId),
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);
  try { db.exec("CREATE INDEX IF NOT EXISTS idx_task_tags_taskId ON task_tags(taskId)"); } catch { /* */ }
  try { db.exec("CREATE INDEX IF NOT EXISTS idx_task_tags_tagId ON task_tags(tagId)"); } catch { /* */ }

  // Migration: create task_comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_comments (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);
  try { db.exec("CREATE INDEX IF NOT EXISTS idx_task_comments_taskId ON task_comments(taskId)"); } catch { /* */ }

  db.exec(`
    CREATE TABLE IF NOT EXISTS approval_requests (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('permission')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
      title TEXT NOT NULL,
      description TEXT,
      toolName TEXT NOT NULL,
      inputJson TEXT NOT NULL,
      decision TEXT,
      decisionMessage TEXT,
      createdAt TEXT NOT NULL,
      resolvedAt TEXT,
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);
  db.exec("CREATE INDEX IF NOT EXISTS idx_approval_requests_taskId ON approval_requests(taskId)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status)");

  // ── Agentic OS Memory System Migrations ──────────────────────────────

  // agent_memories table (already in schema.sql, but ensure it exists)
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS agent_memories (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        scope TEXT NOT NULL DEFAULT 'personal' CHECK (scope IN ('personal', 'shared', 'project')),
        category TEXT NOT NULL DEFAULT 'general',
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        metadata TEXT,
        source_session_id TEXT,
        source_message_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      )
    `);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/already exists/i.test(msg)) throw err;
  }

  // Indexes for agent_memories
  const memIndexes = [
    "CREATE INDEX IF NOT EXISTS idx_agent_memories_agent_id ON agent_memories(agent_id)",
    "CREATE INDEX IF NOT EXISTS idx_agent_memories_scope ON agent_memories(scope)",
    "CREATE INDEX IF NOT EXISTS idx_agent_memories_category ON agent_memories(category)",
    "CREATE INDEX IF NOT EXISTS idx_agent_memories_created_at ON agent_memories(created_at)",
  ];
  for (const idx of memIndexes) {
    try { db.exec(idx); } catch { /* ignore duplicate */ }
  }

  // agent_memory_links table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS agent_memory_links (
        id TEXT PRIMARY KEY,
        source_memory_id TEXT NOT NULL,
        target_agent_id TEXT NOT NULL,
        permission TEXT NOT NULL DEFAULT 'read' CHECK (permission IN ('read', 'write', 'admin')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (source_memory_id) REFERENCES agent_memories(id) ON DELETE CASCADE,
        FOREIGN KEY (target_agent_id) REFERENCES agents(id) ON DELETE CASCADE,
        UNIQUE(source_memory_id, target_agent_id)
      )
    `);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/already exists/i.test(msg)) throw err;
  }

  try { db.exec("CREATE INDEX IF NOT EXISTS idx_agent_memory_links_target ON agent_memory_links(target_agent_id)"); } catch { /* */ }
  try { db.exec("CREATE INDEX IF NOT EXISTS idx_agent_memory_links_source ON agent_memory_links(source_memory_id)"); } catch { /* */ }

  // ── FTS5 Full-Text Search on chat_messages ───────────────────────────
  // Create FTS5 virtual tables for full-text search across conversations.
  // FTS5 uses external content tables linked to chat_messages for zero-copy indexing.
  try {
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
        content,
        tokenize='unicode61'
      )
    `);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // FTS5 may not be available in all SQLite builds — log but don't crash
    if (/no such module/i.test(msg)) {
      console.warn("[db] FTS5 not available — session search will use LIKE fallback");
    } else if (!/already exists/i.test(msg)) {
      throw err;
    }
  }

  // FTS5 trigram tokenizer for CJK / substring search
  try {
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts_trigram USING fts5(
        content,
        tokenize='trigram'
      )
    `);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/no such module/i.test(msg)) {
      // Expected if FTS5 not available
    } else if (!/already exists/i.test(msg)) {
      throw err;
    }
  }

  // FTS5 content sync triggers: keep FTS index in sync with chat_messages
  try {
    // Check if trigger already exists
    const triggerExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'trigger' AND name = 'messages_fts_insert'"
    ).get();

    if (!triggerExists) {
      db.exec(`
        CREATE TRIGGER messages_fts_insert AFTER INSERT ON chat_messages BEGIN
          INSERT INTO messages_fts(rowid, content) VALUES (new.id, new.content);
        END
      `);
      db.exec(`
        CREATE TRIGGER messages_fts_delete AFTER DELETE ON chat_messages BEGIN
          INSERT INTO messages_fts(messages_fts, rowid, content) VALUES ('delete', old.id, old.content);
        END
      `);
      db.exec(`
        CREATE TRIGGER messages_fts_update AFTER UPDATE ON chat_messages BEGIN
          INSERT INTO messages_fts(messages_fts, rowid, content) VALUES ('delete', old.id, old.content);
          INSERT INTO messages_fts(rowid, content) VALUES (new.id, new.content);
        END
      `);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/already exists/i.test(msg) && !/no such module/i.test(msg)) {
      console.warn("[db] FTS5 trigger creation failed:", msg);
    }
  }

  // Backfill FTS index for existing messages (only if FTS table exists and is empty)
  try {
    const ftsCount = db.prepare("SELECT COUNT(*) as cnt FROM messages_fts").get() as { cnt: number } | undefined;
    if (ftsCount && ftsCount.cnt === 0) {
      const msgCount = db.prepare("SELECT COUNT(*) as cnt FROM chat_messages").get() as { cnt: number };
      if (msgCount.cnt > 0) {
        console.log(`[db] Backfilling FTS index with ${msgCount.cnt} existing messages...`);
        db.exec(`
          INSERT INTO messages_fts(rowid, content)
          SELECT id, content FROM chat_messages
        `);
      }
    }
} catch (err) {
    // FTS5 might not be available; this is non-fatal
  }

  // ── Phase 2.3: Board Columns ──────────────────────────────────
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS board_columns (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        statuses TEXT NOT NULL DEFAULT '[]',
        wipLimit INTEGER,
        columnOrder INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    // Seed default columns if table is empty
    const colCount = db.prepare("SELECT COUNT(*) as cnt FROM board_columns").get() as { cnt: number };
    if (colCount.cnt === 0) {
      const insert = db.prepare(
        "INSERT INTO board_columns (id, title, statuses, wipLimit, columnOrder) VALUES (?, ?, ?, ?, ?)"
      );
      insert.run("col_backlog", "Backlog", JSON.stringify(["backlog"]), null, 0);
      insert.run("col_in_progress", "In Progress", JSON.stringify(["queued", "running"]), 5, 1);
      insert.run("col_review", "Review", JSON.stringify(["review"]), null, 2);
      insert.run("col_done", "Done", JSON.stringify(["done"]), null, 3);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/already exists/i.test(msg)) throw err;
  }

  // ── Phase 3.1: FTS5 Search Indexes ────────────────────────────
  // Tasks FTS (content-sync with triggers defined in schema.sql)
  try {
    db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts USING fts5(
      title, description,
      content='tasks',
      content_rowid='rowid',
      tokenize='unicode61'
    )`);
    // Backfill existing data
    const taskFtsCount = db.prepare("SELECT COUNT(*) as cnt FROM tasks_fts").get() as { cnt: number } | undefined;
    if (taskFtsCount && taskFtsCount.cnt === 0) {
      const taskCount = db.prepare("SELECT COUNT(*) as cnt FROM tasks").get() as { cnt: number };
      if (taskCount.cnt > 0) {
        db.exec("INSERT INTO tasks_fts(tasks_fts) VALUES('rebuild')");
      }
    }
  } catch (err) {
    // FTS5 might not be available; non-fatal
  }

  // Task comments FTS
  try {
    db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS task_comments_fts USING fts5(
      content,
      content='task_comments',
      content_rowid='rowid',
      tokenize='unicode61'
    )`);
    const commentFtsCount = db.prepare("SELECT COUNT(*) as cnt FROM task_comments_fts").get() as { cnt: number } | undefined;
    if (commentFtsCount && commentFtsCount.cnt === 0) {
      const commentCount = db.prepare("SELECT COUNT(*) as cnt FROM task_comments").get() as { cnt: number };
      if (commentCount.cnt > 0) {
        db.exec("INSERT INTO task_comments_fts(task_comments_fts) VALUES('rebuild')");
      }
    }
  } catch (err) {
    // FTS5 might not be available; non-fatal
  }

  // ── Phase 3.2: Saved Views ────────────────────────────────────
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS saved_views (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      filters TEXT NOT NULL DEFAULT '{}',
      sort TEXT NOT NULL DEFAULT 'createdAt',
      viewType TEXT NOT NULL DEFAULT 'board' CHECK (viewType IN ('board', 'list', 'calendar')),
      clientId TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/already exists/i.test(msg)) throw err;
  }

  // ── Phase 3.3: Notifications ───────────────────────────────────
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('task_assigned', 'task_completed', 'task_failed', 'task_comment', 'task_status_change', 'system')),
      title TEXT NOT NULL,
      message TEXT,
      taskId TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE SET NULL
    )`);
    db.exec("CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_notifications_createdAt ON notifications(createdAt)");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/already exists/i.test(msg)) throw err;
  }


  // -- Swarm Multi-Agent tables migration --
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS swarms (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, workspace_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle','coordinating','building','reviewing','complete','error')),
      layout TEXT NOT NULL DEFAULT 'mosaic' CHECK (layout IN ('mosaic','columns','focus')),
      coordinator_id TEXT, project_slug TEXT DEFAULT '',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_swarms_status ON swarms(status)`);

    db.exec(`CREATE TABLE IF NOT EXISTS swarm_panes (
      id TEXT PRIMARY KEY, swarm_id TEXT NOT NULL REFERENCES swarms(id) ON DELETE CASCADE,
      agent_id TEXT NOT NULL, role TEXT NOT NULL,
      grid_x INTEGER DEFAULT 0, grid_y INTEGER DEFAULT 0,
      grid_w INTEGER DEFAULT 1, grid_h INTEGER DEFAULT 1,
      provider TEXT DEFAULT 'custom',
      status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle','running','waiting','error','done')),
      current_task TEXT DEFAULT '', branch_name TEXT DEFAULT '',
      worktree_path TEXT DEFAULT '', pid INTEGER,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_swarm_panes_swarm_id ON swarm_panes(swarm_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_swarm_panes_role ON swarm_panes(role)`);

    db.exec(`CREATE TABLE IF NOT EXISTS swarm_mailbox (
      id TEXT PRIMARY KEY, swarm_id TEXT NOT NULL REFERENCES swarms(id) ON DELETE CASCADE,
      sender_pane_id TEXT NOT NULL, recipient_pane_id TEXT,
      message_type TEXT NOT NULL DEFAULT 'request',
      subject TEXT NOT NULL, body TEXT NOT NULL, priority INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','read','acted_upon','closed')),
      created_at TEXT NOT NULL, read_at TEXT
    )`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_swarm_mailbox_swarm_id ON swarm_mailbox(swarm_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_swarm_mailbox_recipient ON swarm_mailbox(recipient_pane_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_swarm_mailbox_status ON swarm_mailbox(status)`);

    db.exec(`CREATE TABLE IF NOT EXISTS swarm_worktrees (
      id TEXT PRIMARY KEY, swarm_id TEXT NOT NULL REFERENCES swarms(id) ON DELETE CASCADE,
      pane_id TEXT NOT NULL, repo_path TEXT NOT NULL, branch_name TEXT NOT NULL,
      worktree_path TEXT NOT NULL, base_branch TEXT DEFAULT 'main',
      is_dirty INTEGER DEFAULT 0, last_synced_at TEXT, created_at TEXT NOT NULL,
      UNIQUE(pane_id)
    )`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_swarm_worktrees_swarm_id ON swarm_worktrees(swarm_id)`);

    db.exec(`CREATE TABLE IF NOT EXISTS swarm_chat_messages (
      id TEXT PRIMARY KEY, swarm_id TEXT NOT NULL REFERENCES swarms(id) ON DELETE CASCADE,
      pane_id TEXT, role TEXT NOT NULL CHECK (role IN ('user','agent','coordinator','system')),
      content TEXT NOT NULL, metadata TEXT, created_at TEXT NOT NULL
    )`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_swarm_chat_swarm_id ON swarm_chat_messages(swarm_id)`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/already exists/i.test(msg)) throw err;
  }

  return db;
}
