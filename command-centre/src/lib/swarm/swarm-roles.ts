import 'server-only';
import type { SwarmRole, PaneProvider } from '@/types/swarm';

/**
 * Swarm role definitions and heuristics.
 * Roles: Coordinator, Builder, Scout, Reviewer, Custom
 */

export interface RoleCapability {
  label: string;
  description: string;
  defaultProvider: PaneProvider;
  color: string;
}

export const ROLE_DEFINITIONS: Record<SwarmRole, RoleCapability> = {
  coordinator: {
    label: 'Coordinator',
    description: 'Decomposes tasks, assigns work, collects results, integrates output. The conductor of the swarm.',
    defaultProvider: 'custom',
    color: '#a78bfa',
  },
  builder: {
    label: 'Builder',
    description: 'Writes code, creates assets, implements features. The workhorse.',
    defaultProvider: 'claude',
    color: '#60a5fa',
  },
  scout: {
    label: 'Scout',
    description: 'Explores codebase, researches, finds patterns, validates approaches before building.',
    defaultProvider: 'codex',
    color: '#34d399',
  },
  reviewer: {
    label: 'Reviewer',
    description: 'Reviews code, catches bugs, enforces standards, suggests improvements.',
    defaultProvider: 'gemini',
    color: '#fbbf24',
  },
  custom: {
    label: 'Custom',
    description: 'User-defined role with custom provider.',
    defaultProvider: 'custom',
    color: '#94a3b8',
  },
};

export function getRole(role: SwarmRole): RoleCapability {
  return ROLE_DEFINITIONS[role] ?? ROLE_DEFINITIONS.custom;
}

export function getRoleColor(role: SwarmRole): string {
  return getRole(role).color;
}

export function getDefaultProvider(role: SwarmRole): PaneProvider {
  return getRole(role).defaultProvider;
}
