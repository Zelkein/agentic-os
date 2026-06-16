CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'queued', 'running', 'review', 'done')),
  level TEXT NOT NULL DEFAULT 'task' CHECK (level IN ('task', 'project', 'gsd')),
  parentId TEXT,
  columnOrder INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  costUsd REAL,
  tokensUsed INTEGER,
  durationMs INTEGER,
  activityLabel TEXT,
  errorMessage TEXT,
  startedAt TEXT,
  completedAt TEXT,
  phaseNumber INTEGER,
  gsdStep TEXT CHECK (gsdStep IN ('discuss', 'plan', 'execute', 'verify')),
  claudePid INTEGER,
  permissionMode TEXT DEFAULT 'bypassPermissions',
  executionPermissionMode TEXT DEFAULT 'bypassPermissions',
  model TEXT,
  dependsOnTaskIds TEXT,
  startSnapshot TEXT,
  priority TEXT NOT NULL DEFAULT 'none' CHECK (priority IN ('none', 'urgent', 'high', 'normal', 'low')),
  dueDate TEXT,
  startDate TEXT,
  FOREIGN KEY (parentId) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_parentId ON tasks(parentId);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Tags: color-coded labels for tasks
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  clientId TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tags_clientId ON tags(clientId);

-- Task-Tag junction: many-to-many
CREATE TABLE IF NOT EXISTS task_tags (
  taskId TEXT NOT NULL,
  tagId TEXT NOT NULL,
  PRIMARY KEY (taskId, tagId),
  FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_task_tags_taskId ON task_tags(taskId);
CREATE INDEX IF NOT EXISTS idx_task_tags_tagId ON task_tags(tagId);

-- Comments: activity log on tasks
CREATE TABLE IF NOT EXISTS task_comments (
  id TEXT PRIMARY KEY,
  taskId TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_task_comments_taskId ON task_comments(taskId);

CREATE TABLE IF NOT EXISTS task_outputs (
  id TEXT PRIMARY KEY,
  taskId TEXT NOT NULL,
  fileName TEXT NOT NULL,
  filePath TEXT NOT NULL,
  relativePath TEXT NOT NULL,
  extension TEXT NOT NULL DEFAULT '',
  sizeBytes INTEGER,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_task_outputs_taskId ON task_outputs(taskId);

CREATE TABLE IF NOT EXISTS cron_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jobSlug TEXT NOT NULL,
  taskId TEXT,
  startedAt TEXT NOT NULL,
  completedAt TEXT,
  result TEXT NOT NULL DEFAULT 'running' CHECK (result IN ('success', 'failure', 'timeout', 'running')),
  resultSource TEXT CHECK (resultSource IN ('observed', 'inferred')),
  completionReason TEXT,
  durationSec REAL,
  costUsd REAL,
  exitCode INTEGER,
  trigger TEXT DEFAULT 'scheduled',
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cron_runs_jobSlug ON cron_runs(jobSlug);
CREATE INDEX IF NOT EXISTS idx_cron_runs_startedAt ON cron_runs(startedAt);

CREATE TABLE IF NOT EXISTS task_logs (
  id TEXT PRIMARY KEY,
  taskId TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'tool_use', 'tool_result', 'question', 'structured_question', 'user_reply', 'system')),
  timestamp TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  toolName TEXT,
  toolArgs TEXT,
  toolResult TEXT,
  isCollapsed INTEGER DEFAULT 0,
  questionSpec TEXT,
  questionAnswers TEXT,
  FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_task_logs_taskId ON task_logs(taskId);

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
);
CREATE INDEX IF NOT EXISTS idx_approval_requests_taskId ON approval_requests(taskId);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);

