# Plan Multi‑Agent Swarm — Command Centre Agentic OS

Date: 2026-06-15  
Base: `/mnt/c/agentic-os-v2/command-centre/`  
Inspiré de: [SigmaLink](https://github.com/s1gmamale1/SigmaLink) v2.0.0

---

## 1. État des lieux (codebase audit)

### 1.1 Structure existante

```
src/
├── app/
│   ├── page.tsx              ← Page principale (tabs: feed, home, scheduled, skills, docs, settings, analytics)
│   │   + bouton "Agents" → router.push("/agents")
│   ├── agents/
│   │   ├── page.tsx          ← Simple wrapper → <AgentList /> (composant legacy)
│   │   ├── error.tsx
│   │   └── [id]/chat/page.tsx
│   ├── layout.tsx
│   └── api/
│       ├── agents/
│       │   ├── route.ts      ← GET (list), POST (create)
│       │   ├── status/route.ts
│       │   ├── [id]/route.ts
│       │   ├── [id]/chat/sessions/[sessionId]/messages/route.ts ← GET+POST messages LLM
│       │   ├── [id]/execute/route.ts
│       │   └── [id]/share/route.ts
│       └── chat/             ← Autonomous chat (orchestrator) – existe déjà
├── components/
│   ├── agents/
│   │   ├── agents-view.tsx   ← CRUD agents (builder, list, share)
│   │   └── agent-chat-session.tsx ← Chat UI pour un agent
│   ├── dashboard/
│   │   └── agent-status.tsx  ← Dashboard card: statut en temps réel des agents
│   └── autonomous/
│       └── agent-decision-card.tsx
├── store/
│   ├── task-store.ts         ← Tasks (Zustand)
│   ├── chat-store.ts         ← Autonomous chat (Zustand)
│   ├── client-store.ts       ← Client scope (Zustand)
│   ├── notification-store.ts
│   ├── filter-store.ts
│   ├── cron-store.ts
│   └── context-store.ts
├── lib/
│   ├── db.ts                 ← SQLite (Better-SQLite3) avec migrations
│   ├── schema.sql            ← ~486 lignes, 20+ tables
│   ├── agents.ts             ← getAgentById()
│   └── agent-memory.ts, agent-cache.ts
└── types/
    ├── agent-chat.ts         ← AgentChatSession, AgentChatMessage
    ├── chat.ts               ← Conversation, Message, AgentDecision
    └── task.ts               ← Task, TaskLevel, etc.
```

### 1.2 Tables DB existantes (schema.sql)

| Table | Utilisation actuelle |
|---|---|
| `agents` | CRUD agents (name, role, system_prompt, llm_provider, llm_model, visibility) |
| `chat_sessions` | Sessions de chat liées à un agent |
| `chat_messages` | Messages dans un chat session (user/agent/system) |
| `agent_chains` | Agent-to-agent escalations (source→target) |
| `agent_memories` | Key-value memories per agent |
| `agent_memory_links` | Cross-reference permissions entre agents |
| `agent_deployments` | Template instances per project |
| `agent_templates` | Reusable agent definitions |
| `agent_access` | Permissions (view/edit/admin) |
| `conversations` | Autonomous orchestrator chats |
| `messages` | Messages orchestrator (user/orchestrator/sub_agent) |
| `tasks` | Task management (status/level/priority) |

### 1.3 Ce qui existe DÉJÀ (et peut être réutilisé)

- ✅ Agents CRUD (API + UI components)
- ✅ Agent chat individuel (API + UI → agent-chat-session.tsx)
- ✅ Agent status dashboard card (agent-status.tsx)
- ✅ Agent exécution (execute/route.ts)
- ✅ Autonomous orchestrator (chat-store.ts, conversations API)
- ✅ Agent memories (agent_memories table + agent-memory.ts)
- ✅ Skills upload (déjà intégré, mais pas fanned-out aux agents)
- ❌ **Pas de orchestration/swarm layer**
- ❌ **Pas de grid layout (1-16 panes)**
- ❌ **Pas de Git worktree isolation**
- ❌ **Pas de role-bearing swarm (Coordinator/Builder/Scout/Reviewer)**
- ❌ **Pas de mailbox bus entre agents**
- ❌ **Pas de skills fan-out to multiple agents**

---

## 2. Architecture proposée

### 2.1 Nouveaux dossiers

```
src/
├── app/
│   └── swarms/
│       ├── page.tsx                  ← Page Swarms principale (grid 1-16 panes)
│       ├── [id]/page.tsx             ← Détail d'un swarm spécifique
│       └── [id]/chat/page.tsx        ← Multi-agent chat dans un swarm
├── components/
│   └── swarms/
│       ├── swarm-grid.tsx            ← Grid layout (1-16 panes, mosaic/columns/focus)
│       ├── swarm-pane.tsx            ← PTY pane individuel (provider, status, logs)
│       ├── swarm-toolbar.tsx         ← Layout presets, add/remove pane, provider select
│       ├── swarm-chat.tsx            ← Multi-agent chat (talk to any agent in grid)
│       ├── swarm-status-bar.tsx      ← Aggregate swarm health
│       ├── swarm-mailbox.tsx         ← Mailbox bus viewer (Coordinator messages)
│       ├── swarm-skills-fanout.tsx   ← Drag-drop SKILL.md → fan-out to agents
│       └── swarm-worktree-selector.tsx ← Git worktree management
├── store/
│   ├── swarm-store.ts               ← Zustand store pour l'état du swarm
│   └── swarm-chat-store.ts          ← Zustand store pour le multi-agent chat
├── lib/
│   ├── swarm/
│   │   ├── swarm-engine.ts          ← Logique centrale du swarm (cycle de vie)
│   │   ├── swarm-roles.ts           ← Roles: Coordinator, Builder, Scout, Reviewer
│   │   ├── swarm-mailbox.ts         ← In-memory + SQLite mailbox bus
│   │   ├── swarm-worktree.ts        ← Git worktree isolation
│   │   ├── swarm-grid.ts            ← Grid layout math (mosaic algorithm)
│   │   └── swarm-provider.ts        ← Provider resolution pour chaque pane
│   └── schema-swarm.sql             ← New tables pour swarms
├── types/
│   ├── swarm.ts                     ← Swarm, SwarmPane, SwarmRole, MailboxMessage
│   └── swarm-chat.ts                ← SwarmChatMessage, SwarmChatSession
└── app/api/
    └── swarms/
        ├── route.ts                 ← GET (list), POST (create swarm)
        ├── [id]/route.ts            ← GET/PATCH/DELETE swarm
        ├── [id]/panes/route.ts      ← POST add pane, GET panes
        ├── [id]/panes/[paneId]/execute/route.ts ← Execute task on pane
        ├── [id]/panes/[paneId]/chat/route.ts ← Chat with specific agent in swarm
        ├── [id]/mailbox/route.ts    ← POST/GET mailbox messages
        ├── [id]/mailbox/broadcast/route.ts ← Broadcast message to all agents
        ├── [id]/skills/route.ts     ← POST fan-out skill to all panes
        ├── [id]/worktrees/route.ts  ← GET/POST worktrees
        └── [id]/worktrees/[wtId]/sync/route.ts ← Sync worktree with main
```

### 2.2 Nouvelles tables SQLite (schema-swarm.sql)

```sql
-- Swarms: top-level orchestration unit
CREATE TABLE IF NOT EXISTS swarms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'coordinating', 'building', 'reviewing', 'complete', 'error')),
  layout TEXT NOT NULL DEFAULT 'mosaic' CHECK (layout IN ('mosaic', 'columns', 'focus')),
  coordinator_id TEXT,       -- Agent ID acting as coordinator (nullable)
  project_slug TEXT,         -- Linked GitHub project
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Swarm panes (1-16 per swarm)
CREATE TABLE IF NOT EXISTS swarm_panes (
  id TEXT PRIMARY KEY,
  swarm_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,     -- FK → agents(id)
  role TEXT NOT NULL CHECK (role IN ('coordinator', 'builder', 'scout', 'reviewer', 'custom')),
  grid_x INTEGER NOT NULL,    -- X position in grid
  grid_y INTEGER NOT NULL,    -- Y position in grid
  grid_w INTEGER NOT NULL DEFAULT 1, -- Width in grid units
  grid_h INTEGER NOT NULL DEFAULT 1, -- Height in grid units
  provider TEXT NOT NULL,     -- 'claude', 'codex', 'gemini', 'kimi', 'opencode', 'custom'
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'waiting', 'error', 'done')),
  current_task TEXT,          -- Description of current task
  branch_name TEXT,           -- Git worktree branch name
  worktree_path TEXT,         -- Absolute path to worktree
  pid INTEGER,                -- PTY process ID (if applicable)
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (swarm_id) REFERENCES swarms(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_swarm_panes_swarm_id ON swarm_panes(swarm_id);
CREATE INDEX IF NOT EXISTS idx_swarm_panes_role ON swarm_panes(role);

-- Mailbox messages: inter-agent communication bus
CREATE TABLE IF NOT EXISTS swarm_mailbox (
  id TEXT PRIMARY KEY,
  swarm_id TEXT NOT NULL,
  sender_pane_id TEXT NOT NULL,   -- FK → swarm_panes(id)
  recipient_pane_id TEXT,         -- NULL = broadcast
  message_type TEXT NOT NULL CHECK (message_type IN (
    'request', 'response', 'status_update', 'task_complete',
    'question', 'clarification', 'handoff', 'broadcast'
  )),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  priority INTEGER DEFAULT 0,    -- Lower = higher priority
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'acted_upon', 'closed')),
  created_at TEXT NOT NULL,
  read_at TEXT,
  FOREIGN KEY (swarm_id) REFERENCES swarms(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_pane_id) REFERENCES swarm_panes(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_swarm_mailbox_swarm_id ON swarm_mailbox(swarm_id);
CREATE INDEX IF NOT EXISTS idx_swarm_mailbox_recipient ON swarm_mailbox(recipient_pane_id);
CREATE INDEX IF NOT EXISTS idx_swarm_mailbox_status ON swarm_mailbox(status);

-- Worktrees: track Git worktree isolation per pane
CREATE TABLE IF NOT EXISTS swarm_worktrees (
  id TEXT PRIMARY KEY,
  swarm_id TEXT NOT NULL,
  pane_id TEXT NOT NULL,
  repo_path TEXT NOT NULL,        -- Main repo path
  branch_name TEXT NOT NULL,      -- e.g. sigmalink/-a1b2c3d4
  worktree_path TEXT NOT NULL,    -- Absolute path to worktree
  base_branch TEXT NOT NULL DEFAULT 'main',
  is_dirty INTEGER DEFAULT 0,    -- Has uncommitted changes
  last_synced_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (swarm_id) REFERENCES swarms(id) ON DELETE CASCADE,
  FOREIGN KEY (pane_id) REFERENCES swarm_panes(id) ON DELETE CASCADE,
  UNIQUE(pane_id)
);

-- Swarm chat: multi-agent chat transcript
CREATE TABLE IF NOT EXISTS swarm_chat_messages (
  id TEXT PRIMARY KEY,
  swarm_id TEXT NOT NULL,
  pane_id TEXT,                    -- NULL = user message
  role TEXT NOT NULL CHECK (role IN ('user', 'agent', 'coordinator', 'system')),
  content TEXT NOT NULL,
  metadata TEXT,                   -- JSON
  created_at TEXT NOT NULL,
  FOREIGN KEY (swarm_id) REFERENCES swarms(id) ON DELETE CASCADE,
  FOREIGN KEY (pane_id) REFERENCES swarm_panes(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_swarm_chat_swarm_id ON swarm_chat_messages(swarm_id);
```

---

## 3. Plan d'implémentation par phase

### Phase 1 — Fondations (Jour 1-2)

#### 3.1 Types TypeScript
**Fichier:** `src/types/swarm.ts`

```typescript
export type SwarmRole = 'coordinator' | 'builder' | 'scout' | 'reviewer' | 'custom';
export type SwarmLayout = 'mosaic' | 'columns' | 'focus';
export type PaneProvider = 'claude' | 'codex' | 'gemini' | 'kimi' | 'opencode' | 'custom';
export type PaneStatus = 'idle' | 'running' | 'waiting' | 'error' | 'done';
export type MailboxMessageType = 'request' | 'response' | 'status_update' | 'task_complete' | 'question' | 'clarification' | 'handoff' | 'broadcast';

export interface Swarm {
  id: string;
  name: string;
  workspaceId: string;
  status: 'idle' | 'coordinating' | 'building' | 'reviewing' | 'complete' | 'error';
  layout: SwarmLayout;
  coordinatorId: string | null;
  projectSlug: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SwarmPane {
  id: string;
  swarmId: string;
  agentId: string;
  agentName: string;
  role: SwarmRole;
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
  provider: PaneProvider;
  status: PaneStatus;
  currentTask: string | null;
  branchName: string | null;
  pid: number | null;
}

export interface MailboxMessage {
  id: string;
  swarmId: string;
  senderPaneId: string;
  senderName: string;
  recipientPaneId: string | null;
  messageType: MailboxMessageType;
  subject: string;
  body: string;
  priority: number;
  status: 'pending' | 'read' | 'acted_upon' | 'closed';
  createdAt: string;
}
```

#### 3.2 DB Migration
**Fichier:** `src/lib/schema-swarm.sql` (contenu ci-dessus)

Dans `src/lib/db.ts`, ajouter après les migrations existantes:

```typescript
// Migration: swarm tables
{
  const swarmSchema = path.join(config.agenticOsDir, 'command-centre', 'src', 'lib', 'schema-swarm.sql');
  if (fs.existsSync(swarmSchema)) {
    db.exec(fs.readFileSync(swarmSchema, 'utf-8'));
  }
}
```

#### 3.3 Swarm Store (Zustand)
**Fichier:** `src/store/swarm-store.ts`

- `swarms: Swarm[]` — liste des swarms
- `activeSwarmId: string | null` — swarm actuellement sélectionné
- `panes: Record<string, SwarmPane[]>` — panes par swarmId
- `mailboxMessages: Record<string, MailboxMessage[]>` — messages mailbox
- Actions: `createSwarm()`, `addPane()`, `removePane()`, `updatePaneStatus()`, `rearrangeGrid()`, `sendMailboxMessage()`, `pollMailbox()`
- Polling: SSE ou interval 5s pour status updates

#### 3.4 Swarm Engine (server-side)
**Fichier:** `src/lib/swarm/swarm-engine.ts`

Logique centrale:
- `createSwarm(name, agentIds, layout)` → crée swarm + panes + worktrees
- `addPaneToSwarm(swarmId, agentId, role, provider)` → ajoute un pane
- `removePaneFromSwarm(swarmId, paneId)` → supprime pane + worktree
- `getSwarmLayout(swarmId)` → calcule la grille optimale
- `assignRole(swarmId, paneId, role)` → change le rôle d'un pane

#### 3.5 Swarm Roles
**Fichier:** `src/lib/swarm/swarm-roles.ts`

Définit les prompts système par rôle (inspiré de SigmaLink):

| Rôle | Prompt système |
|---|---|
| **Coordinator** | Découpe le travail, assigne les tâches, collecte les résultats, gère les conflits. Accès au mailbox bus complet. |
| **Builder** | Écrit le code. Reçoit des spécifications du Coordinator, push dans son worktree. |
| **Scout** | Explore le codebase, cherche des patterns, des bugs, des dépendances. Rapport au Coordinator. |
| **Reviewer** | Review le code produit par Builder, vérifie style, tests, sécurité. Poste des CR comments. |

---

### Phase 2 — Grid UI (Jour 2-3)

#### 3.6 Swarm Grid Component
**Fichier:** `src/components/swarms/swarm-grid.tsx`

**ATTENTION:** Ce fichier peut dépasser 100KB → split en sous-composants.

- **swarm-grid.tsx** — Conteneur principal: calcule la grille, rend les panes, écoute le store
- **swarm-pane.tsx** — Pane individuel: PTY output (ou simulé), status badge, provider icon, action buttons
- **swarm-toolbar.tsx** — Barre d'outils: layout presets (mosaic/columns/focus), +/-, provider selector

**Layout presets:**
```
Mosaic (défaut):
┌──────┬──────┬──────┬──────┐
│  1   │  2   │  3   │  4   │
├──────┼──────┼──────┼──────┤
│  5   │  6   │  7   │  8   │
└──────┴──────┴──────┴──────┘

Columns:
┌──┬──┬──┬──┐
│1 │2 │3 │4 │
│5 │6 │7 │8 │
│9 │10│11│12│
└──┴──┴──┴──┘

Focus:
┌─────────────────────┬────┐
│                     │ 2  │
│         1           ├────┤
│                     │ 3  │
├─────────────────────┼────┤
│  4  │  5  │  6  │  7  │  8  │
└─────┴─────┴─────┴─────┴─────┘
```

#### 3.7 Page Swarms
**Fichier:** `src/app/swarms/page.tsx`

```tsx
"use client";
// Affiche la liste des swarms + bouton "New Swarm"
// Navigation vers /swarms/[id] pour le grid détaillé
```

**Fichier:** `src/app/swarms/[id]/page.tsx`

```tsx
"use client";
// Affiche le SwarmGrid, SwarmToolbar, SwarmStatusBar, SwarmChat
```

---

### Phase 3 — Mailbox Bus & Coordination (Jour 3-4)

#### 3.8 Swarm Mailbox
**Fichier:** `src/lib/swarm/swarm-mailbox.ts`

Implémentation:
- `send(swarmId, from, to, type, subject, body)` → INSERT dans `swarm_mailbox`
- `broadcast(swarmId, from, type, subject, body)` → INSERT avec `recipient_pane_id = NULL`
- `poll(swarmId, paneId)` → SELECT messages non-lus, ordre par priority+created_at
- `markRead(messageId)` → UPDATE status
- `getThread(mailboxId)` → récupère toute la conversation

**Intégration avec les agents:**
- Chaque pane LLM a un processus qui lit sa mailbox périodiquement
- Mécanisme de "callback": quand un agent termine, il poste un message `task_complete`
- Le Coordinator reçoit les `task_complete` et décide de la prochaine action

#### 3.9 Orchestration Loop
**Fichier:** `src/lib/swarm/swarm-coordinator.ts`

Logique du Coordinator:
```
1. Receive objective from user
2. Decompose into sub-tasks
3. Assign sub-tasks to Builder/Scout panes via mailbox
4. Wait for completion (poll mailbox)
5. Forward results to Reviewer
6. Integrate reviewed code
7. Report status to user
```

---

### Phase 4 — Git Worktree Isolation (Jour 4-5)

#### 3.10 Worktree Manager
**Fichier:** `src/lib/swarm/swarm-worktree.ts`

```typescript
async function createWorktree(repoPath: string, branchName: string): Promise<string>
async function syncWorktree(worktreePath: string): Promise<void>
async function mergeBranch(worktreePath: string, targetBranch: string): Promise<void>
async function cleanupWorktree(worktreePath: string): Promise<void>
```

- Branche naming: `swarm/<swarm-id>/<agent-role>-<short-hash>`
- Chaque pane a son propre worktree → pas de conflits d'édition
- `sync()` = commit + push dans la branche du worktree
- `merge()` = merge dans main (via PR ou direct)

---

### Phase 5 — Skills Fan-Out & Multi-Agent Chat (Jour 5-6)

#### 3.11 Skills Fan-Out
**Fichier:** `src/components/swarms/swarm-skills-fanout.tsx`

- Drag-drop zone pour SKILL.md (Anthropic format)
- Zod validation du fichier
- Fan-out: distribue la skill à chaque agent dans le swarm
- Optionnel: transformation de la skill par rôle (Builder reçoit une version "implémentation", Reviewer reçoit une version "review")

#### 3.12 Multi-Agent Chat
**Fichier:** `src/store/swarm-chat-store.ts`
**Fichier:** `src/components/swarms/swarm-chat.tsx`

- Chat UI où l'utilisateur peut parler à n'importe quel agent du swarm
- `@agent_name` mention system → route le message à un pane spécifique
- Le Coordinator peut être @all pour broadcast
- Intégration avec le mailbox bus: les messages du chat sont aussi postés dans la mailbox

---

### Phase 6 — Dashboard & Monitoring (Jour 6-7)

#### 3.13 Swarm Status Bar
**Fichier:** `src/components/swarms/swarm-status-bar.tsx`

- Vue d'ensemble: nombre d'agents running/idle/error
- Timeline des événements récents
- Métriques: tokens consommés, temps actif, tâches complétées

#### 3.14 Agent Status → Swarm Integration
**Fichier existant:** `src/components/dashboard/agent-status.tsx`
- Ajouter un lien vers le swarm parent
- Afficher le rôle dans le swarm (Coordinator, Builder, etc.)

---

## 4. Navigation & Routing

### 4.1 Ajout du tab Swarms

Dans `src/app/page.tsx`:

```typescript
type Tab = "feed" | "scheduled" | "skills" | "docs" | "settings" | "analytics" | "swarms";
```

Ajouter dans le tableau `tabs`:
```typescript
{ key: "swarms", label: "Swarms", icon: GitBranch }, // ou Workflow, Users
```

Et dans le contenu:
```typescript
{activeTab === "swarms" && <SwarmsView />}
```

### 4.2 Routes

| Route | Composant | Description |
|---|---|---|
| `/swarms` | SwarmsListPage | Liste des swarms + créer |
| `/swarms/[id]` | SwarmDetailPage | Grid + chat + mailbox |
| `/swarms/[id]/chat` | SwarmChatPage | Full-screen multi-agent chat |

Le bouton "Agents" existant (dans la nav bar) continue de pointer vers `/agents`.

---

## 5. Split des gros fichiers

| Fichier | Taille actuelle | Split en |
|---|---|---|
| `agents-view.tsx` | ~27KB | `agents-view.tsx`, `agent-builder-form.tsx`, `agent-card.tsx`, `agent-share-dialog.tsx` |
| `task-store.ts` | ~25KB | `task-store.ts`, `task-store-utils.ts` |
| `db.ts` | ~30KB | `db.ts`, `db-migrations.ts` |

---

## 6. Dépendances additionnelles

```
npm install node-pty          # PTY management (optionnel: xterm.js pour l'affichage)
npm install xterm             # Terminal UI (si PTY real)
npm install @xterm/xterm      # Terminal component for React
```

Pour la phase initiale, le PTY peut être **simulé** (juste du texte en streaming dans un pane) pour valider l'UX avant d'intégrer `node-pty`.

---

## 7. Diagramme de flux

```
[User] ──objective──→ [SwarmPage]
                         │
                    ┌────┴────┐
                    │Coordinator│ ← mailbox bus
                    └────┬────┘
                         │ assign tasks
            ┌────────────┼────────────┐
            │            │            │
       [Builder 1]  [Scout 1]  [Reviewer 1]
            │            │            │
       worktree A    worktree B   worktree C
            │            │            │
            └────────────┼────────────┘
                         │ results
                    ┌────┴────┐
                    │Coordinator│
                    └────┬────┘
                         │ report
                    [User receives status]
```

---

## 8. Points d'attention

1. **Fichiers >100KB et Turbopack Rust panics** → split systématique des composants
2. **PTY réel vs simulé** → Commencer par simulé (SSE streaming), migrer vers `node-pty` quand l'UX est validée
3. **Git worktree isolation** → Nécessite `git` installé sur le host. Fallback: branches simples sans worktree
4. **Provider management** → Chaque pane peut utiliser un LLM différent (Claude, Codex, Gemini). Le provider est stocké dans `swarm_panes.provider`
5. **SSE pour real-time** → Utiliser l'infrastructure SSE existante de `events/route.ts`
6. **Ne pas casser l'existant** → Les routes `/api/agents/*` et `/agents/*` restent intactes. Swarm est un module additionnel

---

## 9. Ordre de livraison recommandé

1. **Phase 1** (Fondations) → Types, DB, Store, Engine
2. **Phase 2** (Grid UI) → Page Swarms + Grid layout (PTY simulé)
3. **Phase 3** (Mailbox) → Coordination basique
4. **Phase 5** (Chat + Skills) → Multi-agent chat + skills fan-out
5. **Phase 4** (Worktrees) → Git isolation (peut être parallélisé avec phase 5)
6. **Phase 6** (Dashboard) → Monitoring final
