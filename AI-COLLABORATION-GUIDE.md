# AI Collaboration Guide for Command Center

This document provides context for other LLMs (Nemotron, Claude, Perplexity, etc.) working with Frank's Agentic OS and Command Center project.

## Quick Context

Frank is implementing an **AI-assisted MEP team collaboration platform**. His team (7 engineers at CMI) will create and interact with AI agents as coworkers to handle:
- Engineering calculations (HVAC, electrical, plumbing)
- File reviews and modifications
- Coordination checks
- Design validation

The system is being built as extensions to the Command Center (a Next.js/React app) while keeping the Agentic OS foundation untouched (Simon updates it frequently).

## Architecture

### Three-Tier Agent System
1. **Jasper** (Orchestrator) - Coordinates workflows, delegates to specialists
2. **Sensei** (Coach/Mentor) - Reviews work, teaches MEP principles, enforces "Coordination → Calculation → Drawing"
3. **Personal Assistants** (per employee) - Support individual team members with daily tasks
4. **Sub-agents** (on-demand) - Handle specific engineering tasks

### Tech Stack
- **Framework**: Next.js 16.2.6 (Turbopack)
- **Database**: Better SQLite3 (BetterSQLite3, WAL mode)
- **Backend**: Node.js API routes
- **Frontend**: React with Tailwind CSS
- **LLM Routing**: Support for Claude, DeepSeek, Perplexity, Kimi, MiniMax, Z.AI, Ollama, vision models
- **Credentials**: `.secrets/{provider}.conf` files (API_KEY=, BASE_URL=, MODEL=)

### Database Schema (Critical)
```sql
-- Core agent storage
agents (id, name, role, system_prompt, context, skills_json, workflows_json, 
        llm_provider, llm_model, owner_email, created_at, updated_at, is_template)

-- Agent config key-value storage
agent_configs (id, agent_id, key, value, created_at)

-- User-agent conversation sessions
chat_sessions (id, agent_id, user_email, title, created_at, updated_at)

-- Individual messages in chat
chat_messages (id, session_id, role, content, files_json, model_used, cost_usd, created_at)
```

### Key Files

**API Routes**
- `src/app/api/agents/route.ts` - GET all agents, POST create
- `src/app/api/agents/[id]/route.ts` - GET single, PUT update, DELETE

**React Components**
- `src/components/AgentList.tsx` - List/card view with CRUD buttons
- `src/components/AgentBuilder.tsx` - Form to create/edit agents with preset prompts
- `src/app/agents/page.tsx` - Main agents page

**Utilities**
- `src/lib/db.ts` - Database initialization with auto-migrations
- `src/lib/config.ts` - Config resolver (finds Agentic OS root)
- `src/lib/llm-credentials.ts` - Load & cache LLM credentials from `.secrets/`

## Agent Creation (Quick Reference)

### Creating an Agent Programmatically
```typescript
const response = await fetch('/api/agents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Agent Name',
    role: 'orchestrator|coach|assistant|sub_agent',
    system_prompt: 'Full system prompt text',
    llm_provider: 'deepseek|claude|perplexity|...',
    llm_model: 'specific-model-id',
    context: 'Optional additional context',
    owner_email: 'optional@email.com'
  })
});
```

### Preset System Prompts
Located in `AgentBuilder.tsx`:
- **orchestrator (Jasper)**: Workflow coordination, task delegation, noble English, dry wit
- **coach (Sensei)**: Work review, teaching, enforces "Coordination → Calculation → Drawing" discipline
- **assistant**: Personal support, calculations, file modifications, process questions
- **sub_agent**: Specific domain tasks, clear result reporting

## Development Workflow

### Week 1 (COMPLETE)
✅ Database schema + agents table
✅ API routes (GET/POST/PUT/DELETE)
✅ React components (AgentList, AgentBuilder)
✅ Preset prompts feature
✅ Form validation & error handling

### Week 2 (NEXT)
🔄 Chat Interface + LLM Routing
- `chat_sessions` endpoints
- `chat_messages` endpoints
- LLM provider router (select provider → call API)
- Chat window React component

### Week 3
🔄 Natural Language Agent Builder
- Parse text like "Make me a coach that..." → Create agent
- File upload support (DWG, XLSX, PDF, PPTX, images, video)
- File preview components

### Week 4
🔄 Sub-agent Dispatch + Team Testing
- Intent parser
- Sub-agent executor
- Deploy Jasper & Sensei
- User testing

