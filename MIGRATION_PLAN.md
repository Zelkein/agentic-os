# Migration Plan: Claude-Code-Centric → Kilo-Centered Agentic OS

**Date:** 2026-06-05
**Status:** Phase 1-3 complete, Phase 4-5 pending

## Architecture Change

| Before | After |
|--------|-------|
| Claude Code = primary orchestrator | **Kilo** = primary orchestrator |
| Only Anthropic models via Claude CLI | Any provider with API key (DeepSeek default) |
| `ClaudeModel` type | `AiModel` type (aliased for compatibility) |
| Hardcoded `"claude"` CLI path in process-manager | `backend-router.ts` — abstracts backend selection |
| Claude settings tab only | Kilo Config + Claude (legacy) tabs |

## Completed (Phases 1-3)

### Phase 1: Backend Abstraction
- [x] Created `src/lib/backend-router.ts` — resolves model → backend type (claude-cli, api-proxy, kilo-gateway)
- [x] Renamed `ClaudeModel` → `AiModel` in `src/types/task.ts`
- [x] Kept `ClaudeModel` as deprecated alias for backward compatibility

### Phase 2: Type Propagation
- [x] Updated `src/types/goal-draft.ts`: `ClaudeModel` → `AiModel`
- [x] Updated `src/store/task-store.ts`: `ClaudeModel` → `AiModel`
- [x] Updated `src/store/chat-store.ts`: `ClaudeModel` → `AiModel`
- [x] Updated `src/app/api/tasks/route.ts`: `ClaudeModel` → `AiModel`
- [x] Updated `src/app/api/tasks/[id]/reply/route.ts`: `ClaudeModel` → `AiModel`
- [x] Updated `src/app/api/chat/message/route.ts`: `ClaudeModel` → `AiModel`
- [x] Updated `src/components/shared/model-picker.tsx`: `ClaudeModel` → `AiModel`

### Phase 3: Kilo Integration
- [x] Created `kilo.json` at workspace root — default model, agent, permissions, skills paths
- [x] Created `.kilo/agent/jasper.md` — MEP orchestrator agent definition
- [x] Created `.kilo/command/gsd-execute-phase.md` — GSD phase execution command
- [x] Created `.mcp.json` — Nova MCP server for cross-platform messaging
- [x] Updated `src/components/settings/settings-tabs.tsx` — added "Kilo Config" tab
- [x] Updated `src/app/page.tsx` — added Kilo config JSON editor
- [x] Created `src/app/api/settings/kilo-config/route.ts` — reads/writes kilo.json
- [x] Updated `AGENTS.md` — Kilo as primary shell
- [x] Updated `CLAUDE.md` — Claude as optional backend

## Pending (Phase 4-5)

### Phase 4: Process-Manager Wiring
- [ ] Wire `backend-router.ts` into `process-manager.ts` `spawnClaudeTurn` method
- [ ] Add `BACKEND_MODE` feature flag (claude | kilo | auto)
- [ ] Add Kilo gateway execution path

### Phase 5: Complete Migration
- [ ] Test all model paths end-to-end
- [ ] Remove deprecated `ClaudeModel` alias once all consumers migrated
- [ ] Full dark theme component migration (ongoing)

## Rollback Procedure

1. **Restore types**: `AiModel` → `ClaudeModel` everywhere (search & replace)
2. **Delete `.kilo/`** directory and `kilo.json` — no side effects
3. **Delete `backend-router.ts`** — not yet wired into process-manager
4. **Revert settings tabs**: remove "Kilo Config" tab
5. **Revert AGENTS.md/CLAUDE.md**: restore original headers

All modified files have backups at `.backups/2026-06-05/`.

## What Was NOT Changed

- All `.claude/` skills, hooks, commands (preserved for Claude backend)
- NAS memory paths and formats
- Hermes/Perplexity Computer integrations
- Agent DB schema and API routes
- `llm-router.ts` (already provider-agnostic)
- `process-manager.ts` core logic (only type references updated)
- All 22 SKILL.md files

## Remaining Manual Tasks

1. Configure Claude Code to use `ANTHROPIC_API_KEY` from `.env` when switching to Claude backend
2. Test Kilo CLI with `kilo.json` at workspace root: `cd /mnt/c/agentic-os-v2 && kilo`
3. Verify Nova MCP server starts correctly: `kilo mcp add nova -- /home/zelkein/.hermes/hermes-agent/venv/bin/hermes mcp serve`
4. Test GSD phase execution via `/gsd-execute-phase` command in Kilo
5. Test agent switching between Jasper (Kilo) and Eva (Hermes coordinator)
