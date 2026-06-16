# Week 4 Team Testing Guide

## Phase 4: Team Testing with 7 CMI Engineers

### Test Users
1. **Charles Morissette** - Mechanical engineer, coordinator
2. **Safa Essakhi** - Project lead, mechanical specialist
3. **Guiomar Vargas** - Coordination specialist
4. **Ramy Ali** - Electrical engineer
5. **Simon Stephens** - Support/coordination
6. **Vincent Ouellet** - Energy specialist
7. **Ashley Dawkes** - Documentation/admin

---

## Test Scenarios

### Scenario 1: Personal Assistant Workflow
**Focus:** Basic task support and calculations

**Setup:**
- User: Charles or Safa
- Task: "I need help calculating HVAC load for 14-unit building. Climate: Quebec City, 5 stories, 600 m²/unit"

**Expected flow:**
1. Chat message → Intent Parser classifies as `calculation`
2. System suggests `assistant` agent
3. Assistant asks clarifying questions (outdoor temps, ventilation rates, etc.)
4. Assistant helps organize calculation or points to relevant standards

**Success criteria:**
- ✓ Intent parser correctly identifies `calculation` task
- ✓ Assistant provides helpful guidance
- ✓ Response includes relevant building codes/standards
- ✓ User feels supported

**Estimated time:** 5-10 minutes

---

### Scenario 2: Sensei Review Workflow
**Focus:** Quality review and teaching

**Setup:**
- User: Ramy Ali or Safa
- Task: Upload HVAC calculation (XLSX) with message: "Can you review this? Is the sizing correct?"

**Expected flow:**
1. Chat message + file attachment → Intent Parser classifies as `review`
2. System suggests `sensei` agent
3. Sensei reviews calculation and provides:
   - What's correct ✓
   - Issues found ⚠
   - Specific improvements 🔧
   - Code references/best practices

