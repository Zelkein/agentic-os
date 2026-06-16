# Notes for Claude Code - Week 6 Work Initiation

## Current Status
- Week 5 (Advanced Agent Configuration) foundation is complete
- AgentBuilder component enhanced with skills, workflows, custom config, advanced LLM parameters
- Database schema updated with new columns for advanced LLM parameters
- API endpoints updated to handle new fields
- Some permissions issues encountered when trying to create directories in certain locations

## Week 6 Focus: MEP Checklist System (Phase 2, Week 6)
According to GOALS.md, Phase 2 (Weeks 5-12) focuses on:
- Building MEP checklist system
- Excel calculation systems  
- Automated validation systems

### Implementation Target
**Primary Location**: `P:\Ai\Agentic-OS\.claude\skills\mpt-mep-checklist`
**Alternative Location** (if permissions differ): `C:\agentic-os-v2\command-centre\src\skills\mpt-mep-checklist` (for testing/validation)

### What Claude Code Needs to Do:

1. **Create the Skill Directory**
   - Create directory: `P:\Ai\Agentic-OS\.claude\skills\mpt-mep-checklist`
   - If that fails due to permissions, try: `C:\agentic-os-v2\command-centre\src\skills\mpt-mep-checklist` (for initial development/testing)

2. **Create SKILL.md File** with:
   ```yaml
   name: MEP Coordination Checklist
   description: Comprehensive checklist for MEP coordination validation to prevent errors before calculation and drawing phases
   category: mpt
   triggers:
     - "run mep checklist"
     - "check coordination"
     - "validate mep"
     - "coordination review"
   dependencies: []
   ```
   
   And detailed body content organized by:
   - Project types (commercial, residential, industrial, healthcare)
   - Disciplines (mechanical, electrical, plumbing, fire protection)
   - Specific checklist items with clear pass/fail criteria

3. **Verify Skill Discovery**
   - Ensure the skill appears in `/api/skills` endpoint response
   - Test that agents can invoke it via natural language triggers

4. **Create Test Validation**
   - Create a simple test agent that uses the MEP checklist skill
   - Verify the skill returns structured, processable output

### Key Implementation Details:
- Skill should return structured JSON-like output that agents can process
- Include both coordination items and code compliance references
- Align with "Coordination → Calculation → Drawing" decision framework
- Make items actionable and specific with clear verification methods
- Reference industry standards where applicable (SMACNA, ASHRAE, NEC, etc.)

### Files to Reference/Verify:
- Existing skills in `P:\Ai\Agentic-OS\.claude\skills\` for formatting examples
- `/api/skills` endpoint for skill discovery mechanism
- AgentBuilder component for how agents can be configured to use skills
- GOALS.md for Phase 2 objectives and success criteria

### Success Criteria for Week 6:
- [ ] Skill directory created with proper SKILL.md
- [ ] Skill discoverable via skills API
- [ ] Comprehensive MEP checklist content organized by discipline/project type
- [ ] Skill returns structured output usable by agents
- [ ] Test agent can successfully invoke and interpret skill results
- [ ] Alignment with Phase 2 goal: MEP checklist in use on all projects

## Transition Note
Once Week 6 MEP checklist skill is successfully created and validated, Week 7-8 will focus on Excel calculation systems (which could also be implemented as skills), followed by automated validation systems in Weeks 9-10.

---
*Notes prepared: 2026-05-15T11:44:46-04:00*
*Ready for Claude Code to begin Week 6 implementation*