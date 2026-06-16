# Command Center - MVP Build Status

**Last Updated**: May 15, 2026 - 03:35 UTC
**Status**: Week 1 Complete ✅

## Current Phase: Week 1 - Agent Foundation

### Completed ✅
- [x] Database schema (agents, agent_configs, chat_sessions, chat_messages tables)
- [x] Credential loader for multi-provider LLM support
- [x] API routes (GET/POST/PUT/DELETE for agents)
- [x] React components (AgentList.tsx, AgentBuilder.tsx)
- [x] Preset system prompts (Jasper, Sensei, Assistant, Sub-agent templates)
- [x] Agent page (/agents route)
- [x] Form validation and error handling
- [x] Database auto-migration on startup

### Tested ✅
- Create agent via form → stored in DB ✅
- Edit agent → pre-fills form ✅
- Delete agent → removes from DB ✅
- Preset prompts → populate system_prompt field ✅
- API responds correctly on all endpoints ✅
- Three agents created and displayed (Jasper, Sensei, Frank's Assistant) ✅

### Dev Server Status ✅
- Running on http://localhost:3006
- Next.js Turbopack enabled
- Database at `C:\agentic-os-v2\.command-centre\data.db`

---

## Next: Week 2 - Chat Interface + LLM Routing

### Planned
- [ ] Chat sessions endpoints (create, list, get)
- [ ] Chat messages endpoints (create, list in session)
- [ ] LLM provider router (route request to correct API)
- [ ] ChatWindow React component
- [ ] Message input/output handling
- [ ] Token counting and cost tracking

---

## Key Files Reference

**Database & Config**
- `src/lib/schema.sql` - Database schema (agents, chat_sessions, chat_messages)
- `src/lib/db.ts` - DB initialization & migrations
- `src/lib/config.ts` - Agentic OS root detection
- `src/lib/llm-credentials.ts` - Load credentials from `.secrets/` directory

**API Routes**
- `src/app/api/agents/route.ts` - GET all, POST create
- `src/app/api/agents/[id]/route.ts` - GET single, PUT update, DELETE

**React Components**
- `src/components/AgentList.tsx` - Agent cards with edit/delete buttons
- `src/components/AgentBuilder.tsx` - Agent form with preset prompts
- `src/app/agents/page.tsx` - Agents page route

**Configuration**
- `.env` - Environment variables
- `.secrets/deepseek.conf` - DeepSeek API credentials (API_KEY, BASE_URL, MODEL)

---

## Quick Commands

**Start dev server**
```bash
cd C:\agentic-os-v2\command-centre
npm run dev
```

**Test API**
```bash
curl http://localhost:3006/api/agents
```

**Access UI**
```
http://localhost:3006/agents
```

**Database file**
```
C:\agentic-os-v2\.command-centre\data.db
```

---

## Architecture Decision Log

### 1. Local Dev + Network Sync (Decision: Approved)
**Problem**: npm symlinks cause contention on network drives
**Solution**: Develop on C: drive, sync to P: after testing via `sync-to-network.ps1`
**Status**: Working — no npm issues on local dev

### 2. Keep Agentic OS Untouched (Decision: Approved)
**Problem**: Simon updates Agentic OS; custom code breaks
**Solution**: Build Command Center as extension; never modify Agentic OS root
**Status**: Working — all code isolated in Command Center folder

### 3. Multi-Provider LLM Support (Decision: Approved)
**Problem**: Team uses different LLMs (DeepSeek, Claude, Perplexity, etc.)
**Solution**: Credential loader + provider dropdown + dynamic model selection
**Status**: UI built, routing layer pending (Week 2)

### 4. Preset Prompts for Roles (Decision: Approved)
**Problem**: Users might create poorly-configured agents
**Solution**: Pre-built system prompts for orchestrator/coach/assistant/sub_agent
**Status**: Working — "Use default prompt for this role" button tested

---

## Agent Templates (Pre-configured)

### Jasper (Orchestrator)
```
role: orchestrator
system_prompt: "You are Jasper, the primary orchestrator agent..."
provider: deepseek
model: deepseek-v4-flash
```

### Sensei (Coach)
```
role: coach
system_prompt: "You are Sensei, the rigorous MEP engineering mentor..."
provider: deepseek
model: deepseek-v4-flash
```

### Frank's Assistant (Personal)
```
role: assistant
system_prompt: "You are a personal assistant for the CMI engineering team..."
provider: deepseek
model: deepseek-v4-flash
```

---

## Known Issues & Blockers

**None** — Week 1 is complete and stable

---

## Next Sprint (Week 2 Planning)

1. **Chat Sessions Table** - Create and list conversations
2. **Chat Messages Table** - Store individual messages
3. **LLM Router** - Route requests to correct provider API
4. **ChatWindow Component** - React UI for chat
5. **Message Handler** - Process user input + agent response
6. **Cost Tracking** - Track tokens + USD per message

**Estimated Time**: 1 week
**Owner**: Claude (Frank supervising)

---

## For Other LLMs

See `AI-COLLABORATION-GUIDE.md` for detailed context on:
- Architecture overview
- Database schema
- Development workflow
- Common tasks
- Testing checklist
- Frank's preferences

---

**Contact**: Frank (francisb.morissette@groupecmi.com)
**Repo**: P:\Ai\agentic-os-v2\command-centre\ (deployed) | C:\agentic-os-v2\command-centre\ (dev)
**Slack**: Not setup yet
