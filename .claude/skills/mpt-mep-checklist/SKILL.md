---
name: MEP Coordination Checklist
description: Comprehensive checklist for MEP coordination validation across all project types. Prevents errors before calculation and drawing phases. Modular by discipline and project type.
category: mpt
triggers:
  - "run mep checklist"
  - "check coordination"
  - "validate mep"
  - "coordination review"
  - "mep checklist"
  - "run coordination checklist"
dependencies: []
---

# MEP Coordination Checklist

## Overview

This skill provides a comprehensive MEP (Mechanical, Electrical, Plumbing, Fire Protection) coordination checklist that enforces the **Coordination → Calculation → Drawing** decision framework. It prevents coordination errors from reaching the drawing phase, breaking the costly redraw/patch cycle.

**Core philosophy:** Each item must be verified at the coordination phase before any calculation or drawing begins. The checklist gates progression through the design pipeline.

## How Agents Use This Skill

When triggered, the agent:
1. **Identifies the project type** and loads the appropriate module(s)
2. **Runs checklist items** against available project data (Excel, PDFs, specs)
3. **Returns structured results** with pass/fail/warning per item
4. **Generates a summary** for the reviewer with critical items highlighted
5. **Blocks progression** if critical items fail — calculation phase must not start until coordination is cleared

## Output Format

```json
{
  "skill": "mpt-mep-checklist",
  "timestamp": "ISO-8601",
  "projectType": "commercial-office",
  "disciplinesChecked": ["mechanical", "electrical", "plumbing"],
  "results": {
    "mechanical": { "totalItems": 25, "passed": 22, "failed": 2, "warnings": 1, "items": [...] },
    "electrical": { "totalItems": 20, "passed": 18, "failed": 1, "warnings": 1, "items": [...] },
    "plumbing": { "totalItems": 18, "passed": 17, "failed": 1, "warnings": 0, "items": [...] }
  },
  "summary": {
    "overallStatus": "CONDITIONAL_PASS",
    "criticalItemsFailed": 2,
    "recommendation": "Address 2 failed mechanical items before proceeding to calculations"
  }
}
```

## Project Type Modules

The checklist has a **common core** plus **type-specific modules**:

| Module | Project Type | Key Differences |
|--------|-------------|-----------------|
| `core` | All projects | Universal coordination items |
| `aph` | APH (multi-unit residential) | Repetitive layouts, energy compliance |
| `commercial` | Commercial / mixed-use | Kitchens, retail, complex HVAC |
| `industrial` | Industrial | Heavy equipment, process loads |
| `renovation` | Renovation / retrofit | Existing conditions, phased demo |
| `healthcare` | Healthcare / institutional | Infection control, redundancy |

An agent should load `core` + one type module per project.

---

## Core Checklist (All Project Types)

### COORD-001: Shafts & Risers
**Item:** Verify all MEP shafts/risers are correctly sized and positioned.
**Check:** Compare shaft dimensions against required ductwork, piping, and conduit sizes. Verify structural openings match MEP needs.
**Fail if:** Any shaft is undersized, missing, or conflicts with structure.
**Priority:** 🔴 Critical

### COORD-002: Ceiling / Plenum Space
**Item:** Verify ceiling void / plenum depth is sufficient for all MEP distribution.
**Check:** Map deepest duct + insulation + structure depth against available plenum. Verify access for maintenance.
**Fail if:** Available space is less than required by any trade.
**Priority:** 🔴 Critical

### COORD-003: Fire-Rated Penetrations
**Item:** Verify all MEP penetrations through fire-rated walls/floors are identified and coordinated.
**Check:** Cross-reference fire separation drawings against MEP routing. Confirm fire-stopping details exist.
**Fail if:** Any unaddressed penetration through a rated assembly.
**Priority:** 🔴 Critical

### COORD-004: Drain Slopes vs Structure
**Item:** Verify all gravity drains have adequate slope without structural conflicts.
**Check:** Trace drain runs from fixture to stack. Verify 1/4" per foot minimum slope. Check beam/joist conflicts.
**Fail if:** Any drain segment loses minimum slope due to structural obstruction.
**Priority:** 🔴 Critical

### COORD-005: Air Intakes & Exhausts
**Item:** Verify outdoor air intakes and exhaust outlets are properly separated and located.
**Check:** Minimum 10ft separation intake-to-exhaust. No intake near loading docks, garbage, or cooling towers. Check prevailing wind.
**Fail if:** Intake within 10ft of any exhaust or contamination source.
**Priority:** 🔴 Critical