-- Autonomous mode: conversations between user and orchestrator
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  clientId TEXT
);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- Autonomous mode: messages in a conversation
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  taskId TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'orchestrator', 'sub_agent', 'system')),
  content TEXT NOT NULL DEFAULT '',
  metadata TEXT,
  parentMessageId TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (parentMessageId) REFERENCES messages(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_conversationId ON messages(conversationId);
CREATE INDEX IF NOT EXISTS idx_messages_taskId ON messages(taskId);

-- Autonomous mode: orchestrator scoping decisions
CREATE TABLE IF NOT EXISTS agent_decisions (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  messageId TEXT,
  decisionType TEXT NOT NULL CHECK (decisionType IN ('scope', 'decompose', 'delegate', 'clarify', 'complete_inline')),
  reasoning TEXT,
  taskIds TEXT,
  level TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (messageId) REFERENCES messages(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_conversationId ON agent_decisions(conversationId);

-- First-class projects — tracks project status and links to tasks via slug
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'complete', 'archived')),
  level INTEGER NOT NULL DEFAULT 2,
  briefPath TEXT,
  goal TEXT,
  clientId TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Agents: reusable AI entities with system prompts and configurations
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  system_prompt TEXT,
  context TEXT,
  skills_json TEXT,
  workflows_json TEXT,
  llm_provider TEXT DEFAULT 'deepseek',
  llm_model TEXT DEFAULT 'deepseek-v4-flash',
  owner_email TEXT,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public')),
  allowed_users TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);
CREATE INDEX IF NOT EXISTS idx_agents_owner_email ON agents(owner_email);
CREATE INDEX IF NOT EXISTS idx_agents_created_by_visibility ON agents(created_by, visibility);

-- Users: team members with roles
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  role TEXT DEFAULT 'engineer' CHECK (role IN ('admin', 'engineer')),
  team_id TEXT,
  created_at TEXT NOT NULL
);

-- Agent access control: grant/revoke access to agents
CREATE TABLE IF NOT EXISTS agent_access (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  access_level TEXT DEFAULT 'view' CHECK (access_level IN ('view', 'edit', 'admin')),
  granted_at TEXT NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,
  UNIQUE(agent_id, user_email)
);
CREATE INDEX IF NOT EXISTS idx_agent_access_user_email ON agent_access(user_email);
CREATE INDEX IF NOT EXISTS idx_agent_access_agent_id ON agent_access(agent_id);

-- Agent templates: reusable agent definitions
CREATE TABLE IF NOT EXISTS agent_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  base_system_prompt TEXT,
  version TEXT DEFAULT 'v1',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(email) ON DELETE RESTRICT
);

-- Agent deployments: template instances per project
CREATE TABLE IF NOT EXISTS agent_deployments (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  project_id TEXT,
  system_prompt_override TEXT,
  active INTEGER DEFAULT 1,
  deployed_by TEXT NOT NULL,
  deployed_at TEXT NOT NULL,
  FOREIGN KEY (template_id) REFERENCES agent_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (deployed_by) REFERENCES users(email) ON DELETE RESTRICT,
  UNIQUE(template_id, project_id)
);
CREATE INDEX IF NOT EXISTS idx_agent_deployments_template_id ON agent_deployments(template_id);
CREATE INDEX IF NOT EXISTS idx_agent_deployments_project_id ON agent_deployments(project_id);

-- Chat session indexes for performance
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  user_email TEXT,
  title TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_agent_user ON chat_sessions(agent_id, user_email);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_agent_id ON chat_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_email ON chat_sessions(user_email);

-- Chat messages: individual messages in a session
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'agent', 'system')),
  content TEXT NOT NULL,
  files_json TEXT DEFAULT '[]',
  extracted_content TEXT,
  model_used TEXT,
  tokens_used INTEGER,
  cost_usd REAL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_role ON chat_messages(session_id, role);

-- Uploaded files: file metadata for chat attachments
CREATE TABLE IF NOT EXISTS uploaded_files (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  filename TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('xlsx', 'pdf', 'dwg', 'pptx', 'image', 'video')),
  file_size INTEGER,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  uploaded_by TEXT,
  uploaded_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_session_id ON uploaded_files(session_id);