**Success criteria:**
- ✓ File attachment preserved in context
- ✓ Sensei provides specific, technical feedback
- ✓ Response includes supporting evidence (codes, standards)
- ✓ User learns why (not just what's wrong)

**Estimated time:** 10-15 minutes

---

### Scenario 3: Jasper Coordination Workflow
**Focus:** Process guidance and team coordination

**Setup:**
- User: Charles or Guiomar
- Task: "Our 14-unit project is about to start calculation phase. Mechanical and electrical have conflicts in the 3rd-floor penthouse area. What's our workflow?"

**Expected flow:**
1. Chat message → Intent Parser classifies as `coordination`
2. System suggests `jasper` agent
3. Jasper provides:
   - Step-by-step coordination resolution process
   - Recommended team assignments
   - Timeline and dependencies
   - Decision framework

**Success criteria:**
- ✓ Intent parser identifies `coordination` task
- ✓ Jasper provides process guidance (not just opinion)
- ✓ Response includes team delegation recommendations
- ✓ User understands why this order matters

**Estimated time:** 8-12 minutes

---

### Scenario 4: File Context Workflow
**Focus:** File attachment integration with agent context

**Setup:**
- User: Ramy, Safa, or Guiomar
- Task: Upload DWG file (drawing) + message: "Is this MEP layout properly coordinated?"

**Expected flow:**
1. Chat message + DWG file → Intent Parser classifies as `review`
2. System suggests `sensei` agent with file context
3. Sensei provides:
   - Coordination assessment
   - Visual conflicts identified
   - Specific locations of issues
   - Recommendations for redraw

**Success criteria:**
- ✓ File reference preserved in chat
- ✓ Sensei acknowledges file context
- ✓ Feedback specific to visible/expected issues
- ✓ User can reference feedback during redraw

**Estimated time:** 10-15 minutes

---

### Scenario 5: Multi-Turn Conversation
**Focus:** Context retention across multiple messages

**Setup:**
- User: Any team member
- Task: Start with one question, follow up with refinements

**Example:**
1. "What's the process for electrical load calculations?"
2. "How do we handle diversity factors in multi-unit residential?"
3. "Can you review my assumptions for this project?"

**Expected flow:**
1. First message → Sensei provides general guidance
2. Second message → Sensei builds on context from first answer
3. Third message → Sensei reviews specific work with full conversation context

**Success criteria:**
- ✓ Agent remembers previous messages in session
- ✓ Feedback builds on prior discussion
- ✓ No context loss across messages
- ✓ Conversation feels natural

**Estimated time:** 15-20 minutes

---

## Testing Checklist

### Before Testing Starts
- [ ] Initialize Jasper and Sensei agents (`npm run init-agents`)
- [ ] Verify database has agents with system prompts
- [ ] Test `/api/parse-user-intent` endpoint directly
- [ ] Verify DeepSeek API credentials are loaded
- [ ] Create blank chat sessions for each tester

### During Testing

For each test scenario:
- [ ] Record response time (should be <10 seconds)
- [ ] Check response quality (coherent, technical, specific)
- [ ] Verify cost tracking (tokens + USD calculated)
- [ ] Note any errors or unexpected behavior
- [ ] Capture user feedback (helpful? clear? actionable?)

### After Each Test
- [ ] Review logs for errors
- [ ] Check token usage and costs
- [ ] Document any issues found
- [ ] Ask user: "Was this helpful?" (1-5 scale)
- [ ] Collect specific feedback

---

## Evaluation Criteria

### Response Quality
- **Coherence**: Response is understandable and well-organized (1-5)
- **Relevance**: Content directly addresses the user's question (1-5)
- **Technical Accuracy**: Information is correct and evidence-based (1-5)
- **Actionable**: User can take next steps based on response (1-5)

### System Performance
- **Speed**: Response time <10 seconds (✓ pass / ✗ fail)
- **Stability**: No crashes or errors (✓ pass / ✗ fail)
- **Cost Accuracy**: Token counts and costs reasonable (✓ pass / ✗ fail)
- **File Support**: Attached files handled correctly (✓ pass / ✗ fail)

### User Experience
- **Helpfulness**: Would use this agent again (1-5)
- **Confidence**: Feels like they could trust the output (1-5)
- **Learning**: Learned something or improved understanding (1-5)
- **Process Fit**: Fits naturally into their workflow (1-5)

---

## Issues & Feedback Log

Create entry for each issue found:

```markdown
**Date:** 2026-05-XX
**Tester:** [Name]
**Scenario:** [Scenario #]
**Issue:** [Description]
**Severity:** High / Medium / Low
**Workaround:** [If applicable]
**Root Cause:** [If known]
```

---

## Success Metrics (Phase 4)

✅ **Completion**
- All 7 testers complete at least 2 scenarios
- Total test time: 1-2 hours per tester
- All 5 scenarios tested at least once

✅ **Quality**
- Response quality average >4.0/5.0
- No critical errors or crashes
- Cost tracking accurate within 5%
- Response time <10 seconds 95% of the time

✅ **Feedback**
- At least 80% of responses rated "helpful" or better
- No fundamental misunderstandings by agents
- Actionable feedback (not vague)
- Team members say they'd use agents again

✅ **Deployment Ready**
- No blocking issues found
- All agents respond appropriately to their role
- File attachments work reliably
- System can handle concurrent requests

---

## Timeline

- **Week 4 Day 1-2**: Run scenarios with Charles, Safa, Guiomar
- **Week 4 Day 3**: Run scenarios with Ramy, Simon, Vincent
- **Week 4 Day 4**: Run with Ashley + edge cases
- **Week 4 Day 5**: Fix high-priority issues, document results

---

## Communication

**Before Testing:**
- Schedule 20-30 min slots with each tester
- Send them a copy of their scenario
- Let them know this is training, not evaluation

**During Testing:**
- Observe silently (or ask guiding questions if stuck)
- Take notes on reactions and feedback
- Record response times

**After Testing:**
- Debrief: What worked? What was confusing?
- Collect written feedback on a form
- Discuss next steps

---

## Success Criteria Met When

1. ✅ All 5 test scenarios execute without critical errors
2. ✅ At least 80% of responses rated 4+/5 for quality
3. ✅ Team gives positive feedback (would use in production)
4. ✅ Cost tracking is accurate (verified in logs)
5. ✅ No blocking architectural issues found
