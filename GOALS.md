# Goals

Current objectives and priorities for Frank. All tasks should align with these goals.

---

## Critical Goals (P0 & P1)

### P0 — Protect Health & Safety

#### Goal 1: Reduce to 50H/week without chaos
**Why it matters:** 70H/week is unsustainable. Burnout risk is real.

**What success looks like:**
- Process is documented so team operates when Frank is not available
- Team knows decision framework: Coordination → Calculation → Drawing (always in this order)
- Each person can handle their piece independently
- Automated review system flags errors BEFORE Frank sees them
- Zero crises when Frank reduces hours

**Key results:**
- [ ] ClickUp triage complete (Phase 1, Week 1-4)
- [ ] Process documented and team trained (Phase 1, Week 2-3)
- [ ] MEP checklist system in place (Phase 2)
- [ ] Automated validation catches 80%+ of errors (Phase 3)
- [ ] Team operates autonomously at 5-10H/week freed (Phase 1 success metric)

**Timeline:** Complete by end of Phase 1 (4 weeks)

---

#### Goal 2: Stop the redraw/patch cycle (safety issue)
**Why it matters:** Design errors are caught AFTER drawing starts. This is dangerous, wastes time, kills morale.

**What success looks like:**
- Team follows: Coordination → Calculation → Drawing (always in that order)
- MEP checklist covers 90% of coordination items
- Automated calculation systems verify consistency
- Design errors caught at calculation stage, not patch stage
- Zero redraws due to coordination or calculation errors

**Key results:**
- [ ] Decision framework documented (Phase 1, Week 2)
- [ ] Team trained on process order (Phase 1, Week 3)
- [ ] MEP checklist created (Phase 2)
- [ ] Automated calcs implemented for ductwork, piping, electrical (Phase 2)
- [ ] Redraw/patch cycle eliminated (Phase 2 success metric)

**Timeline:** Complete by end of Phase 2

---

### P1 — Build the Systems

#### Goal 3: MEP Checklist + Automated Calculation System
**Why it matters:** Prevents coordination errors early, catches calculation mistakes automatically.

**What success looks like:**
- Checklist covers 90% of coordination items for all project types
- Automated calcs for ductwork, piping, electrical load, etc.
- Red flags auto-generated for missing items, inconsistencies
- Team uses checklist before moving to drawing phase

**Key results:**
- [ ] Checklist outline created (Phase 1, Week 2)
- [ ] Full checklist built by project type (Phase 2)
- [ ] Automated calcs implemented (Phase 2)
- [ ] Team trained on checklist usage (Phase 2)
- [ ] 90%+ adoption rate (Phase 2 success metric)

**Timeline:** Complete by end of Phase 2

---

#### Goal 4: Convert CAD Tables to Excel + Build Calculation Systems
**Why it matters:** Single source of truth. Design changes auto-propagate. CAD pulls final numbers from Excel.

**What success looks like:**
- All project schedules in Excel (not scattered in CAD)
- Auto-calculation based on design inputs
- Design changes auto-propagate to all downstream calcs
- AutoCAD tables pull final numbers from Excel (read-only)
- No manual table updates in CAD

**Key results:**
- [ ] Excel calculation template created (Phase 2)
- [ ] All project data migrated to Excel (Phase 2)
- [ ] AutoCAD→Excel link established (Phase 2)
- [ ] Automation tested on one project (Phase 2)
- [ ] Deployed to all 7 projects (Phase 2 success metric)

**Timeline:** Complete by end of Phase 2

---

#### Goal 5: Build AI Agent for Intelligent Review (sandboxed)
**Why it matters:** Catches errors before Frank sees them. Reduces manual review time from 2 hours/project to 10 minutes.

**What success looks like:**
- AI agent reads project files securely (read-only, logged)
- Validates: checklist compliance, calculation consistency, coordination, code compliance
- Summarizes issues for Frank (not a wall of data)
- Gives Frank 1-page summary per project instead of 2-hour review
- 95%+ accuracy (catches errors humans miss, few false positives)

