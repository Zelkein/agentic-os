/**
 * obsidian-sync.ts — Sync task outputs and summaries to an Obsidian vault.
 *
 * Reads vault path from env (OBSIDIAN_VAULT_PATH).
 * Writes markdown files organized by date: vault/Agentic OS/YYYY-MM-DD-title.md
 */
import fs from "fs";
import path from "path";

/** Escape a string for safe YAML frontmatter inclusion */
function escapeYaml(s: string): string {
  return s.replace(/"/g, '\\"').replace(/\n/g, " ").replace(/\r/g, "");
}

interface ObsidianEntry {
  title: string;
  body: string;
  tags?: string[];
  date?: string; // YYYY-MM-DD, defaults to today
  folder?: string; // subfolder in vault, defaults to "Agentic OS"
}

let cachedVaultPath: string | null = null;

/**
 * Get the Obsidian vault path from environment or settings.
 * Falls back to AGENTIC_OS_DIR/obsidian if not configured.
 */
export function getObsidianVaultPath(): string | null {
  if (cachedVaultPath) return cachedVaultPath;

  const envPath = process.env.OBSIDIAN_VAULT_PATH;
  if (envPath && fs.existsSync(envPath)) {
    cachedVaultPath = envPath;
    return cachedVaultPath;
  }

  // Try common Obsidian locations
  const home = process.env.HOME || process.env.USERPROFILE || "";
  const candidates = [
    path.join(home, "obsidian"),
    path.join(home, "Documents", "Obsidian Vault"),
    path.join(home, "Documents", "obsidian-vault"),
    path.join(home, "OneDrive", "Documents", "Obsidian Vault"),
    path.join("/mnt/c", "Users", process.env.USERNAME || "", "Documents", "Obsidian Vault"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      cachedVaultPath = candidate;
      return cachedVaultPath;
    }
  }

  return null;
}

/**
 * Check if Obsidian sync is enabled (env var or file flag).
 */
export function isObsidianSyncEnabled(): boolean {
  if (process.env.OBSIDIAN_SYNC_ENABLED === "false") return false;
  return process.env.OBSIDIAN_SYNC_ENABLED === "true" || getObsidianVaultPath() !== null;
}

/**
 * Write an entry to the Obsidian vault as a markdown file.
 * Returns the file path written, or null if sync is not available.
 */
export function writeObsidianEntry(entry: ObsidianEntry): string | null {
  if (!isObsidianSyncEnabled()) return null;

  const vaultPath = getObsidianVaultPath();
  if (!vaultPath) return null;

  const date = entry.date || new Date().toISOString().slice(0, 10);
  const folder = entry.folder || "Agentic OS";
  const slug = entry.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const filename = `${date}-${slug}.md`;

  const dir = path.join(vaultPath, folder);
  fs.mkdirSync(dir, { recursive: true });

  // Build frontmatter
  const tags = entry.tags?.length
    ? `tags:\n${entry.tags.map((t) => `  - ${t}`).join("\n")}`
    : "";

  const frontmatter = [
    "---",
    `date: ${date}`,
    `title: "${escapeYaml(entry.title)}"`,
    tags || `tags:\n  - agentic-os`,
    "---",
  ].join("\n");

  const content = `${frontmatter}\n\n${entry.body}`;
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content, "utf-8");

  return filePath;
}

/**
 * Sync a completed task to Obsidian.
 */
export function syncTaskToObsidian(task: {
  id: string;
  title: string;
  status: string;
  durationMs?: number | null;
  costUsd?: number | null;
  model?: string | null;
  errorMessage?: string | null;
  level?: string;
  completedAt?: string | null;
  outputSummary?: string | null;
}): string | null {
  if (!isObsidianSyncEnabled()) return null;

  const duration = task.durationMs
    ? `${Math.round(task.durationMs / 1000)}s`
    : "unknown";
  const cost = task.costUsd ? `$${task.costUsd.toFixed(4)}` : "N/A";

  const body = [
    `## ${task.title}`,
    "",
    `**Status:** ${task.status}`,
    `**Level:** ${task.level || "task"}`,
    `**Duration:** ${duration}`,
    `**Cost:** ${cost}`,
    task.model ? `**Model:** ${task.model}` : "",
    "",
    task.outputSummary ? `### Output\n\n${task.outputSummary}\n\n` : "",
    task.errorMessage ? `### Error\n\n\`\`\`\n${task.errorMessage}\n\`\`\`\n\n` : "",
    "---",
    `*Auto-synced from Agentic OS | ID: \`${task.id}\`*`,
  ]
    .filter(Boolean)
    .join("\n");

  const tags = [
    "agentic-os",
    "task",
    task.status,
    task.level || "task",
    task.model?.replace(/[^a-z0-9]/g, "-") || "",
  ].filter(Boolean);

  return writeObsidianEntry({
    title: task.title,
    body,
    tags,
    date: task.completedAt
      ? new Date(task.completedAt).toISOString().slice(0, 10)
      : undefined,
  });
}

/**
 * Clear the cached vault path (useful for testing or re-config).
 */
export function clearObsidianCache(): void {
  cachedVaultPath = null;
}
