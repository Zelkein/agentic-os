// Client-safe color/mapping helpers for Swarm UI components.
// Replicates the color maps from swarm-roles.ts and swarm-provider.ts
// without the 'server-only' directive.

import type { SwarmRole, PaneProvider } from '@/types/swarm';

// ── Role colors (mirrors swarm-roles.ts) ──────────────────────────

export const ROLE_COLORS: Record<SwarmRole, string> = {
  coordinator: '#a78bfa',
  builder: '#60a5fa',
  scout: '#34d399',
  reviewer: '#fbbf24',
  custom: '#94a3b8',
};

export const ROLE_LABELS: Record<SwarmRole, string> = {
  coordinator: 'Coordinator',
  builder: 'Builder',
  scout: 'Scout',
  reviewer: 'Reviewer',
  custom: 'Custom',
};

export function getRoleColor(role: SwarmRole): string {
  return ROLE_COLORS[role] ?? ROLE_COLORS.custom;
}

export function getRoleLabel(role: SwarmRole): string {
  return ROLE_LABELS[role] ?? ROLE_LABELS.custom;
}

// ── Provider colors (mirrors swarm-provider.ts) ───────────────────

export const PROVIDER_COLORS: Record<string, string> = {
  claude: '#d97706',
  codex: '#059669',
  gemini: '#2563eb',
  kimi: '#7c3aed',
  opencode: '#dc2626',
  custom: '#64748b',
};

export const PROVIDER_LABELS: Record<string, string> = {
  claude: 'Claude Code',
  codex: 'Codex CLI',
  gemini: 'Gemini CLI',
  kimi: 'Kimi',
  opencode: 'OpenCode',
  custom: 'Custom (Env)',
};

export function getProviderColor(provider: string): string {
  return PROVIDER_COLORS[provider] ?? PROVIDER_COLORS.custom;
}

export function getProviderLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? PROVIDER_LABELS.custom;
}

// ── Pane status colors ───────────────────────────────────────────

export const STATUS_COLORS: Record<string, string> = {
  idle: '#64748b',
  running: '#22c55e',
  waiting: '#eab308',
  error: '#ef4444',
  done: '#3b82f6',
};

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? STATUS_COLORS.idle;
}

// ── Mailbox message type colors ───────────────────────────────────

export const MESSAGE_TYPE_COLORS: Record<string, string> = {
  request: '#a78bfa',
  response: '#34d399',
  status_update: '#60a5fa',
  task_complete: '#22c55e',
  question: '#fbbf24',
  clarification: '#f97316',
  handoff: '#ec4899',
  broadcast: '#fbbf24',
};

export function getMessageTypeColor(messageType: string): string {
  return MESSAGE_TYPE_COLORS[messageType] ?? '#94a3b8';
}

// ── Swarm status colors ──────────────────────────────────────────

export const SWARM_STATUS_COLORS: Record<string, string> = {
  idle: '#64748b',
  coordinating: '#a78bfa',
  building: '#60a5fa',
  reviewing: '#fbbf24',
  complete: '#22c55e',
  error: '#ef4444',
};

export function getSwarmStatusColor(status: string): string {
  return SWARM_STATUS_COLORS[status] ?? SWARM_STATUS_COLORS.idle;
}
