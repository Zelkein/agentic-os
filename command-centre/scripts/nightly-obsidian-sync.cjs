#!/usr/bin/env node
/**
 * nightly-obsidian-sync.cjs — Cron script: syncs today's completed tasks to Obsidian.
 * Runs via cron job scheduler. Best-effort, non-blocking.
 *
 * Requirements:
 * - OBSIDIAN_VAULT_PATH set in .env (or auto-detected)
 * - OBSIDIAN_SYNC_ENABLED=true
 */
const path = require("path");
const fs = require("fs");

// Resolve agentic-os root
function findRoot() {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "AGENTS.md")) || fs.existsSync(path.join(dir, "CLAUDE.md"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(__dirname, "..", "..");
}

const ROOT = findRoot();
const DB_PATH = path.join(ROOT, ".command-centre", "data.db");

function findObsidianVault() {
  if (process.env.OBSIDIAN_VAULT_PATH && fs.existsSync(process.env.OBSIDIAN_VAULT_PATH)) {
    return process.env.OBSIDIAN_VAULT_PATH;
  }
  const home = process.env.HOME || "";
  const candidates = [
    path.join(home, "obsidian"),
    path.join(home, "Documents", "Obsidian Vault"),
    path.join("/mnt/c/Users", process.env.USERNAME || "Frank", "Documents", "Obsidian Vault"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function escapeYaml(s) {
  return String(s).replace(/"/g, '\\"').replace(/\n/g, " ").replace(/\r/g, "");
}

async function main() {
  // Check if sync is enabled
  if (!fs.existsSync(DB_PATH)) {
    console.log("No database found at", DB_PATH);
    process.exit(0);
  }

  const vaultPath = findObsidianVault();
  if (!vaultPath) {
    console.log("No Obsidian vault found. Set OBSIDIAN_VAULT_PATH in .env");
    process.exit(0);
  }

  // Open DB and query today's completed tasks
  const Database = require("better-sqlite3");
  const db = new Database(DB_PATH, { readonly: true });

  const today = new Date().toISOString().slice(0, 10);
  const tasks = db.prepare(`
    SELECT id, title, status, durationMs, costUsd, model, level, errorMessage, completedAt
    FROM tasks
    WHERE status = 'done' AND completedAt >= ?
    ORDER BY completedAt DESC
  `).all(today);

  db.close();

  if (tasks.length === 0) {
    console.log(`No completed tasks for ${today}`);
    process.exit(0);
  }

  // Write each task to Obsidian vault
  const vaultDir = path.join(vaultPath, "Agentic OS");
  fs.mkdirSync(vaultDir, { recursive: true });

  let synced = 0;
  for (const task of tasks) {
    const slug = task.title
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
    const filename = `${today}-${slug}.md`;
    const filePath = path.join(vaultDir, filename);

    // Skip if already synced
    if (fs.existsSync(filePath)) {
      synced++;
      continue;
    }

    const duration = task.durationMs ? `${Math.round(task.durationMs / 1000)}s` : "N/A";
    const cost = task.costUsd ? `$${Number(task.costUsd).toFixed(4)}` : "N/A";

    const content = [
      "---",
      `date: ${today}`,
      `title: "${escapeYaml(task.title)}"`,
      "tags:",
      "  - agentic-os",
      "  - task",
      `  - ${task.level || "task"}`,
      "---",
      "",
      `## ${task.title}`,
      "",
      `**Status:** ${task.status}`,
      `**Level:** ${task.level || "task"}`,
      `**Duration:** ${duration}`,
      `**Cost:** ${cost}`,
      task.model ? `**Model:** ${task.model}` : "",
      "",
      task.errorMessage ? `### Error\n\n\`\`\`\n${task.errorMessage}\n\`\`\`\n` : "",
      "---",
      `*Nightly auto-sync — ${new Date().toISOString()}*`,
    ].filter(Boolean).join("\n");

    fs.writeFileSync(filePath, content, "utf-8");
    synced++;
  }

  console.log(`Synced ${synced}/${tasks.length} tasks to Obsidian vault: ${vaultDir}`);
}

main().catch((err) => {
  console.error("Nightly sync failed:", err.message);
  process.exit(1);
});
