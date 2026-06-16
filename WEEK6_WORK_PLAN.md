# Week 6 Work Plan: MEP Checklist System (Phase 2)

## Overview
Week 6 marks the beginning of Phase 2 in the project roadmap, focusing on building the MEP (Mechanical, Electrical, Plumbing) checklist system. This system will be implemented as a skill in the Agentic OS skills library, allowing agents to perform coordination validation before calculation and drawing phases.

## Why Implement as a Skill?
- Skills are reusable, shareable units that agents can utilize on demand
- The MEP checklist skill enables any agent (orchestrator, coach, assistant) to perform coordination validation
- Aligns with the "Coordination → Calculation → Drawing" decision framework
- Prevents costly errors by catching coordination issues early
- Leverages existing skills infrastructure and discovery mechanisms

## Implementation Location
**Target Directory**: `P:\Ai\Agentic-OS\.claude\skills\mpt-mep-checklist` (or similar naming convention)

**Note**: Due to permission restrictions in the current environment, the actual directory creation and file writing must be performed by Claude Code in the Agentic-OS environment.

## Skill Structure

### 1. SKILL.md File
The skill should contain:
- **Frontmatter** (YAML): Metadata for skill discovery and usage
- **Dependencies** (if any): Other skills this skill relies on
- **Body**: Detailed MEP checklist content

### 2. Frontmatter Example
```yaml
name: MEP Coordination Checklist
description: Comprehensive checklist for MEP coordination validation to prevent errors before calculation and drawing phases
category: mpt  # or similar category prefix
triggers:
  - "run mep checklist"
  - "check coordination"
  - "validate mep"
  - "coordination review"
dependencies:
  - skill: "mpt-project-classifier"  # example dependency
    required: false
    description: "Helps determine project type for specialized checklists"
    fallback: "Uses general commercial checklist"
```

### 3. Skill Body Content
The body should contain organized checklist items by:
- **Project Type**: Commercial, residential, industrial, healthcare, etc.
- **Discipline**: Mechanical, Electrical, Plumbing, Fire Protection
- **Coordination Categories**: 
  - Spatial coordination (clash detection)
  - System interactions (electrical powering mechanical equipment)
  - Access and maintenance
  - Code compliance references

## Detailed Checklist Content Structure

### Mechanical Systems
- Equipment clearances and access
- Ductwork and pipe routing
- Equipment connections and utilities
- Vibration isolation
- Filter access and maintenance space
- Condensate drainage
- Equipment sequencing and interlocks

### Electrical Systems
- Panel clearances and working space
- Equipment power requirements
- Conduit and cable tray routing
- Lighting fixture placement and switching
- Emergency power and lighting
- Grounding and bonding requirements
- Fault current calculations coordination

### Plumbing Systems
- Pipe slope and drainage
- Cleanout accessibility
- Vent termination locations
- Fixture rough-in heights
- Insulation and heat tracing
- Backflow prevention device locations
- Water heater clearances and pans

### Cross-Discipline Coordination
- Structural penetrations and sleeves
- Architectural conflicts (ceilings, walls, floors)
- Fire rating assembly maintenance
- Access door locations and sizes
- Coordinated demolition and renovation items
- Temporary facility coordination during construction

## Integration with Agent System

### How Agents Will Use the Skill
1. **Natural Language Invocation**:
   - "Run MEP coordination checklist for the HVAC project"
   - "Check coordination between electrical and mechanical systems"
   - "Validate plumbing rough-in before concrete pour"

2. **Expected Output Format**:
   The skill should return structured data that agents can process:
   ```json
   {
     "skill": "mpt-mep-checklist",
     "timestamp": "2026-05-15T11:44:46-04:00",
     "project_type": "commercial office",
     "disciplines_checked": ["mechanical", "electrical", "plumbing"],
     "results": {
       "mechanical": {
         "total_items": 25,
         "passed": 22,
         "failed": 2,
         "warnings": 1,
         "items": [
           {
             "id": "MECH-001",
             "description": "AHU clearance for filter replacement",
             "status": "failed",
             "details": "Only 18\" clearance provided, 24\" required",
             "recommendation": "Rebuild platform to increase height by 6\""
           }
         ]
       }
       // ... similar for electrical, plumbing
     },
     "summary": {
       "overall_status": "CONDITIONAL_PASS",
       "critical_items_failed": 2,
       "recommendation": "Address failed items before proceeding to calculations"
     }
   }
   ```

3. **Workflow Integration**:
   - Can be used as a validation step in agent workflows
   - Results can trigger conditional logic (e.g., if checklist fails, halt progress to calculations)
   - Can generate automated reports for team review

## Dependencies and Related Work

### Existing Skills to Consider
- Review existing skills in `.claude\skills\` for potential reuse or dependencies
- Examples: `mkt-brand-voice`, `tool-youtube`, `str-ai-seo`

### Future Related Work (Weeks 7-12)
- **Week 7-8**: Excel calculation systems (as skills or separate system)
- **Week 9-10**: Automated validation systems (integrating checklist results with calculation validation)
- **Week 11-12**: Refinement, team training, and deployment targeting zero redraws due to coordination/calculation errors

## Acceptance Criteria for Week 6

### Skill Creation
- [ ] Skill directory created in `P:\Ai\Agentic-OS\.claude\skills\`
- [ ] SKILL.md file with proper frontmatter and body content
- [ ] Comprehensive MEP checklist items organized by discipline and project type

### Discovery and Usage
- [ ] Skill discoverable via `/api/skills` endpoint
- [ ] Skill correctly categorized and searchable
- [ ] Agents can invoke skill via natural language triggers
- [ ] Skill returns structured, processable output

### Content Quality
- [ ] Checklist items are actionable and specific
- [ ] Items align with industry standards and SMACNA/ASHRAE/NEC guidelines where applicable
- [ ] Clear pass/fail criteria for each item
- [ ] Includes both coordination and code compliance items

### Integration Testing
- [ ] Test agent can successfully invoke the skill
- [ ] Skill output is correctly interpreted by agent
- [ ] Skill can be incorporated into agent workflows (conceptual validation)

## Next Steps for Claude Code

### Immediate Actions (Week 6)
1. Create the MEP checklist skill directory in the Agentic-OS skills library
2. Create SKILL.md with comprehensive frontmatter and body
3. Populate with initial checklist items for common project types
4. Verify skill discovery via existing skills API
5. Create a simple test case to validate skill invocation

### Mid-Term Actions (ongoing through Phase 2)
1. Refine checklist based on team feedback and project experience
2. Add specialized checklists for different project types (healthcare, industrial, etc.)
3. Integrate with calculation validation systems (Weeks 9-10)
4. Develop reporting and dashboard capabilities for checklist results
5. Train team on using the checklist skill in their workflow

### Long-Term Goals (End of Phase 2)
- MEP checklist in use on all projects
- Zero redraws due to coordination errors
- Teams consistently follow Coordination → Calculation → Drawing framework
- Automated validation catches 80%+ of errors early

---
*Work plan created: 2026-05-15T11:44:46-04:00*
*Ready for Claude Code to implement Week 6 MEP checklist skill*