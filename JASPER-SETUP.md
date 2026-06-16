# Jasper Setup — Complete

**Date:** 2026-05-13  
**Status:** ✅ Ready to deploy  
**Model:** deepseek-v4-flash  
**Framework:** Agentic-OS (ecstatic-almeida-ba27a2)

---

## What Was Set Up

### Core Files
- ✅ `.agents/JASPER.md` — Full agent definition, capabilities, personality, integrations
- ✅ `JASPER-START.md` — Quick start guide (read this first)
- ✅ `.secrets/deepseek.conf` — Deepseek API key (gitignored)
- ✅ `.secrets/tailscale.conf` — Tailscale VPN config (gitignored)

### Context Files (Updated)
- ✅ `CLAUDE.md` — Full team, projects, terminology, crisis context
- ✅ `GOALS.md` — P0/P1 goals, 4 phases, decision framework
- ✅ `BACKLOG.md` — Quick capture inbox
- ✅ `TASKS.md` — Local task tracking
- ✅ `memory/glossary.md` — Terms, acronyms, status codes
- ✅ `memory/people/frank.md` — Frank's situation and preferences
- ✅ `memory/people/team.md` — Team roster and training needs
- ✅ `memory/projects/projects.md` — All 7 projects
- ✅ `memory/context/CMI.md` — Company context
- ✅ `memory/context/workspace.md` — Agentic-OS overview
- ✅ `dashboard.html` — Visual task board

### Dashboard
- ✅ Open from file browser to see task board visually

---

## The Situation (Why Jasper Exists)

**The Crisis:**
- Frank working 70H/week (unsustainable)
- Young team needs constant guidance
- No documented process; Frank is the mental model
- Redraw/patch cycle (design errors caught AFTER drawing starts) — safety issue
- Manual review is the time killer (Frank checks everything)
- ClickUp: 100 tasks, low signal-to-noise

**The Goal:**
Reduce to **50H/week without chaos** by end of Phase 3 (Month 6)

**The Solution:**
4 phases: (1) breathing room, (2) systems, (3) AI review, (4) scale

---

## Jasper's Personality

Noble English speaker with dry wit, dark humor, reverse psychology:

> "70 hours per week? Splendid. That's only triple what reasonable humans work. Carry on."

> "Should I train the team?" — "Absolutely not. Far better to review everything manually forever."

> "Your situation is rather dire. But fear not—we shall engineer your escape. Or die trying."

The snark is a feature. It keeps you sane while dealing with this crisis.

---

## How to Launch Jasper

### Option 1: Ask a question
```
"What should I focus on this week?"
```

Jasper will:
- Load GOALS.md, CLAUDE.md, memory/
- See you're in Phase 1 (P0: ClickUp triage)
- Recommend ClickUp audit as #1 action
- Offer to spawn subagents

### Option 2: Follow JASPER-START.md
Read `JASPER-START.md` for:
- What Jasper does
- How to talk to it
- Key concepts
- Integration points
- Testing checklist
- Success metrics

---

## Integration Points

| System | Status | Details |
|--------|--------|---------|
| **Deepseek API** | ✅ Configured | Model: deepseek-v4-flash, Key in .secrets/ |
| **Shared Memory** | ✅ Ready | P:\Ai\claude-cowork-memory.db |
| **Email** | ✅ OAuth | Personal + work Gmail |
| **Tailscale VPN** | ✅ Configured | 7 machines, SSH access |
| **ClickUp** | ✅ Sync ready | Daily at 8:02 AM |
| **Local Files** | ✅ Ready | GOALS.md, CLAUDE.md, memory/ |

---

## Phase 1 Task (YOUR FOCUS NOW)

### ClickUp Triage — 4 weeks

**Week 1:** Audit ClickUp (100 tasks → identify noise vs actionable)  
**Week 2:** Document process (Coordination → Calculation → Drawing)  
**Week 3:** Train team (walk them through decision framework)  
**Week 4:** Reorganize ClickUp (create task structure around process phases)  

**Success Metric:** 30-40 actionable tasks, team knows process, 5-10H/week freed

**How Jasper helps:**
- "What should I audit first?" — Jasper suggests priority order
- "How do I document the process?" — Jasper explains Coordination→Calculation→Drawing
- "How do I train the team?" — Jasper recommends live example approach
- "Is ClickUp clean now?" — Jasper confirms or suggests next cleanup pass

---

## The Decision Framework (Teach the Team)

**Every project, always follow this order:**

1. **COORDINATION FIRST** — All disciplines aligned (no conflicts)
2. **CALCULATION SECOND** — Engineering calcs, verify consistency
3. **DRAWING LAST** — CAD production (should be straightforward)

This prevents the redraw/patch cycle (design errors caught after drawing starts).

---

## Quick Reference: Files to Know

| File | Purpose |
|------|---------|
| `JASPER-START.md` | **Read first** — quick start guide |
| `.agents/JASPER.md` | Full Jasper definition (reference) |
| `GOALS.md` | P0/P1 goals, 4 phases, success metrics |
| `CLAUDE.md` | Team, projects, crisis context |
| `BACKLOG.md` | Quick capture inbox |
| `dashboard.html` | Visual task board (open in browser) |
| `memory/people/frank.md` | Frank's situation |
| `memory/people/team.md` | Team roster |
| `memory/projects/projects.md` | All 7 projects |

---

## Success Checklist

After launching Jasper, verify:

- ✅ Deepseek API is responding (check .secrets/deepseek.conf)
- ✅ Jasper reads GOALS.md and understands P0 priorities
- ✅ Jasper can spawn subagents (Claude Code, Planning, etc.)
- ✅ Shared memory DB is accessible
- ✅ Jasper exhibits personality (snark, wit, dark humor)
- ✅ Can ask "What should I focus on this week?" and get Phase 1 recommendation
- ✅ Dashboard.html opens and shows task board

If all ✅, Jasper is ready.

---

## Next Steps

1. **Now:** Read JASPER-START.md
2. **Ask Jasper:** "What should I focus on this week?"
3. **Week 1:** Audit ClickUp (Jasper will guide you)
4. **Week 2-3:** Document process and train team
5. **Week 4:** Reorganize ClickUp
6. **End of Phase 1:** 30-40 actionable tasks, team knows process, 5-10H/week freed

**Then move to Phase 2:** Build MEP checklist, Excel calcs, automated validation

---

## Notes

- **Jasper is your orchestrator**, not just a chat bot
- **Personality matters** — the snark helps you stay sane
- **Context is key** — Jasper always reads GOALS.md and CLAUDE.md first
- **Evidence matters** — Jasper verifies before claiming success
- **Transparency matters** — Jasper shows reasoning, not just conclusions

---

**You're ready. Jasper is live. Go ask it something.**
