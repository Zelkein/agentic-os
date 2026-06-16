# Jasper as Primary Orchestrator

## Architecture

**Jasper is your primary interface. Claude is your asynchronous subordinate.**

```
User → Jasper (deepseek-v4-flash, always responsive)
         ↓
      [Claude needed?]
         ├─ Yes → Spawn Claude Code (background) → Jasper continues
         └─ No → Jasper handles directly
```

Jasper controls the workflow and never blocks. When Jasper encounters a task that requires:
- Deep technical debugging
- Complex coding needing multiple perspectives  
- When Jasper is stuck

Jasper spawns a Claude Code instance and **keeps working**. Claude runs in the background. Jasper checks for completed Claude tasks on the next interaction.

## How to Use

### 1. Launch Jasper (Primary Interface)

```powershell
cd "P:\Ai\Agentic OS"
$env:PYTHONIOENCODING="utf-8"
& "C:\Users\Frank\AppData\Local\Python\pythoncore-3.14-64\python.exe" jasper.py
```

You'll see:
```
======================================================================
JASPER ORCHESTRATOR — Primary Interface
Model: deepseek-v4-flash (Deepseek API)
Status: Independent, Claude available as subordinate tool
======================================================================

Talk to Jasper. Type 'exit' to quit.

You: 
```

### 2. Interact with Jasper

Jasper is now YOUR main agent. Ask him anything:

```
You: What should I focus on this week?
You: Process my ClickUp backlog
You: Create Phase 1 task outline
```

Jasper reads GOALS.md, CLAUDE.md, and memory/ automatically.

### 3. When Jasper Invokes Claude (Asynchronous)

If your request contains keywords like:
- "debugging"
- "stuck"
- "second opinion"
- "complex coding"
- "invoke claude"

Jasper will:
1. Create a task file in `Tasks/claude_subtask_*.md`
2. Spawn Claude Code in a new window (non-blocking)
3. **Return immediately** — Jasper doesn't wait
4. Jasper continues with other work
5. Claude works in the background
6. On the next interaction, Jasper checks if Claude has completed anything

Example:

```
You: I'm stuck debugging the MEP checklist automation — invoke Claude
[Jasper creates Tasks/claude_subtask_20260513_145330.md]
[Jasper spawns Claude Code in background]
Jasper: I've delegated this to Claude. I'll continue with other work. Check back later and I can integrate Claude's result.

You: Meanwhile, what tasks should I prioritize for Phase 1?
[Jasper checks for completed Claude tasks...]
Jasper: No completed Claude tasks yet. But regarding Phase 1... [responds about Phase 1]

[Later, Claude completes the debugging task and marks it done]

You: What's the status?
[Jasper detects Claude's completed work]
Jasper: Ah, Claude has finished the debugging task. Here's what he found...
```

### 4. Control Flow (Non-Blocking)

```
You → Jasper (primary, always responsive)
         ↓
   [Check for completed Claude tasks]
         ↓
   [Detect if this task needs Claude?]
         ├─ Yes: "debugging", "stuck", etc.
         │   ├─ Create task file
         │   ├─ Spawn Claude Code (background)
         │   └─ Return immediately to you
         └─ No
             └─ Handle with Jasper alone
         ↓
      Response to you (Jasper never blocks)
         ↓
   Claude works asynchronously in background window
```

**Key point:** Jasper never waits for Claude. You get a response immediately. Claude works independently. Results integrate on the next interaction.

### 5. Claude Code as Subordinate

Claude Code opens in a separate window with:
- The same workspace context (P:\Ai\Agentic OS)
- Access to the task file created by Jasper
- All your skills, workflows, and memory

Claude updates the task file when complete. Jasper detects completion and continues.

## When to Use What

| Situation | Who | How |
|-----------|-----|-----|
| Daily work, decisions, planning | Jasper | Talk to Jasper directly |
| Tactical questions ("What next?") | Jasper | Talk to Jasper directly |
| Stuck on a complex problem | Both | Say "invoke claude" to Jasper |
| Need deep debugging | Both | Say "debugging" or "stuck" to Jasper |
| Need editing/file operations | Both | Jasper routes to Claude if needed |

## Config Notes

- `.claude/settings.json` — NO SessionStart hook (Jasper is launched manually)
- `JASPER.md` — Wrapper file defining Jasper's role (Claude Code reference only)
- `jasper.py` — Main orchestrator script (this is what you run)
- `.secrets/deepseek.conf` — API credentials (already configured)

## Quick Start

1. Open PowerShell
2. `cd "P:\Ai\Agentic OS"`
3. `$env:PYTHONIOENCODING="utf-8" ; & "C:\Users\Frank\AppData\Local\Python\pythoncore-3.14-64\python.exe" jasper.py`
4. Wait for Jasper prompt
5. Ask: "What should I focus on this week?"
6. Jasper loads your context and responds

---

**Status:** ✓ Ready to go  
**Model:** deepseek-v4-flash  
**Architecture:** Jasper primary, Claude subordinate  
**Updated:** 2026-05-13