**Key results:**
- [ ] Agent architecture designed (Phase 2)
- [ ] Sandboxed environment set up (Phase 3)
- [ ] Agent trained on project files (Phase 3)
- [ ] Tested on 1 project (Phase 3)
- [ ] Deployed to all 7 projects, Frank review time 10 min/project (Phase 3 success metric)

**Timeline:** Complete by end of Phase 3

---

#### Goal 6: Clean Up ClickUp
**Why it matters:** 100 tasks = noise. Makes it hard to see what actually matters.

**What success looks like:**
- Storage list empty (everything routed to project or closed)
- Each project has 3-5 actionable tasks max
- ClickUp shows PROJECT HEALTH not task count
- Team gets 1 task at a time (not overwhelmed)
- Daily ClickUp sync works reliably

**Key results:**
- [ ] All 100 tasks audited (Phase 1, Week 1)
- [ ] Noise identified and moved/closed (Phase 1, Week 1)
- [ ] ClickUp reorganized by process phases (Phase 1, Week 4)
- [ ] 30-40 actionable tasks remaining (Phase 1 success metric)
- [ ] Team automation working (daily sync at 8:02 AM)

**Timeline:** Complete by end of Phase 1

---

## The Four Phases

| Phase | Focus | Outcome | Timeline |
|-------|-------|---------|----------|
| **Phase 1** | ClickUp triage, document process, train team | 30-40 actionable tasks, team knows process, 5-10H/week freed | Weeks 1-4 (NOW) |
| **Phase 2** | Build MEP checklist, Excel calcs, automated validation | Systems in place, calculation errors caught early, redraws eliminated | Weeks 5-12 |
| **Phase 3** | Deploy AI review agent (sandboxed, read-only) | Intelligent review flags errors BEFORE Frank sees them, 10 min review/project | Weeks 13-24 |
| **Phase 4** | Scale safely | Team autonomous, Frank at 50H/week, zero chaos | Weeks 25+ |

---

## Success Metrics (How We Know We're Winning)

**End of Phase 1:**
- ✅ 5-10H/week freed (Frank reports breathing room)
- ✅ ClickUp has 30-40 actionable tasks
- ✅ Team knows decision framework (Coordination → Calculation → Drawing)
- ✅ Process is documented

**End of Phase 2:**
- ✅ MEP checklist in use on all projects
- ✅ Excel calculation systems built
- ✅ Automated validation catching errors early
- ✅ Zero redraws due to coordination/calculation errors

**End of Phase 3:**
- ✅ AI review agent deployed and working
- ✅ Frank review time: 10 minutes/project (vs 2 hours)
- ✅ Agent catching 95%+ of errors
- ✅ No quality degradation

**End of Phase 4:**
- ✅ Frank at 50H/week consistently
- ✅ Team operates autonomously
- ✅ Zero crises when Frank reduces hours
- ✅ System is sustainable long-term

---

## Review Cadence

- **Daily:** ClickUp sync at 8:02 AM, check active tasks
- **Weekly:** Assess Phase 1 progress, update team on blockers
- **Monthly:** Review key results progress, adjust if needed
- **Quarterly:** Plan next phase, iterate on process

---

## Decision Framework (Teach the Team This)

**Every project must follow this order, always:**

1. **COORDINATION FIRST**
   - Get all disciplines aligned (mechanical, electrical, plumbing, structural, etc.)
   - No conflicts between systems
   - MEP checklist 100% complete
   - Then move to calculation

2. **CALCULATION SECOND**
   - Engineering calcs for ductwork, piping, electrical load, etc.
   - Automated validation systems check consistency
   - Any errors caught here (not later)
   - Then move to drawing

3. **DRAWING LAST**
   - CAD/AutoCAD production (final step, only after calcs are done)
   - Pull numbers from Excel (not manual input)
   - Should be straightforward if coordination and calcs are done right

**Why:** Redraw/patch cycle happens when design errors are caught AFTER drawing starts. This order prevents that.
