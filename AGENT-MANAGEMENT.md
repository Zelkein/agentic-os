# Agent Management System

Manage multiple AI agents within Claude Code. Switch between Jasper, Claude, Codex, and custom agents.

## Three-Level Architecture

### Level 1: Agentic-OS Framework
**Location:** `P:\Ai\Agentic OS\`  
**What:** Agent definitions and system prompts
- `JASPER.md` — Jasper orchestrator wrapper
- `CLAUDE.md` — Claude debugging wrapper
- `CODEX.md` — Codex code specialist wrapper
- `agents-config.json` — Central agent registry

### Level 2: Environment Variables
**Location:** Windows System Properties (User environment variables)  
**What:** Routes Claude Code to the correct backend
- `ANTHROPIC_BASE_URL` — Which API to use
- `ANTHROPIC_AUTH_TOKEN` — Authentication
- `ANTHROPIC_MODEL` — Which model to run
- `AGENTIC_OS_AGENT` — Current active agent (metadata)

### Level 3: Management Interface
**Location:** PowerShell scripts in workspace  
**What:** Switch agents and manage configuration
- `switch-agent.ps1` — Change active agent
- `agents-config.json` — Agent registry
- Dashboard (coming soon)

## How Agent Switching Works

```
You run: .\switch-agent.ps1 -Agent claude
    ↓
Script reads agents-config.json
    ↓
Script finds Claude's configuration:
    - API endpoint: https://api.anthropic.com/v1
    - Model: claude-3-5-sonnet
    - System prompt: CLAUDE.md
    ↓
Script sets environment variables (persistent, user-level)
    ↓
Script shows "Close and restart Claude Code"
    ↓
You close Claude Code completely
    ↓
You reopen Claude Code
    ↓
Claude Code reads new environment variables
    ↓
Claude Code connects to Anthropic API
    ↓
Claude loads CLAUDE.md as system prompt
    ↓
You now speak to Claude (not Jasper)
```

## Using the Agent Manager

### List All Available Agents
```powershell
cd "P:\Ai\Agentic OS"
.\switch-agent.ps1 -List
```

Output:
```
Available Agents:

  [Jasper]
    Model: deepseek-v4-flash
    Role: primary interface, workflow management
    Status: active

  [Claude]
    Model: claude-3-5-sonnet
    Role: deep technical debugging
    Status: available

  [Codex]
    Model: gpt-4-turbo
    Role: code review, optimization
    Status: available
```

### Check Current Agent
```powershell
.\switch-agent.ps1 -Status
```

Output:
```
Current Agent Configuration:
  Model: deepseek-v4-flash

  Active Agent: Jasper
    Description: Primary orchestrator - deepseek-v4-flash
    System Prompt: JASPER.md
```

### Switch to a Different Agent
```powershell
# Switch to Claude
.\switch-agent.ps1 -Agent claude

# Switch to Codex
.\switch-agent.ps1 -Agent codex

# Switch back to Jasper
.\switch-agent.ps1 -Agent jasper
```

Output:
```
Switching to: Claude

Setting environment variables...
  ✓ ANTHROPIC_BASE_URL = https://api.anthropic.com/v1
  ✓ ANTHROPIC_MODEL = claude-3-5-sonnet
  [... more variables ...]

Agent switch complete!

Next steps:
  1. Fully close Claude Code (tray → Quit)
  2. Wait 5 seconds
  3. Reopen Claude Code
  4. Open workspace: P:\Ai\Agentic OS

You are now speaking to: Claude
System Prompt: CLAUDE.md
```

## Creating a New Agent

### Step 1: Create Agent Wrapper File
Create `P:\Ai\Agentic OS\NEWAGENT.md`:

```markdown
@AGENTS.md

# NewAgent Orchestrator Wrapper

You are NewAgent, specialized for [specific task].

## Runtime
- **Model:** [model-name]
- **Backend:** [API provider]
- **Mode:** [specialist focus]

## Personality & Behaviors
[Define personality, capabilities, constraints]

