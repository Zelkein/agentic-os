export type SwarmRole = 'coordinator' | 'builder' | 'scout' | 'reviewer' | 'custom';
export type SwarmLayout = 'mosaic' | 'columns' | 'focus';
export type PaneProvider = 'claude' | 'codex' | 'gemini' | 'kimi' | 'opencode' | 'custom';
export type PaneStatus = 'idle' | 'running' | 'waiting' | 'error' | 'done';
export type SwarmStatus = 'idle' | 'coordinating' | 'building' | 'reviewing' | 'complete' | 'error';
export type MailboxMessageType = 'request' | 'response' | 'status_update' | 'task_complete' | 'question' | 'clarification' | 'handoff' | 'broadcast';
export type MailboxStatus = 'pending' | 'read' | 'acted_upon' | 'closed';

export interface Swarm {
  id: string;
  name: string;
  workspaceId: string;
  status: SwarmStatus;
  layout: SwarmLayout;
  coordinatorId: string | null;
  projectSlug: string;
  createdAt: string;
  updatedAt: string;
}

export interface SwarmPane {
  id: string;
  swarmId: string;
  agentId: string;
  role: SwarmRole;
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
  provider: PaneProvider;
  status: PaneStatus;
  currentTask: string;
  branchName: string;
  worktreePath: string;
  pid: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SwarmMailboxMessage {
  id: string;
  swarmId: string;
  senderPaneId: string;
  recipientPaneId: string | null;
  messageType: MailboxMessageType;
  subject: string;
  body: string;
  priority: number;
  status: MailboxStatus;
  createdAt: string;
  readAt: string | null;
}

export interface SwarmWorktree {
  id: string;
  swarmId: string;
  paneId: string;
  repoPath: string;
  branchName: string;
  worktreePath: string;
  baseBranch: string;
  isDirty: number;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface SwarmChatMessage {
  id: string;
  swarmId: string;
  paneId: string | null;
  role: 'user' | 'agent' | 'coordinator' | 'system';
  content: string;
  metadata: string | null;
  createdAt: string;
}

export interface SwarmCreateRequest {
  name: string;
  workspaceId: string;
  projectSlug?: string;
  layout?: SwarmLayout;
}

export interface SwarmPaneCreateRequest {
  agentId: string;
  role: SwarmRole;
  provider?: PaneProvider;
}