-- Project context: MEP phase and project-level state for agents
CREATE TABLE IF NOT EXISTS project_context (
  project_id TEXT PRIMARY KEY,
  current_phase TEXT CHECK (current_phase IN ('coordination', 'calculation', 'drawing', 'complete')),
  updated_at TEXT NOT NULL,
  updated_by TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_project_context_phase ON project_context(current_phase);

-- Session contexts: persistent state across multiple chat sessions within a project
CREATE TABLE IF NOT EXISTS session_contexts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  decisions TEXT,
  blockers TEXT,
  assumptions TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_session_contexts_project_id ON session_contexts(project_id);

-- Session links: associate chat sessions with project context
CREATE TABLE IF NOT EXISTS session_links (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  context_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (context_id) REFERENCES session_contexts(id) ON DELETE SET NULL,
  UNIQUE(session_id, project_id)
);
CREATE INDEX IF NOT EXISTS idx_session_links_project_id ON session_links(project_id);

-- Skill invocations: track when agents invoke skills
CREATE TABLE IF NOT EXISTS skill_invocations (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  inputs TEXT NOT NULL,
  outputs TEXT,
  status TEXT CHECK (status IN ('pending', 'success', 'failed', 'timeout')),
  invoked_at TEXT NOT NULL,
  completed_at TEXT,
  error_message TEXT,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_skill_invocations_agent_id ON skill_invocations(agent_id);
CREATE INDEX IF NOT EXISTS idx_skill_invocations_status ON skill_invocations(status);

-- Agent chains: track agent-to-agent escalations and collaborations
CREATE TABLE IF NOT EXISTS agent_chains (
  id TEXT PRIMARY KEY,
  source_agent_id TEXT NOT NULL,
  target_agent_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  chain_depth INTEGER DEFAULT 1,
  initiated_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT CHECK (status IN ('active', 'completed', 'failed')),
  FOREIGN KEY (source_agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (target_agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_agent_chains_session_id ON agent_chains(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_chains_source ON agent_chains(source_agent_id);

-- Agentic OS Memory System
-- Per-agent durable memories (key-value store for structured memory entries)
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
);
CREATE INDEX IF NOT EXISTS idx_agent_memories_agent_id ON agent_memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memories_scope ON agent_memories(scope);
CREATE INDEX IF NOT EXISTS idx_agent_memories_category ON agent_memories(category);
CREATE INDEX IF NOT EXISTS idx_agent_memories_created_at ON agent_memories(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_memories_tags ON agent_memories(tags);

-- Agent memory links: cross-reference memories between agents (shared memory)
CREATE TABLE IF NOT EXISTS agent_memory_links (
  id TEXT PRIMARY KEY,
  source_memory_id TEXT NOT NULL,
  target_agent_id TEXT NOT NULL,
  permission TEXT NOT NULL DEFAULT 'read' CHECK (permission IN ('read', 'write', 'admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_memory_id) REFERENCES agent_memories(id) ON DELETE CASCADE,
  FOREIGN KEY (target_agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  UNIQUE(source_memory_id, target_agent_id)
);
CREATE INDEX IF NOT EXISTS idx_agent_memory_links_target ON agent_memory_links(target_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_links_source ON agent_memory_links(source_memory_id);

-- =============================================================================
-- Phase 3: Search, Filters & Notifications tables
-- =============================================================================

-- FTS5 virtual table for full-text search on tasks
CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts USING fts5(
  title, description,
  content='tasks',
  content_rowid='rowid',
  tokenize='unicode61'
);

-- Triggers to keep tasks_fts in sync
CREATE TRIGGER IF NOT EXISTS tasks_fts_insert AFTER INSERT ON tasks BEGIN
  INSERT INTO tasks_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
END;
CREATE TRIGGER IF NOT EXISTS tasks_fts_delete AFTER DELETE ON tasks BEGIN
  INSERT INTO tasks_fts(tasks_fts, rowid, title, description) VALUES('delete', old.rowid, old.title, old.description);
END;
CREATE TRIGGER IF NOT EXISTS tasks_fts_update AFTER UPDATE ON tasks BEGIN
  INSERT INTO tasks_fts(tasks_fts, rowid, title, description) VALUES('delete', old.rowid, old.title, old.description);
  INSERT INTO tasks_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
END;

-- FTS5 virtual table for full-text search on task comments
CREATE VIRTUAL TABLE IF NOT EXISTS task_comments_fts USING fts5(
  content,
  content='task_comments',
  content_rowid='rowid',
  tokenize='unicode61'
);

CREATE TRIGGER IF NOT EXISTS task_comments_fts_insert AFTER INSERT ON task_comments BEGIN
  INSERT INTO task_comments_fts(rowid, content) VALUES (new.rowid, new.content);
END;
CREATE TRIGGER IF NOT EXISTS task_comments_fts_delete AFTER DELETE ON task_comments BEGIN
  INSERT INTO task_comments_fts(task_comments_fts, rowid, content) VALUES('delete', old.rowid, old.content);
END;
CREATE TRIGGER IF NOT EXISTS task_comments_fts_update AFTER UPDATE ON task_comments BEGIN
  INSERT INTO task_comments_fts(task_comments_fts, rowid, content) VALUES('delete', old.rowid, old.content);
  INSERT INTO task_comments_fts(rowid, content) VALUES (new.rowid, new.content);
END;

-- Saved views: user-defined filter presets
CREATE TABLE IF NOT EXISTS saved_views (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  filters TEXT NOT NULL DEFAULT '{}',
  sort TEXT NOT NULL DEFAULT 'createdAt',
  viewType TEXT NOT NULL DEFAULT 'board' CHECK (viewType IN ('board', 'list', 'calendar')),
  clientId TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Notifications: real-time activity feed
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('task_assigned', 'task_completed', 'task_failed', 'task_comment', 'task_status_change', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  taskId TEXT,
  read INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_createdAt ON notifications(createdAt);
-- Swarm Multi-Agent tables
-- Created: 2026-06-15

CREATE TABLE IF NOT EXISTS swarms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle','coordinating','building','reviewing','complete','error')),
  layout TEXT NOT NULL DEFAULT 'mosaic' CHECK (layout IN ('mosaic','columns','focus')),
  coordinator_id TEXT,
  project_slug TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_swarms_status ON swarms(status);

CREATE TABLE IF NOT EXISTS swarm_panes (
  id TEXT PRIMARY KEY,
  swarm_id TEXT NOT NULL REFERENCES swarms(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('coordinator','builder','scout','reviewer','custom')),
  grid_x INTEGER NOT NULL DEFAULT 0,
  grid_y INTEGER NOT NULL DEFAULT 0,
  grid_w INTEGER NOT NULL DEFAULT 1,
  grid_h INTEGER NOT NULL DEFAULT 1,
  provider TEXT NOT NULL DEFAULT 'custom',
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle','running','waiting','error','done')),
  current_task TEXT DEFAULT '',
  branch_name TEXT DEFAULT '',
  worktree_path TEXT DEFAULT '',
  pid INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_swarm_panes_swarm_id ON swarm_panes(swarm_id);
CREATE INDEX IF NOT EXISTS idx_swarm_panes_role ON swarm_panes(role);

CREATE TABLE IF NOT EXISTS swarm_mailbox (
  id TEXT PRIMARY KEY,
  swarm_id TEXT NOT NULL REFERENCES swarms(id) ON DELETE CASCADE,
  sender_pane_id TEXT NOT NULL,
  recipient_pane_id TEXT,
  message_type TEXT NOT NULL CHECK (message_type IN ('request','response','status_update','task_complete','question','clarification','handoff','broadcast')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','read','acted_upon','closed')),
  created_at TEXT NOT NULL,
  read_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_swarm_mailbox_swarm_id ON swarm_mailbox(swarm_id);
CREATE INDEX IF NOT EXISTS idx_swarm_mailbox_recipient ON swarm_mailbox(recipient_pane_id);
CREATE INDEX IF NOT EXISTS idx_swarm_mailbox_status ON swarm_mailbox(status);

CREATE TABLE IF NOT EXISTS swarm_worktrees (
  id TEXT PRIMARY KEY,
  swarm_id TEXT NOT NULL REFERENCES swarms(id) ON DELETE CASCADE,
  pane_id TEXT NOT NULL,
  repo_path TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  worktree_path TEXT NOT NULL,
  base_branch TEXT NOT NULL DEFAULT 'main',
  is_dirty INTEGER DEFAULT 0,
  last_synced_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(pane_id)
);

CREATE INDEX IF NOT EXISTS idx_swarm_worktrees_swarm_id ON swarm_worktrees(swarm_id);

CREATE TABLE IF NOT EXISTS swarm_chat_messages (
  id TEXT PRIMARY KEY,
  swarm_id TEXT NOT NULL REFERENCES swarms(id) ON DELETE CASCADE,
  pane_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user','agent','coordinator','system')),
  content TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_swarm_chat_swarm_id ON swarm_chat_messages(swarm_id);

-- Swarm Multi-Agent tables (added 2026-06-15)
-- Swarm Multi-Agent tables
-- Created: 2026-06-15

CREATE TABLE IF NOT EXISTS swarms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle','coordinating','building','reviewing','complete','error')),
  layout TEXT NOT NULL DEFAULT 'mosaic' CHECK (layout IN ('mosaic','columns','focus')),
  coordinator_id TEXT,
  project_slug TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_swarms_status ON swarms(status);

CREATE TABLE IF NOT EXISTS swarm_panes (
  id TEXT PRIMARY KEY,
  swarm_id TEXT NOT NULL REFERENCES swarms(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('coordinator','builder','scout','reviewer','custom')),
  grid_x INTEGER NOT NULL DEFAULT 0,
  grid_y INTEGER NOT NULL DEFAULT 0,
  grid_w INTEGER NOT NULL DEFAULT 1,
  grid_h INTEGER NOT NULL DEFAULT 1,
  provider TEXT NOT NULL DEFAULT 'custom',
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle','running','waiting','error','done')),
  current_task TEXT DEFAULT '',
  branch_name TEXT DEFAULT '',
  worktree_path TEXT DEFAULT '',
  pid INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_swarm_panes_swarm_id ON swarm_panes(swarm_id);
CREATE INDEX IF NOT EXISTS idx_swarm_panes_role ON swarm_panes(role);

CREATE TABLE IF NOT EXISTS swarm_mailbox (
  id TEXT PRIMARY KEY,
  swarm_id TEXT NOT NULL REFERENCES swarms(id) ON DELETE CASCADE,
  sender_pane_id TEXT NOT NULL,
  recipient_pane_id TEXT,
  message_type TEXT NOT NULL CHECK (message_type IN ('request','response','status_update','task_complete','question','clarification','handoff','broadcast')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','read','acted_upon','closed')),
  created_at TEXT NOT NULL,
  read_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_swarm_mailbox_swarm_id ON swarm_mailbox(swarm_id);
CREATE INDEX IF NOT EXISTS idx_swarm_mailbox_recipient ON swarm_mailbox(recipient_pane_id);
CREATE INDEX IF NOT EXISTS idx_swarm_mailbox_status ON swarm_mailbox(status);

CREATE TABLE IF NOT EXISTS swarm_worktrees (
  id TEXT PRIMARY KEY,
  swarm_id TEXT NOT NULL REFERENCES swarms(id) ON DELETE CASCADE,
  pane_id TEXT NOT NULL,
  repo_path TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  worktree_path TEXT NOT NULL,
  base_branch TEXT NOT NULL DEFAULT 'main',
  is_dirty INTEGER DEFAULT 0,
  last_synced_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(pane_id)
);

CREATE INDEX IF NOT EXISTS idx_swarm_worktrees_swarm_id ON swarm_worktrees(swarm_id);

CREATE TABLE IF NOT EXISTS swarm_chat_messages (
  id TEXT PRIMARY KEY,
  swarm_id TEXT NOT NULL REFERENCES swarms(id) ON DELETE CASCADE,
  pane_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user','agent','coordinator','system')),
  content TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_swarm_chat_swarm_id ON swarm_chat_messages(swarm_id);
