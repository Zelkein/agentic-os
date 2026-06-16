# Excel Calculation Template — Architecture Design

**Status:** Design complete — ready for implementation  
**Created:** 2026-06-04  
**System:** P1 System 2 — Convert CAD Tables to Excel + Build Calculation Systems  
**Pilot project:** APH typique

---

## Design Decisions (from Frank's answers)

| Decision | Rationale |
|----------|-----------|
| Excel/Google Sheets first | Simple, flexible, shareable, no new tooling |
| Common core + type variants | 7 projects too heterogeneous for one rigid template |
| Separate but linked sheets | Not same tab, same workbook — checklist ↔ calcs connected |
| Auto-populated from metadata | Type, discipline, phase, address, client — less noise |
| Error signaled in-cell | Red cell, blocked row, color code, comment — not email |
| Red flags: calc person → lead → Frank (major only) | Escalation chain, Frank sees only critical |
| CAD reads final values from Excel | Source unique. Simple link first, more automation later |
| Pilot: APH typique | Repetitive, standard, low risk |

---

## Workbook Structure (8 Sheets)

### Sheet 1: PROJECT
**Purpose:** Single source of truth for project metadata. Auto-populates downstream sheets.

| Field | Type | Source |
|-------|------|--------|
| Project Name | Text | Manual |
| Project Number | Text | Manual |
| Client | Text | Manual |
| Architect | Text | Manual |
| Address | Text | Manual |
| Project Type | Dropdown: `APH`, `Commercial`, `Industrial`, `Renovation`, `Healthcare` | Manual |
| Phase | Dropdown: `Coordination`, `Calculation`, `Drawing`, `Construction` | Manual |
| Discipline(s) | Multi-select: `Mechanical`, `Electrical`, `Plumbing`, `Fire Protection` | Manual |
| Has Kitchen/Commercial | Boolean | Manual |
| Has Garage | Boolean | Manual |
| Energy Compliance Required | Boolean | Manual |
| Applicable Codes | Dropdown: `Quebec`, `Canada`, `CSA`, `ASHRAE` | Manual |
| Last Modified | Timestamp | Auto |

**Validation:** All required fields must be filled. Project type drives which module sheets are active.

---

### Sheet 2: ASSUMPTIONS
**Purpose:** Capture all design assumptions before calculations begin. If assumptions change, all downstream calcs flag for review.

| Field | Type | Example |
|-------|------|---------|
| Outdoor Design Temp (Summer) | °C | 30°C |
| Outdoor Design Temp (Winter) | °C | -25°C |
| Indoor Design Temp (Conditioned) | °C | 22°C ± 2°C |
| Indoor Design Temp (Unconditioned) | °C | 10°C min |
| Occupancy Type | Dropdown | Residential / Office / Retail |
| Occupant Density | m²/person | 10 |
| Ventilation Rate | L/s/person | 5 (ASHRAE 62.1) |
| Lighting Power Density | W/m² | 8 |
| Equipment Power Density | W/m² | 10 |
| Infiltration Rate | ACH | 0.35 |
| Ceiling Height | m | 2.7 |
| Window-to-Wall Ratio | % | 30% |
| Glazing U-Value | W/m²·K | 1.8 |
| Wall R-Value | RSI | 4.2 |
| Roof R-Value | RSI | 5.6 |

**Validation:** Out-of-range values flagged. Changes to assumptions trigger recalculation flag.

---

### Sheet 3: HVAC
**Purpose:** Air distribution design — load → CFM → duct sizing → equipment selection.

**Sections:**
1. **Load Summary per Zone** — Cooling (kW), Heating (kW), Ventilation (L/s)
2. **Air Distribution** — Supply CFM, Return CFM, Exhaust CFM per zone
3. **Duct Sizing** — Dimensions, velocity, pressure drop per segment
4. **Equipment Selection** — AHU/RTU/FCU model, capacity, ESP
5. **Diffuser/Grille Schedule** — Type, size, neck velocity, throw

**Key Formulas:**
- CFM = Cooling Load (BTU/h) / (1.08 × ΔT)
- Velocity = CFM / Duct Area (ft²)
- Pressure Drop = f(velocity, diameter, length, fittings) via Darcy-Weisbach

**Validation Rules:**
- Supply CFM ↔ Return CFM balance (±10%)
- Duct velocity < limit (supply 1500 fpm, return 1200 fpm)
- Equipment capacity ≥ zone load (oversizing ≤20%)
- ESP within fan curve limits

**Red Flags (critical):**
- CFM/load mismatch >10%
- Duct velocity exceeds recommended max
- Equipment undersized or oversized >20%
- Missing ventilation for occupied spaces

---

### Sheet 4: PLUMBING
**Purpose:** Water supply, drainage, and venting design.

**Sections:**
1. **Fixture Schedule** — Type, quantity, fixture units (cold/hot)
2. **Water Supply Sizing** — Pipe diameter, velocity, pressure loss
3. **Drainage Sizing** — Pipe diameter, slope, fixture units
4. **Venting** — Vent type, size, termination
5. **Equipment Schedule** — Water heaters, pumps, tanks

