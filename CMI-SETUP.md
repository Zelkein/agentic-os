# CMI Agentic OS Setup Complete

**Date:** May 14, 2026  
**Status:** ✓ Ready for Command Center launch and Phase 1 deployment

## What's Installed

### ✓ Agentic OS v0.2.1
- Location: `P:\Ai\agentic-os-v2`
- Backup of old install: `P:\Ai\agentic-os-v1-backup` (preserved, no data lost)
- Config: DeepSeek + Tailscale restored from old install
- Architecture: Root + multi-client structure enabled

### ✓ CMI Brand Context
- **VOICE.md** — Technical, direct, process-oriented communication style
- **SOUL.md** — Execute autonomously when scope is clear; process-first mentality
- **USER.md** — Frank's profile (70H→50H goal, delegation boundaries)
- **CLAUDE.md** — Claude Code runtime behavior for CMI context

### ✓ MEP Skills (Deployed to `.agents/skills/`)
1. **mep-checklist-validation** — Enforces coordination phase completion before calculation
2. **excel-template-management** — Standardizes HVAC, electrical, plumbing calculations
3. **mep-review-agent** — Automates Frank's 2-hour review process (→ 15 min)

### ✓ MEP Workflows (Deployed to `Workflows/`)
1. **mep-coordination-phase.md** — Team alignment meeting, conflict resolution, sign-off
2. **mep-calculation-phase.md** — Parallel execution with templates, peer review, agent validation

### ✓ Project Structure (`projects/briefs/`)
7 active CMI projects initialized:
1. cpe-lenfantillage (MEP mechanical)
2. 14-units-st-martin-laval (APH)
3. aph-18-units-saint-come (APH)
4. aph-39-units-des-landes (APH)
5. tg-beco-mimosa-4 (TG Beco)
6. tg-beco-mimosa-3 (TG Beco)
7. reno-5-units-marquette (Renovation)

Each project has `.planning/` folder for PROJECT.md, ROADMAP.md, STATE.md, phases/.

### ✓ Team Workspaces (`clients/`)
Isolated workspaces for:
- guiomar (MEP coordination lead)
- safa (mechanical project lead)
- ramy (electrical lead)
- ashley (admin & documentation)

Each client has own brand_context, memory, projects, cron jobs.

### ✓ Command Center
- Location: `agentic-os-v2/command-centre/`
- Dependencies: npm install completed
- Ready to launch: `bash scripts/centre.sh` (or `centre` alias after setup)
- Features: 4-terminal split, task scheduling, project dashboard, notifications

## How to Launch

### Terminal 1: Command Center UI
```bash
cd P:\Ai\agentic-os-v2
bash scripts/centre.sh
# Opens browser at http://localhost:3000
```

### Terminal 2: Claude Code (main workspace)
```bash
cd P:\Ai\agentic-os-v2
claude
# Loads CLAUDE.md, SOUL.md, USER.md, daily memory
```

### Terminal 3: Guiomar's Workspace (coordination lead)
```bash
cd P:\Ai\agentic-os-v2/clients/guiomar
claude
# Loads client-specific CLAUDE.md, memory, projects
```

## Phase 1 Timeline

**Week 1 (May 14-20): Test & Validate**
- Pick one project: 14-units-st-martin-laval (smallest)
- Run mep-coordination-phase workflow
- Collect coordination sign-off
- Hand to Guiomar for facilitation feedback

**Week 2 (May 21-27): Templates & Calculations**
- Safa, Charles, Ramy use Excel templates to calculate
- Run mep-calculation-phase workflow
- MEP Review Agent validates output
- Iterate on template gaps or blockers

**Week 3-4 (May 28-Jun 10): Team Training & Rollout**
- Train Guiomar on coordination facilitation
- Train Safa/Ramy on template workflow
- Deploy to all 7 projects
- Monitor for issues, iterate

**Success Metrics:**
- Coordination phase 100% before any calculation starts (0 redraw/patch cycles)
- Frank's review time: 2 hours → 15 min per project
- Team operates without constant Frank guidance
- ClickUp task signal-to-noise ratio improves (100 → 30-40 actionable tasks)

## What's NOT Done Yet

- [ ] Command Center UI customization (brand colors, logo)
- [ ] ClickUp integration (sync tasks → Command Center dashboard)
- [ ] Cron scheduling for recurring tasks (waiting on Phase 1 insights)
- [ ] AI agent training on Frank's review heuristics (waiting on test project)
- [ ] Team member credentials in clients/ (pending their Claude Code setup)

## Files to Review

**For Frank:**
- CLAUDE.md — runtime behavior customization
- SOUL.md — operating principles
- USER.md — delegation boundaries and tools

**For team leads:**
- Workflows/mep-coordination-phase.md → Guiomar (coordination)
- Workflows/mep-calculation-phase.md → Safa/Ramy (execution)
- .agents/skills/mep-checklist-validation/ → everyone (gate process)
- .agents/skills/excel-template-management/ → Safa/Ramy (standardized calcs)

## Backup Strategy (Safe Ops)

- Old install: `agentic-os-v1-backup/` (keep indefinitely as reference)
- Daily snapshots: `.backup/` directory (auto-created on updates)
- Project briefs: Committed to git, recoverable from GitHub

## Next Session

When you return:
1. bash scripts/centre.sh (silent launch, opens browser)
2. cd agentic-os-v2 && claude (enters familiar context)
3. Memory auto-loads today's session blocks and open threads
4. Ready to deploy Phase 1 on a test project

## Commands Reference

```bash
# Update Agentic OS (preserves brand_context, projects, clients)
bash scripts/update.sh

# Add a new team member workspace
bash scripts/add-client.sh "New Client Name"

# List available skills
bash scripts/list-skills.sh

# Add a skill
bash scripts/add-skill.sh mkt-copywriting

# Switch between workspaces
cd clients/safa && claude  # Safa's isolated context
cd .. && claude            # Back to root (Frank's)
```

---

**Last updated:** May 14, 2026 22:30 UTC  
**System:** CMI Phase 1 Ready for Deployment
