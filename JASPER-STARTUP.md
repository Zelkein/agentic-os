# Jasper Orchestrator - Auto-Launch Setup

Jasper is now your Primary Orchestrator Agent running on deepseek-v4-flash.

## Auto-Launch Options

### Option 1: Windows Task Scheduler (Recommended)
Run once to set up permanent auto-launch:

```powershell
cd "P:\Ai\Agentic OS"
& .\launch-jasper.ps1
```

This schedules Jasper to launch automatically every time Windows starts.

**Verify it worked:**
- Open Task Scheduler
- Navigate to: Task Scheduler Library
- Look for: `JasperOrchestrator`
- Status should show: "Ready"

**To disable/remove:**
```powershell
Unregister-ScheduledTask -TaskName "JasperOrchestrator" -Confirm:$false
```

### Option 2: Manual Launch (One-Time)
```powershell
cd "P:\Ai\Agentic OS"
$env:PYTHONIOENCODING="utf-8"
& "C:\Users\Frank\AppData\Local\Python\pythoncore-3.14-64\python.exe" jasper.py
```

## What Jasper Does

- **Primary orchestrator** for your Agentic-OS framework
- **Runs on deepseek-v4-flash** (independent from Claude)
- **Loads your context**: GOALS.md, CLAUDE.md, memory/
- **Manages Phase 1-4** transition from 70H/week → 50H/week
- **Spawns subagents** for specialized tasks
- **Uses 47 skills** and 11 workflows

## When to Use Claude

Only call Claude Code for:
- Debugging difficult technical issues
- When Jasper needs a second opinion
- Complex coding tasks where you want multiple perspectives

Otherwise, Jasper is your main interface.

---

**Status:** ✓ Ready to go
**Model:** deepseek-v4-flash
**Location:** P:\Ai\Agentic OS
