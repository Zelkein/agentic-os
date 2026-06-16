import 'server-only';
import type { PaneProvider } from '@/types/swarm';

/**
 * Provider resolution for each pane.
 * Maps pane provider strings to actual command-line binaries.
 */

export interface ProviderInfo {
  label: string;
  command: string;
  args: string[];
  color: string;
  env?: Record<string, string>;
}

export const PROVIDER_MAP: Record<string, ProviderInfo> = {
  claude: {
    label: 'Claude Code',
    command: 'claude',
    args: ['--acp', '--stdio'],
    color: '#d97706',
  },
  codex: {
    label: 'Codex CLI',
    command: 'codex',
    args: [],
    color: '#059669',
  },
  gemini: {
    label: 'Gemini CLI',
    command: 'gemini',
    args: [],
    color: '#2563eb',
  },
  kimi: {
    label: 'Kimi',
    command: 'kimi',
    args: [],
    color: '#7c3aed',
  },
  opencode: {
    label: 'OpenCode',
    command: 'opencode',
    args: ['--acp', '--stdio'],
    color: '#dc2626',
  },
  custom: {
    label: 'Custom (Env)',
    command: '',
    args: [],
    color: '#64748b',
  },
};

export function getProviderInfo(provider: string): ProviderInfo {
  return PROVIDER_MAP[provider] ?? PROVIDER_MAP.custom;
}

export function getProviderColor(provider: string): string {
  return getProviderInfo(provider).color;
}