## Running Locally

**Start dev server**
```bash
cd /c/agentic-os-v2/command-centre
npm run dev
# Server runs on http://localhost:3006 (auto-selects port if 3000 busy)
```

**Access UI**
```
http://localhost:3006/agents
```

**Test API directly**
```bash
curl http://localhost:3006/api/agents
curl -X POST http://localhost:3006/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","role":"coach",...}'
```

## Critical Design Decisions

### 1. Local Dev, Network Sync
- Dev server runs on **C: drive** (local) to avoid npm symlink issues on network
- After testing, sync to **P: drive** via `sync-to-network.ps1`
- Agentic OS root: `P:\Ai\Agentic-OS\` (Frank keeps this untouched)
- Command Centre dev: `C:\agentic-os-v2\command-centre\` (local testing)
- Command Centre deployed: `P:\Ai\agentic-os-v2\command-centre\` (team access)

### 2. Credential Management
- No hardcoded API keys in code
- Credentials in `.secrets/{provider}.conf` files
- Format: `API_KEY=xxx`, `BASE_URL=xxx`, `MODEL=xxx`
- Loaded once, cached in memory
- Example: `.secrets/deepseek.conf`

### 3. Database Migrations
- `getDb()` in `db.ts` auto-runs all schema migrations on startup
- Uses `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ADD COLUMN IF NOT EXISTS` pattern
- SQLite WAL mode for concurrent reads
- Safe for multiple server instances

### 4. Form Preset Prompts
- Each role (orchestrator, coach, assistant, sub_agent) has default system prompt
- Users can click "Use default prompt for this role" to populate
- Or write custom prompts for specialized agents
- Critical for standardizing agent behavior across team

## Common Tasks for Other AIs

### Task: Create a Coach Agent for Structural Engineering
```typescript
// In AgentBuilder form or via API
{
  name: "Structural Coach",
  role: "coach",
  system_prompt: "You are a coach specializing in structural design review...",
  llm_provider: "claude",
  llm_model: "claude-opus-4",
  owner_email: "structural@cmi.ca"
}
```

### Task: Debug API Issue
1. Check if dev server is running: `curl http://localhost:3006/api/agents`
2. Look at logs in `.next/dev/logs/next-development.log`
3. Verify database: Check `.command-centre/data.db` exists
4. Check credentials: Verify `.secrets/{provider}.conf` has API_KEY and BASE_URL

### Task: Add LLM Provider Support
1. Add to `PROVIDERS` array in `AgentBuilder.tsx`
2. Add models to `MODELS` object in `AgentBuilder.tsx`
3. Create `.secrets/{provider}.conf` with credentials
4. Update `agent` table CHECK constraint if needed (currently supports 8 providers)

## Testing Checklist (Week 1 Validation)

✅ GET /api/agents returns empty array on first request
✅ POST /api/agents creates agent with UUID + timestamps
✅ Agent appears in AgentList immediately
✅ Edit button pre-fills form with agent data
✅ Preset prompts populate system_prompt field
✅ Create Agent → Update Agent button text changes
✅ Back to Agents returns to list
✅ Delete button removes agent (confirmation required)
✅ Multiple agents display in correct order (newest first)
✅ Form validation requires name, role, system_prompt, provider, model

## Frank's Preferences

- Execute without asking permission (when scope is clear)
- Direct and concise communication (no em dashes, no trailing summaries)
- Batch independent work in parallel when possible
- Create commits with meaningful messages
- Test in browser before declaring tasks done
- Keep Agentic OS untouched; all extensions go in Command Center

## Contact & Context

- **Frank**: Lead Engineer at CMI, 70H/week (unsustainable), goal: reduce to 50H/week
- **Team**: 7 active engineers, young team, needs guidance
- **Goal**: By end of Phase 3, team operates without Frank as bottleneck
- **Current Focus**: Reduce redraw/patch cycle by enforcing "Coordination → Calculation → Drawing"

## For Other AIs Reading This

This is Frank's system. If you're helping him:
1. **Read this file first** to understand the architecture
2. **Check the database schema** in `src/lib/schema.sql` for what tables exist
3. **Look at preset prompts** in `AgentBuilder.tsx` to see agent personalities
4. **Test in browser** before committing—command line tests can miss UI issues
5. **Keep changes local to Command Center**—never modify Agentic OS root
6. **Ask about ambiguity** rather than guessing

Good luck!