**Key Formulas:**
- Pipe size ← fixture units table (NPC)
- Velocity ← flow rate / pipe area
- Drain slope: 1/4" per foot (min), 1/8" per foot (≥4" pipe)

**Validation Rules:**
- Total fixture units ≤ pipe capacity
- Velocity within limits (supply 8 fps, drain 4 fps)
- Slope maintained throughout run
- Cleanout spacing ≤ 30m horizontal

**Red Flags:**
- Pipe undersized for fixture units
- Slope violation due to structure
- Missing cleanout, vent, or backflow preventer

---

### Sheet 5: ELECTRICAL
**Purpose:** Load calculation, panel scheduling, feeder sizing.

**Sections:**
1. **Connected Loads** — Lighting, receptacles, equipment (kW)
2. **Demand Factors** — Per CEC/NEC tables
3. **Panel Schedule** — Breakers, phase balance, bus rating
4. **Feeder Sizing** — Ampacity, voltage drop, conduit size
5. **Generator / ATS** — Emergency load summary (if applicable)

**Key Formulas:**
- Demand Load = Connected Load × Demand Factor
- Feeder Amps = Load (VA) / (Voltage × √3) for 3-phase
- Voltage Drop ≤ 3% (branch), ≤ 5% (feeder + branch)

**Validation Rules:**
- Panel load ≤ 80% of bus rating
- Phase imbalance ≤ 10%
- Voltage drop within limits
- Breaker sizing matches conductor ampacity
- Mechanical equipment has dedicated circuits

**Red Flags:**
- Panel overloaded (>80%)
- Missing equipment circuits
- Phase imbalance >10%
- Voltage drop exceeds limit

---

### Sheet 6: EQUIPMENT / SCHEDULES
**Purpose:** Master equipment list — all disciplines. Auto-populated from HVAC, Plumbing, and Electrical sheets.

**Columns:**
- Tag ID, Description, Manufacturer, Model, Capacity, Electrical Data (V/Ph/A), Weight, Dimensions, Location, Service Clearances

**Validation:**
- No equipment without electrical connection
- No equipment without service clearance verification
- Equipment dimensions ≤ allocated room space

---

### Sheet 7: VALIDATION
**Purpose:** Automated consistency checks across all sheets. Cross-references.

**Checks:**
1. HVAC CFM ↔ Equipment selection ↔ Duct schedule
2. Equipment kW ↔ Electrical panel breaker
3. Plumbing fixture units ↔ Drain pipe sizing
4. Assumptions date stamp — if changed, flag all dependent calcs
5. Missing mandatory fields in any sheet

**Output:** Green (pass) / Yellow (warning) / Red (fail) per check with hyperlink to source cell.

---

### Sheet 8: CAD EXPORT
**Purpose:** Formatted table ready for AutoCAD import/link. Read-only from CAD perspective.

**Contents:**
- Equipment schedule (tag, description, dimensions)
- Ductwork summary
- Panel schedule summary
- Plumbing fixture schedule

**Format:** Clean table, no formulas, ready for OLE link or Data Link Manager in AutoCAD 2023.

---

## Type-Specific Module Sheets

### APH Module (adds to base template)
- **APH-ENERGY** sheet: Carrier HAP 6.3 inputs/outputs, energy compliance verification
- Multi-unit repetition handling (zone × unit count)
- Corridor pressurization requirements

### Commercial Module
- **KITCHEN** sheet: Exhaust hood sizing, makeup air, grease interceptor, fire suppression
- Retail tenant load diversity
- After-hours HVAC zones

### Renovation Module
- **EXISTING** sheet: Survey of existing conditions, retained equipment
- **DEMO** sheet: Demolition scope, temporary services during construction
- Phased shutdown/startup requirements

---

## Template File Naming Convention

```
{project-slug}_MEP-CALCS_v{version}.xlsx

Example:
14-units-st-martin_MEP-CALCS_v1.0.xlsx
```

---

## Implementation Order

| Phase | Deliverable | Depends on |
|-------|------------|------------|
| **1A** | Core 8-sheet template (PROJECT through CAD EXPORT) | Nothing |
| **1B** | APH module sheet (pilot project) | Core template |
| **1C** | Pilot on `aph-18-units-saint-come` or similar | Core + APH module |
| **2A** | Commercial module sheet | Core template |
| **2B** | Renovation module sheet | Core template |
| **3** | AutoCAD Data Link setup + test for pilot | Pilot validated |
| **4** | Rollout to remaining 6 projects | Per-project adaptation |

---

## Success Metrics

- [ ] All 7 projects using Excel templates (not scattered CAD tables)
- [ ] Design changes auto-propagate to downstream sheets
- [ ] AutoCAD pulls final numbers from Excel (no manual CAD table edits)
- [ ] 80%+ of calculation errors caught by validation sheet
- [ ] Zero redraws due to calculation inconsistencies

---

*Architecture document created: 2026-06-04*
*Ready for implementation — start with Sheet 1 (PROJECT) and Sheet 3 (HVAC) for the pilot APH*