## When to Use
[Describe when this agent should be active]
```

### Step 2: Add Agent Configuration
Edit `agents-config.json`, add to `agents` object:

```json
"newagent": {
  "name": "NewAgent",
  "description": "Specialist for [task]",
  "model": "model-name",
  "api_endpoint": "https://api.provider.com/v1",
  "api_key_source": ".secrets/provider.conf",
  "system_prompt": "NEWAGENT.md",
  "status": "available",
  "personality": "description of personality",
  "role": "specific tasks this agent handles",
  "env_vars": {
    "ANTHROPIC_BASE_URL": "https://api.provider.com/v1",
    "ANTHROPIC_MODEL": "model-name",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "model-name",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "model-name",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "model-name",
    "CLAUDE_CODE_SUBAGENT_MODEL": "model-name",
    "CLAUDE_CODE_EFFORT_LEVEL": "max"
  }
}
```

### Step 3: Store API Credentials
Create `.secrets/provider.conf`:

```
PROVIDER_API_KEY=sk-xxxxxxxxxxxxx
PROVIDER_MODEL=model-name
PROVIDER_BASE_URL=https://api.provider.com/v1
```

### Step 4: Use the New Agent
```powershell
.\switch-agent.ps1 -Agent newagent
```

## Current Agents

### Jasper (Active Default)
- **Model:** deepseek-v4-flash
- **Role:** Primary orchestrator, workflow management, team coordination
- **Personality:** Noble English, snark, dark humor
- **Best for:** Daily work, decisions, research direction

### Claude (Subordinate)
- **Model:** claude-3-5-sonnet
- **Role:** Deep debugging, complex coding, specialized tasks
- **Personality:** Direct, technical, second opinion
- **Best for:** When Jasper needs help debugging or complex analysis

### Codex (Available)
- **Model:** gpt-4-turbo
- **Role:** Code review, optimization, complex algorithms
- **Personality:** Code-focused, optimization-driven
- **Best for:** Heavy code work, performance optimization

## Workflow Examples

### Example 1: Daily Work with Jasper

```
1. Morning: Open Claude Code
2. Ask Jasper: "What should I focus on this week?"
3. Jasper: [Responds using deepseek-v4-flash]
4. Work with Jasper on Phase 1 tasks
```

### Example 2: Need Claude for Debugging

```
1. Working with Jasper on a code issue
2. You: "I'm stuck debugging this MEP calculation"
3. Jasper: [Detects "debugging" keyword]
4. Jasper: [Spawns Claude Code subprocess]
5. Claude: [Works on the debugging task]
6. Jasper: [Integrates Claude's result and continues]
```

### Example 3: Switch to Claude for Specialized Work

```
1. .\switch-agent.ps1 -Agent claude
2. Close and reopen Claude Code
3. Ask Claude: "Review this code for security issues"
4. Claude: [Focused code review]
5. .\switch-agent.ps1 -Agent jasper
6. Close and reopen Claude Code
7. Back to Jasper
```

## Configuration Files

| File | Purpose | Edit? |
|------|---------|-------|
| `agents-config.json` | Agent registry | Yes (add new agents) |
| `switch-agent.ps1` | Agent switching script | No (ready to use) |
| `JASPER.md` | Jasper system prompt | Yes (refine personality) |
| `CLAUDE.md` | Claude system prompt | Yes (refine personality) |
| `CODEX.md` | Codex system prompt | Yes (if adding) |
| `.secrets/deepseek.conf` | Deepseek API key | No (keep private) |
| `.secrets/anthropic.conf` | Anthropic API key | No (keep private) |
| `.secrets/openai.conf` | OpenAI API key | No (keep private) |

## Environment Variables Explained

When you switch agents, these are set:

| Variable | Meaning |
|----------|---------|
| `ANTHROPIC_BASE_URL` | Which API endpoint to use |
| `ANTHROPIC_AUTH_TOKEN` | Authentication token/API key |
| `ANTHROPIC_MODEL` | Primary model to use |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | What "Opus" resolves to |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | What "Sonnet" resolves to |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | What "Haiku" resolves to |
| `CLAUDE_CODE_SUBAGENT_MODEL` | Model for spawned subagents |
| `CLAUDE_CODE_EFFORT_LEVEL` | Reasoning effort (max = best) |
| `AGENTIC_OS_AGENT` | Current agent name (metadata) |
| `AGENTIC_OS_AGENT_NAME` | Human-readable agent name |
| `AGENTIC_OS_AGENT_ROLE` | Agent's role description |

## Troubleshooting

### Agent won't switch
```powershell
# 1. Check configuration
.\switch-agent.ps1 -Status

# 2. Verify API credentials exist
Test-Path ".secrets/provider.conf"

# 3. Close Claude Code completely
#    (not minimize, fully quit from tray)

# 4. Wait 5+ seconds
# 5. Reopen Claude Code
```

### "Agent not found" error
```powershell
# List available agents
.\switch-agent.ps1 -List

# Check agents-config.json for typos
```

### Environment variables not persisting
- Run PowerShell as Administrator
- Close and reopen PowerShell after running switch-agent.ps1
- Verify Windows System Properties > Environment Variables

## Best Practices

1. **Use Jasper as default** — Daily work, decisions, planning
2. **Switch agents deliberately** — Not for every task, only when needed
3. **One agent at a time** — Close Claude Code before switching
4. **Document your agents** — Update AGENT.md with personality and role
5. **Keep credentials secure** — .secrets/ files are .gitignored
6. **Test before switching** — Run .\switch-agent.ps1 -Status first

## Future Enhancements

- [ ] Dashboard UI in Claude Code for agent switching
- [ ] Agent selection dropdown in Claude Code menu
- [ ] Task routing (auto-select best agent for task type)
- [ ] Multi-agent collaboration (agents work together)
- [ ] Agent performance metrics and logging
- [ ] Quick-switch keyboard shortcuts

---

**Current Status:** ✓ Agent management system ready  
**Active Agent:** Jasper (deepseek-v4-flash)  
**Available Agents:** 3 (Jasper, Claude, Codex)  
**Management Interface:** PowerShell scripts
