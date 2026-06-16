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
