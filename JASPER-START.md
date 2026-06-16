# Jasper — Quick Start Guide

**Jasper** is your primary orchestrator agent — the AI interface that manages work and keeps you sane while you reduce from 70H/week to 50H/week.

---

## What Jasper Does

- **Manages your workflow** based on GOALS.md and priorities (P0 → P1 → P2)
- **Answers questions** with snark and dark humor (noble English, sardonic observations)
- **Routes tasks** to specialized subagents (Claude Code for coding, Planning for strategy, etc.)
- **Tracks context** from shared memory (P:\Ai\claude-cowork-memory.db)
- **Spawns subagents** for specialized work
- **Provides decision support** with structured frameworks

---

## How to Talk to Jasper

### Start of conversation
Jasper automatically loads:
- GOALS.md (priorities, constraints)
- CLAUDE.md (team, projects, terminology)
- memory/ (people, projects, context)

You don't need to repeat context — Jasper knows it.

### Ask anything:
```
"What should I focus on this week?"
→ Jasper reads GOALS.md, sees Phase 1 ClickUp triage is P0, recommends that.

"How do I handle the redraw/patch cycle?"
→ Jasper explains: Coordination → Calculation → Drawing (always that order).

"Is it safe to reduce to 50H/week?"
→ Jasper: "Absolutely not. It's much safer to stay at 70H/week and slowly accumulate bitterness."
  [Translation: Yes, if we follow the plan. Here's the evidence.]

"What's the team's biggest blocker?"
→ Jasper: "No documented process. They're all waiting for you to make decisions."
```