### COORD-006: Equipment Room Clearances
**Item:** Verify all mechanical/electrical rooms provide required equipment clearances.
**Check:** AHU coil pull space, electrical panel working clearance (1m/36"), boiler tube pull, chiller tube pull, maintenance access paths.
**Fail if:** Any equipment lacks manufacturer-required or code-required clearance.
**Priority:** 🔴 Critical

### COORD-007: Equipment vs Load Alignment
**Item:** Verify selected equipment matches design loads and capacities.
**Check:** Cross-reference equipment schedule CFM/kW/tonnage against load calculations. Flag mismatches >10%.
**Fail if:** Any equipment is undersized or oversized beyond tolerance.
**Priority:** 🔴 Critical

### COORD-008: CFM / Summary / Schedule Consistency
**Item:** Verify airflow (CFM) values are consistent across load calcs, schedules, and drawings.
**Check:** Trace each zone/room CFM from load calculation → equipment selection → duct schedule → plan annotation.
**Fail if:** Any CFM mismatch >5% between sources.
**Priority:** 🔴 Critical

### COORD-009: Mechanical vs Electrical Routing Conflict
**Item:** Verify mechanical (duct/pipe) and electrical (conduit/cable tray) routing do not conflict in congested areas.
**Check:** Overlay mechanical and electrical distribution drawings. Check corridor ceilings, mechanical rooms.
**Fail if:** Any hard conflict where routing overlaps in same space.
**Priority:** 🟡 Warning

### COORD-010: Condensate Drains
**Item:** Verify all cooling equipment has condensate drain provisions.
**Check:** Every AHU, FCU, and cooling coil must have a drain connection. Verify slope to drain or condensate pump. Check trap details.
**Fail if:** Any cooling equipment lacks condensate drainage.
**Priority:** 🔴 Critical

### COORD-011: Maintenance Access
**Item:** Verify all equipment has adequate maintenance access per manufacturer requirements.
**Check:** Filter access, belt replacement, coil cleaning, sensor calibration. Verify access doors/panels exist.
**Fail if:** Any equipment cannot be serviced without major disassembly.
**Priority:** 🟡 Warning

### COORD-012: Kitchen / Commercial Tenant Coordination
**Item:** Verify kitchen exhaust, makeup air, and grease interceptor coordination with architectural and tenant design.
**Check:** Hood type/size vs exhaust CFM. Makeup air source. Grease duct routing. Interceptor location and access.
**Fail if:** Kitchen design changed after MEP coordination was "complete" or key items are unresolved.
**Priority:** 🔴 Critical

### COORD-013: Controls / Intercom / Access
**Item:** Verify low-voltage systems routing and equipment locations do not conflict with MEP.
**Check:** BAS panel locations, thermostat locations, access control doors, intercom rough-ins.
**Fail if:** Controls/access design changed post-coordination creating new conflicts.
**Priority:** 🟡 Warning

### COORD-014: Roof / Mechanical Screen Coordination
**Item:** Verify rooftop equipment layout, screen walls, and structural supports are fully coordinated.
**Check:** Equipment sizes vs screen height. Structural dunnage/curb locations. Roof access paths. Pipe/duct penetrations.
**Fail if:** Any equipment exceeds screen height or structural support is missing.
**Priority:** 🔴 Critical

### COORD-015: Architectural / MEP Transition Details
**Item:** Verify all transition points between architectural and MEP scope are explicitly defined.
**Check:** Grille/diffuser sizes in ceilings, trench drain details, curb heights at roof, chase/soffit dimensions.
**Fail if:** Any transition detail is left implicit or ambiguous.
**Priority:** 🟡 Warning

---

## Mechanical Discipline Checklist

### MECH-001: Ductwork Sizing
**Check:** Verify duct dimensions match CFM requirements. Max velocity: supply 1500 fpm, return 1200 fpm, exhaust 2000 fpm.
**Fail if:** Any duct segment exceeds velocity limits or is undersized for required CFM.
**Reference:** ASHRAE, SMACNA

### MECH-002: Equipment Sequencing
**Check:** Verify multi-stage equipment sequencing (lead/lag, staging, rotation) is defined.
**Fail if:** No sequence of operation documented for multi-equipment systems.

### MECH-003: Vibration Isolation
**Check:** Verify vibration isolation is specified for all rotating equipment.
**Fail if:** Any pump, fan, or compressor >1HP lacks isolation details.

### MECH-004: Filter Access & Classification
**Check:** Verify filter type, MERV rating, and access for replacement.
**Fail if:** Filters cannot be accessed or MERV rating doesn't match project requirements.

### MECH-005: Duct Insulation
**Check:** Verify duct insulation R-value and vapor barrier requirements.
**Fail if:** Uninsulated ducts in unconditioned spaces or missing vapor barrier.

---

## Electrical Discipline Checklist

### ELEC-001: Panel Clearances
**Check:** Verify 1m (36") working clearance in front of all electrical panels. 1m width or panel width (whichever larger).
**Fail if:** Any panel has obstructed working space.
**Reference:** Canadian Electrical Code (CEC)

### ELEC-002: Equipment Power Requirements
**Check:** Verify all mechanical equipment has corresponding electrical circuits sized correctly.
**Fail if:** Any mechanical equipment lacks a dedicated circuit in the panel schedule.

### ELEC-003: Conduit / Cable Tray Routing
**Check:** Verify main conduit and cable tray routes avoid mechanical equipment and maintain separation.
**Fail if:** Cable tray routed through mechanical equipment clearance zones.

### ELEC-004: Emergency Power & Lighting
**Check:** Verify emergency/exit lighting circuits are identified and generator/ATS is coordinated.
**Fail if:** Life safety circuits not separated from normal power per code.

### ELEC-005: Fault Current / Coordination Study
**Check:** Verify fault current calculations and breaker coordination is completed.
**Fail if:** No coordination study for distribution equipment.

---

## Plumbing Discipline Checklist

### PLUM-001: Cleanout Accessibility
**Check:** Verify all required cleanouts are accessible. Every 30m horizontal, every change of direction >45°.
**Fail if:** Cleanout behind finished wall with no access panel.
**Reference:** National Plumbing Code

### PLUM-002: Vent Termination
**Check:** Verify vent terminals are 1m above any air intake, 2m above roof, and >3m from property line.
**Fail if:** Vent terminal too close to intake or operable window.

### PLUM-003: Fixture Rough-in Heights
**Check:** Verify fixture rough-in heights match architectural fixture schedule.
**Fail if:** Mismatch between plumbing rough-in and architectural fixture elevations.

### PLUM-004: Backflow Prevention
**Check:** Verify backflow preventer locations for all required services (domestic water, fire, irrigation).
**Fail if:** Any service requiring backflow prevention lacks a device.

### PLUM-005: Water Heater Clearances
**Check:** Verify water heater clearance for service, combustion air, and drain pan.
**Fail if:** Water heater inaccessible or drain pan missing.

---

## Cross-Discipline Coordination

### CROSS-001: Structural Penetrations
**Check:** Verify all beam/joist/column penetrations are coordinated with structural engineer.
**Fail if:** Any unapproved penetration through primary structure.

### CROSS-002: Fire Rating Maintenance
**Check:** Verify fire-rated assembly integrity is maintained at all MEP penetrations.
**Fail if:** Any unsealed penetration through a rated assembly.

### CROSS-003: Access Door Locations
**Check:** Verify access doors for valves, dampers, cleanouts, and junction boxes.
**Fail if:** Any concealed serviceable item lacks an access door.

### CROSS-004: Demolition Coordination (Reno)
**Check:** Verify demolition scope for MEP is coordinated with structural and architectural demo.
**Fail if:** MEP demo conflicts with structural retention requirements.

---

## Verification Methods

| Method | When to Use |
|--------|-----------|
| **Drawing Overlay** | Spatial coordination, routing conflicts |
| **Calculation Check** | CFM, electrical load, pipe sizing consistency |
| **Schedule Cross-Reference** | Equipment-to-load alignment |
| **Code / Standard Reference** | Clearance, fire rating, ventilation requirements |
| **Manufacturer Cut Sheet** | Equipment dimensions, service clearances |

## Agent Usage Instructions

1. **Determine project type** from available metadata or ask the user
2. **Load the core checklist** (items COORD-001 through CROSS-004)
3. **Load type-specific modules** as needed (aph, commercial, industrial, renovation, healthcare)
4. **Gather project files** — Excel calcs, PDF plans, schedules, specifications
5. **Run each checklist item** — for each item, search available data for compliance evidence
6. **Flag results** as `passed`, `failed`, or `warning` with specific details and recommendations
7. **Generate summary** with overall status: `CLEAR` (all passed), `CONDITIONAL_PASS` (only warnings), `BLOCKED` (critical failures)
8. **Return structured JSON output** + human-readable summary

## Reference Standards

- SMACNA — HVAC Duct Construction Standards
- ASHRAE 62.1 — Ventilation for Acceptable Indoor Air Quality
- Canadian Electrical Code (CEC / CSA C22.1)
- National Plumbing Code of Canada (NPC)
- National Building Code of Canada (NBC)
- CSA Z317 (Healthcare facilities, where applicable)
- Quebec Construction Code (Chapter I, Building)

---

*Skill created: 2026-06-04*
*Aligned with: GOALS.md Goal 2 (Stop redraw/patch cycle), Goal 3 (MEP Checklist + Automated Calculation)*
*Adapted from: Frank Morissette's 15 most common coordination errors + 20-item manual review checklist*
