# Week 6 Work: Starting Phase 2 - MEP Checklist System

## Transition from Week 5 to Week 6

Week 5 focused on Advanced Agent Configuration, enhancing the AgentBuilder component to support:
- Skills integration (select from skills library)
- Workflows configuration (define multi-step processes)
- Custom configuration (key-value pairs)
- Advanced LLM parameters (temperature, maxTokens, topP, frequency/presence penalties)
- All while maintaining backward compatibility

## Week 6 Focus: MEP Checklist System (Phase 2, Week 6)

According to the project goals (GOALS.md), Phase 2 (Weeks 5-12) focuses on:
- Building MEP checklist system
- Excel calculation systems
- Automated validation systems

Week 6 will initiate the MEP checklist system, which will be implemented as a skill in the Agentic OS skills library.

### Why a Skill?
- Skills are reusable, shareable units of functionality that agents can utilize
- The MEP checklist skill will allow agents to:
  - Load MEP checklists by project type
  - Validate coordination items against the checklist
  - Generate reports on checklist completion
  - Suggest missing coordination items
- This aligns with the goal of preventing coordination errors before they reach the drawing phase

### Implementation Plan for Week 6:

1. **Create MEP Checklist Skill**
   - Directory: `P:\Ai\Agentic-OS\.claude\skills\mpt-checklist` (or similar)
   - SKILL.md with:
     - Frontmatter: name, description, triggers, category
     - Dependencies (if any)
     - Body: Detailed checklist items by discipline (mechanical, electrical, plumbing)
     - Usage instructions for agents

2. **Skill Content**
   - Comprehensive MEP coordination checklist items
   - Organized by project type (commercial, residential, industrial, etc.)
   - Organized by discipline (mechanical, electrical, plumbing, fire protection)
   - Each item with:
     - ID
     - Description
     - Responsible discipline
     - Verification method
     - References to standards/codes

3. **Integration Points**
   - Agents can invoke the skill via natural language: "Run MEP checklist for this project"
   - The skill will return a structured report (pass/fail/partial) with details
   - Can be used in agent workflows as a validation step

4. **Future Weeks**
   - Week 7-8: Excel calculation systems (as skills or separate system)
   - Week 9-10: Automated validation systems (integrating checklist and calculations)
   - Week 11-12: Refinement, team training, and deployment

### Immediate Next Steps for Week 6:

1. Verify access to the Agentic OS skills directory (P:\Ai\Agentic-OS\.claude\skills)
2. Create the MEP checklist skill directory and SKILL.md file
3. Populate with initial checklist items for common project types
4. Test that the skill is discoverable via the `/api/skills` endpoint
5. Create a simple test agent that uses the MEP checklist skill

### Notes for Claude Code:

- The MEP checklist skill should be designed to be used by any agent (orchestrator, coach, assistant)
- Focus on practical, actionable checklist items that prevent coordination errors
- Consider including items that align with the "Coordination → Calculation → Drawing" decision framework
- Ensure the skill returns structured data that can be easily processed by agents
- Document the skill thoroughly so other agents know how to invoke it and interpret results

---
*Week 6 work started at: 2026-05-15T11:44:46-04:00*
*Ready to create MEP checklist skill*