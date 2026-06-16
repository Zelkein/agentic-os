# AI Review Agent — Architecture Design

**Status:** Design complete — ready for Phase 3 implementation  
**Created:** 2026-06-04  
**System:** P1 System 3 — Build AI Agent for Intelligent Review  
**Target:** Reduce Frank's review time from 2 hours/project to 10 minutes/project

---

## Design Decisions (from Frank's answers)

| Decision | Rationale |
|----------|-----------|
| Read-only first | Read well, judge well, log well — no write rights needed for value |
| Suggest corrections, never auto-modify | Agent is reviewer, not autonomous designer |
| Backup every modification | If/when write access is granted, every change is backed up |
| Log per project per review pass | Full trace: seen, blocked, tolerated, corrected |
| 1-page summary → Frank first | Controlled beta; expand to team when reliable |
| Critical / Warning / Informational tiers | Clear escalation, no false alarm fatigue |
| Trained per project type | APH ≠ commercial ≠ renovation |
| 20-item review checklist automated | Frank's mental checklist is the core validation engine |
| Codes: Quebec → Canada → CSA → Manufacturer | Priority hierarchy |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    AI REVIEW AGENT                       │
├─────────────────────────────────────────────────────────┤
│  INPUT LAYER                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Excel    │ │ PDF      │ │ ClickUp  │ │ Text Notes │ │
│  │ (calcs)  │ │ (plans)  │ │ (tasks)  │ │ (specs)    │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘ │
│       └─────────────┴────────────┴─────────────┘        │
│                         │                                │
│  VALIDATION ENGINE                                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │  20-Item Review Checklist (from Frank's brain)    │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │   │
│  │  │Version  │ │Hypo-    │ │Spatial  │ │Code    │ │   │
│  │  │check    │ │theses   │ │coord.   │ │check   │ │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                                │
│  OUTPUT LAYER                                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  1-Page Summary  │  Review Log  │  Red Flags     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## The 20-Item Automated Review Checklist

Each item maps to Frank's manual review process, now automated:

| # | Check | Data Source | Criticality |
|---|-------|------------|-------------|
| 1 | **Correct project version** — are we reviewing the latest drawings/calcs? | File metadata, version stamps | 🔴 Critical |
| 2 | **Design assumptions verified** — are assumptions documented and current? | ASSUMPTIONS sheet | 🔴 Critical |
| 3 | **Discipline/mandate scope clear** — is scope matching contract? | PROJECT sheet, contract PDF | 🔴 Critical |
| 4 | **Architecture & structure current** — no pending arch/struct changes? | ClickUp tasks, PDF date stamps | 🟡 Warning |
| 5 | **Shafts available & sized** — all MEP shafts confirmed? | PDF plans, COORD-001 | 🔴 Critical |
| 6 | **Equipment rooms sufficient** — dimensions ≥ equipment + clearances? | EQUIPMENT sheet, PDF plans | 🔴 Critical |
| 7 | **Maintenance access provided** — filter/coil/belt access paths? | COORD-011 checklist | 🟡 Warning |
| 8 | **Equipment selection coherent** — model matches load requirements? | Cross-ref HVAC ↔ EQUIPMENT | 🔴 Critical |
| 9 | **Loads coherent** — cooling/heating/electrical loads consistent? | HVAC + ELECTRICAL sheets | 🔴 Critical |
| 10 | **Airflows coherent** — CFM consistent load→equipment→duct? | COORD-008, HVAC sheet | 🔴 Critical |
| 11 | **Ducts/pipes/feeders sized correctly** — dimensions match flows? | MECH-001, PLUMBING, ELECTRICAL | 🔴 Critical |
| 12 | **Drainage/condensate/vents complete** — all drains and vents addressed? | COORD-010, PLUM-002, PLUMBING | 🔴 Critical |
| 13 | **Ceiling/roof coordination** — plenum depth OK, roof screens adequate? | COORD-002, COORD-014 | 🔴 Critical |
| 14 | **Fire-rated penetrations addressed** — all rated wall/floor penetrations sealed? | COORD-003, CROSS-002 | 🔴 Critical |
| 15 | **Schedules match plans** — equipment schedule ↔ plan annotations? | EQUIPMENT sheet, PDF plans | 🔴 Critical |
| 16 | **Essential annotations present** — all required notes on drawings? | PDF plans (text extraction) | 🟡 Warning |
| 17 | **Constructability acceptable** — can this actually be built? | Spatial analysis, clearance checks | 🟡 Warning |
| 18 | **Code/standards compliance** — Quebec → Canada → CSA → manufacturer | Code reference tables | 🔴 Critical |
| 19 | **Nothing important left implicit** — all interfaces explicitly defined? | COORD-015 | 🟡 Warning |
| 20 | **Ready to draw or still in design?** — gating decision | All above checks | 🔵 Info |

---

## Severity Classification

### 🔴 Critical
Error that makes the design **false, non-compliant, or impossible to construct**. Blocks progression to next phase.

**Examples:**
- Equipment undersized by >20%
- Missing fire-rated penetration sealing
- Shaft too small for required ductwork
- CFM mismatch >10% between load and duct schedule

### 🟡 Warning
Point that is **doubtful, incomplete, or suboptimal** but resolvable without full redesign.

**Examples:**
- Duct velocity near upper limit (within tolerance)
- Missing maintenance access door (not blocking construction)
- Annotation incomplete on minor detail

### 🔵 Informational
**Observation, optimization opportunity, or FYI** that doesn't block anything.

**Examples:**
- "Consider upsizing this duct for future expansion"
- "Schedule shows model X — model Y is more efficient at this duty point"
- "Design appears complete for this scope"

---

## Review Log Format

Every review pass creates a log file:

```json
{
  "reviewId": "REV-2026-06-04-001",
  "projectSlug": "14-units-st-martin-laval",
  "projectType": "aph",
  "timestamp": "2026-06-04T14:00:00Z",
  "reviewerAgent": "mep-review-agent",
  "filesReviewed": [
    { "path": "projects/briefs/14-units-st-martin-laval/calcs/HVAC.xlsx", "hash": "sha256:abc..." },
    { "path": "projects/briefs/14-units-st-martin-laval/plans/M-101.pdf", "hash": "sha256:def..." }
  ],
  "checklistResults": [
    { "id": 1, "check": "Correct project version", "status": "passed", "detail": "Version 2026-05-28 confirmed" },
    { "id": 8, "check": "Equipment selection coherent", "status": "failed", "detail": "RTU-1 selected at 5 tons but load calc shows 7.2 tons required", "recommendation": "Re-select RTU-1 for minimum 7.5 ton capacity" }
  ],
  "summary": {
    "overallStatus": "BLOCKED",
    "criticalFailures": 1,
    "warnings": 3,
    "infoItems": 2,
    "passedItems": 14,
    "recommendation": "Address RTU-1 undersizing before proceeding. Review 3 warnings at team's discretion."
  }
}
```

---

## 1-Page Summary Template

Each project review generates this summary for Frank:

```
═══════════════════════════════════════════
  REVIEW SUMMARY — 14 Units St-Martin Laval
═══════════════════════════════════════════
  Date:     June 4, 2026
  Type:     APH
  Status:   BLOCKED (1 critical)
  Phase:    Coordination → ⚠️ Not cleared for Calculation
═══════════════════════════════════════════

🔴 CRITICAL (1)
  → RTU-1 undersized: 5T selected vs 7.2T required (MECH-008)
    Impact: Insufficient cooling for zones 2-4
    Fix: Re-select RTU-1 to min 7.5T, verify electrical circuit

🟡 WARNINGS (3)
  → Duct velocity 1480 fpm in segment M-12 (limit 1500)
  → Filter access unclear for AHU-3 (verify with architect)
  → Condensate drain slope marginal at 1/8" per ft (verify)

🔵 INFO (2)
  → RTU-3 has capacity margin for future zone 5
  → Consider switching to ECM motors for energy rebate

───────────────────────────────────────────
  Passed: 14/20 checks
  Files reviewed: 8 (Excel: 2, PDF: 6)
  Review time: 2.3 seconds
  Log: .reviews/2026-06-04-001.json
═══════════════════════════════════════════
```

---

## Implementation Phases

### Phase 3A — Read-Only Review (Weeks 13-16)
- [ ] File ingestion pipeline (Excel parser, PDF text extraction, ClickUp API)
- [ ] 20-item checklist validation engine
- [ ] Critical / Warning / Info classification logic
- [ ] 1-page summary generator
- [ ] Review log writer (JSON per project per pass)
- [ ] Manual validation against Frank's reviews on 3 test projects
- [ ] **Success metric:** Agent catches ≥80% of errors Frank would have found

### Phase 3B — Training & Tuning (Weeks 17-20)
- [ ] Curate training dataset from 10-20 completed projects
- [ ] Per-project-type tuning (APH, commercial, renovation)
- [ ] Frank reviews agent output and corrects → feedback loop
- [ ] Reduce false positive rate <10%
- [ ] **Success metric:** Frank review time drops to 30 min/project

### Phase 3C — Team Deployment (Weeks 21-24)
- [ ] 1-page summary sent to Frank + lead/chargé (when reliable)
- [ ] Review log integrated into project folder
- [ ] Dashboard widget showing review status per project
- [ ] **Success metric:** Frank review time drops to 10 min/project, team uses agent independently

---

## Sandboxing & Security

| Requirement | Implementation |
|-------------|---------------|
| Read-only file access | All ingestion paths are read-only, no write permission |
| Full access logging | Every file read is logged with hash, timestamp, and agent identity |
| Backup before any write | If write access is ever granted: `cp file.ext .backups/YYYY-MM-DD/file.ext.bak` before modification |
| No network egress | Review runs locally, no data leaves the project directory |
| Workspace isolation | Agent only accesses project directories, not system files |

---

## Integration Points

| System | Integration |
|--------|------------|
| **MEP Checklist Skill** | Review agent calls `mpt-mep-checklist` to validate coordination items |
| **Excel Template** | Review agent reads and cross-validates all 8 sheets |
| **ClickUp** | Review agent reads task status; (future) creates review-passed tasks |
| **Command Center** | Dashboard shows review status per project |
| **Cron** | Scheduled reviews: nightly for active projects, weekly for stable projects |

---

*Architecture document created: 2026-06-04*
*Ready for Phase 3 implementation — start with file ingestion pipeline + Excel parser*
