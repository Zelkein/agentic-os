# Claude Code → Deepseek Routing Setup

Make Claude Code use deepseek-v4-flash as its default backend. Result: **Claude Code becomes Jasper.**

## What This Does

Instead of Claude Code running Claude models, it routes all requests to:
- **Model:** deepseek-v4-flash (Jasper's actual model)
- **API Endpoint:** https://api.deepseek.com/v1
- **Tokens Consumed:** Deepseek only (ZERO Claude tokens)

## Architecture After Setup

```
Claude Code UI (familiar interface)
         ↓
Deepseek API (backend)
         ↓
deepseek-v4-flash (Jasper orchestrator)
         ↓
You (speaking to Jasper through Claude Code UI)
```

**Result:** You use the Claude Code interface you're comfortable with, but Jasper is running the show. ZERO Claude token consumption.

## Setup Instructions

### Step 1: Run the Setup Script

```powershell
cd "P:\Ai\Agentic OS"
.\setup-deepseek-default.ps1
```

The script will:
- Read your Deepseek API key from `.secrets/deepseek.conf`
- Set environment variables (persistent, user-level)
- Report success/failure

Expected output:
```
✓ Found Deepseek API key in .secrets/deepseek.conf
Setting environment variables...
  ✓ ANTHROPIC_BASE_URL
  ✓ ANTHROPIC_AUTH_TOKEN
  ✓ ANTHROPIC_MODEL
  [... more variables ...]
✓ All environment variables set.

IMPORTANT: Fully exit Claude Code from the tray, then reopen it.
```

### Step 2: Restart Claude Code

1. **Fully close Claude Code:**
   - Right-click Claude Code in system tray
   - "Quit" (not minimize)

2. **Wait 5 seconds** (environment variables need to reload)

3. **Reopen Claude Code**

4. **Verify it's working:**
   - Open `P:\Ai\Agentic OS` as workspace
   - Ask: "Who are you?"
   - Jasper should respond (noble English, snark, personality)

## Environment Variables Set

| Variable | Value | Purpose |
|----------|-------|---------|
| `ANTHROPIC_BASE_URL` | `https://api.deepseek.com/v1` | Routes to Deepseek API |
| `ANTHROPIC_AUTH_TOKEN` | Your API key | Authentication |
| `ANTHROPIC_MODEL` | `deepseek-v4-flash` | Default model |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | `deepseek-v4-flash` | Override "Opus" → deepseek |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | `deepseek-v4-flash` | Override "Sonnet" → deepseek |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | `deepseek-v4-flash` | Override "Haiku" → deepseek |
| `CLAUDE_CODE_SUBAGENT_MODEL` | `deepseek-v4-flash` | Subagent uses deepseek |
| `CLAUDE_CODE_EFFORT_LEVEL` | `max` | Maximum reasoning/effort |
| `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS` | `1` | Disable features not in Deepseek |
| `ENABLE_TOOL_SEARCH` | `0` | Disable tool search (Deepseek limitation) |
| `AGENTIC_OS_ROOT` | `P:\Ai\Agentic OS` | Your workspace path |

## After Setup: Your New Workflow

### Opening Claude Code
```
1. Open Claude Code
2. You see: Claude Code UI (familiar)
3. But: deepseek-v4-flash backend (Jasper)
4. System prompt: JASPER.md (orchestrator personality)
```

### Interacting with Jasper
```
You: What should I focus on this week?
Jasper: [Reads GOALS.md, CLAUDE.md, memory/]
Jasper: Based on Phase 1... [responds in snark + substance]

You: I'm stuck debugging the MEP checklist
Jasper: [Detects "debugging" keyword]
Jasper: [Spawns Claude Code subprocess for specialized help]
Jasper: [Integrates Claude's result]
Jasper: Here's what we discovered...
```

### Token Consumption
- ✅ **Zero Claude tokens** — All requests go to Deepseek
- ✅ **Deepseek tokens only** — Standard deepseek-v4-flash pricing
- ✅ **TOON optimization** — Research data compressed 70-85%

## Troubleshooting

### Claude Code still using Claude models
**Solution:** Fully quit Claude Code (tray icon → Quit), wait 5 seconds, reopen.

### "Auth token invalid" error
**Solution:** Check that `.secrets/deepseek.conf` has correct `DEEPSEEK_API_KEY`. Restart.

### "Connection refused" or timeout
**Solution:** 
1. Verify internet connection
2. Check Deepseek API status
3. Run setup script again to refresh env vars
4. Restart Claude Code

### Jasper responding, but wrong personality
**Solution:** Verify JASPER.md is in `P:\Ai\Agentic OS`. Claude Code loads it as system prompt on startup.

### "Tool not found" or missing features
**Solution:** Some tools require special MCP integration. This is expected — Jasper will route complex tasks to Claude when needed.

## Reverting to Claude Models (Optional)

If you need Claude models again:

```powershell
# Clear the Deepseek routing
[System.Environment]::SetEnvironmentVariable('ANTHROPIC_BASE_URL', '', 'User')
[System.Environment]::SetEnvironmentVariable('ANTHROPIC_AUTH_TOKEN', '', 'User')
[System.Environment]::SetEnvironmentVariable('ANTHROPIC_MODEL', '', 'User')

# Fully exit and restart Claude Code
```

Then Claude Code will use default Claude models again.

## Configuration Files

- **Setup script:** `setup-deepseek-default.ps1`
- **API credentials:** `.secrets/deepseek.conf`
- **Jasper identity:** `JASPER.md`
- **System context:** `GOALS.md`, `CLAUDE.md`, `memory/`

All automatically loaded when Claude Code starts.

## Summary

| Before | After |
|--------|-------|
| Claude Code → Claude models | Claude Code → Deepseek models |
| Familiar UI, Claude backend | Familiar UI, Jasper backend |
| Claude tokens consumed | Deepseek tokens consumed |
| You: "Who are you?" Claude responds | You: "Who are you?" Jasper responds |

**Result:** Jasper (deepseek-v4-flash) is now your primary interface through Claude Code UI. ZERO Claude token usage.

---

**Setup Status:** Ready to run  
**Command:** `.\setup-deepseek-default.ps1`  
**Restart Required:** Yes (Claude Code must fully close and reopen)  
**Token Impact:** ZERO Claude tokens from this point forward