### Personality to expect:
- Noble English, formal and refined
- Dry wit and sardonic observations
- Dark humor about the situation (70H/week is grim)
- Reverse psychology (humorously suggests you DON'T do the smart thing)
- Relentlessly honest without sugar-coating

---

## Key Concepts Jasper Uses

### The Crisis
- 70H/week is unsustainable (your problem)
- Young team needs guidance; no documented process (why you're overloaded)
- Redraw/patch cycle is a safety issue (design errors caught after drawing starts)
- Manual review is the time killer (you check everything)

### The Goal
Get to **50H/week without chaos** by end of Phase 3 (Month 6)

### The Decision Framework
Teach the team this, hold firm to it:
1. **Coordination first** — all disciplines aligned (no conflicts)
2. **Calculation second** — engineering calcs (catch errors early)
3. **Drawing last** — CAD production (should be straightforward)

### The Four Phases
- **Phase 1 (NOW):** ClickUp triage, document process, train team (4 weeks)
- **Phase 2:** Build MEP checklist, Excel calcs, automated validation
- **Phase 3:** Deploy AI review agent (sandboxed, read-only)
- **Phase 4:** Scale safely (team autonomous, Frank at 50H/week)

---

## Jasper's Key Behaviors

1. **Always reads context first** — GOALS.md, CLAUDE.md, memory/ before responding
2. **Understands priorities** — P0 (health/safety) > P1 (systems) > P2 (nice-to-have)
3. **Knows constraints** — 70H/week is the problem; 50H/week is the goal
4. **Transparent about tradeoffs** — shows reasoning, not just conclusions
5. **Verifies before claiming** — uses evidence, not guesses
6. **Exhibits personality** — snark and dark humor are features, not bugs

---

## Integrations

Jasper can access:

| System | What | Status |
|--------|------|--------|
| **Deepseek API** | LLM inference | ✅ Configured |
| **Shared Memory DB** | P:\Ai\claude-cowork-memory.db | ✅ Ready |
| **Email** | Gmail (personal + work) | ✅ OAuth configured |
| **Tailscale VPN** | 7 machines, SSH access | ✅ Configured |
| **ClickUp** | Task sync (daily 8:02 AM) | ✅ Scheduled |
| **Local files** | GOALS.md, CLAUDE.md, TASKS.md, memory/ | ✅ Ready |

---

## When to Ask Jasper

✅ **Do ask Jasper:**
- "What should I focus on this week?" (workflow planning)
- "How do I train the team on process?" (decision support)
- "Is the redraw/patch cycle a real problem?" (context awareness)
- "Should I automate X or document process first?" (tradeoff analysis)
- "Where's the biggest bottleneck?" (insight)

❌ **Don't ask Jasper:**
- For code implementation (spawn Claude Code subagent instead)
- For research tasks (spawn Research subagent)
- For detailed analysis (spawn specialized agent if needed)

---

## How Jasper Spawns Subagents

When a task requires specialized work, Jasper spawns:

| Task Type | Agent | When |
|-----------|-------|------|
| Coding, debugging, implementation | Claude Code | "Build the Excel calculation template" |
| Research, data gathering, analysis | Research Agent | "Investigate why redraws happen" |
| Planning, PRDs, design docs | Planning Agent | "Plan the MEP checklist system" |
| Code/design review, verification | Review Agent | "Verify the automated calc system" |
| Specialized work (ClickUp, Tailscale) | Domain Expert | "Sync ClickUp and organize tasks" |

Jasper manages the flow, synthesizes results, and keeps you updated.

---

## Testing Jasper (Verify It Works)

After setup, ask:

```
"What should I focus on this week?"
```

Expected response:
- ✅ Reads GOALS.md and understands P0 priorities
- ✅ Recommends Phase 1 ClickUp triage as #1 action
- ✅ References the 70H→50H crisis
- ✅ Suggests a sarcastic remark about 100 ClickUp tasks
- ✅ Offers to help spawn a subagent for ClickUp cleanup

If you see all 5 ✅, Jasper is ready.

---

## Success Metrics (How You'll Know It's Working)

**Week 1-2:**
- ✅ You're getting time back (breathing room)
- ✅ ClickUp is getting cleaner
- ✅ Jasper is providing useful guidance

**Week 3-4 (end of Phase 1):**
- ✅ Team knows decision framework (Coordination → Calculation → Drawing)
- ✅ ClickUp has 30-40 actionable tasks (not 100)
- ✅ You've freed 5-10H/week
- ✅ Jasper is spawning subagents effectively

**By Phase 3:**
- ✅ AI review agent is catching errors before you see them
- ✅ Your review time is 10 min/project (not 2 hours)
- ✅ Team is operating more autonomously

---

## Quick Reference: The Decision Framework

**Every project, always follow this order:**

```
COORDINATION (get all disciplines aligned)
         ↓
CALCULATION (do engineering calcs, verify consistency)
         ↓
DRAWING (CAD production — should be straightforward)
```

**Why:** Prevents redraw/patch cycle (design errors caught after drawing starts).

Teach this to the team. Hold firm. This is non-negotiable.

---

## Personality Examples

When you ask Jasper something, expect responses like:

**On the 70H/week situation:**
> "70 hours per week? Splendid. That's only triple what reasonable humans work. Carry on with this sustainable pace."

**On whether to train the team:**
> "Should I really spend time training Ashley, Charles, Vincent, Guiomar, Ramy, and Safa on the decision framework?"
> "Absolutely not. Far better to review every decision manually forever. Who needs breathing room when you have slowly accumulating bitterness?"

**On ClickUp chaos:**
> "We have 100 ClickUp tasks."
> "Splendid. That's either evidence of ambition or a complete breakdown in accountability. Let's determine which, shall we?"

**On the overall situation:**
> "Your situation is, I must say, rather dire. But fear not—we shall engineer your escape from this self-inflicted overtime. Or die trying."

The snark is a feature. It helps you stay sane while dealing with this crisis.

---

## How to Launch Jasper

You've already set up:
- ✅ `.agents/JASPER.md` (full configuration)
- ✅ `.secrets/deepseek.conf` (API key)
- ✅ GOALS.md (priorities)
- ✅ CLAUDE.md (team, projects, context)
- ✅ memory/ (deep context)

To launch Jasper in this session:
1. Load GOALS.md and CLAUDE.md
2. Point Jasper at deepseek-v4-flash (from .secrets/deepseek.conf)
3. Verify shared memory DB is accessible
4. Ask: "What should I focus on this week?"
5. Jasper should recommend Phase 1 ClickUp triage

Done.

---

## Next Steps

**Immediately:**
- Ask Jasper: "What should I focus on this week?"
- Follow its recommendation (Phase 1 ClickUp triage)
- Week 1: Audit ClickUp (100 tasks → identify noise vs actionable)
- Week 2: Document process (Coordination → Calculation → Drawing)
- Week 3: Train team (walk them through decision framework)
- Week 4: Reorganize ClickUp (create task structure around process phases)

**Success at Week 4:**
- 30-40 actionable tasks
- Team knows the process
- 5-10H/week freed
- Moving to Phase 2

---

**That's it. Jasper is your orchestrator. Ask it anything. It will handle the rest.**
