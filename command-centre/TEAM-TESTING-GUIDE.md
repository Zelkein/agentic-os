# Week 4 Team Testing Guide

**Objective**: Validate that Jasper, Sensei, and Assistant agents work correctly in real-world scenarios before production deployment.

**Duration**: ~20-30 minutes per engineer  
**Participants**: 7 CMI engineers (Charles, Safa, Guiomar, Ramy, Simon, Vincent, Ashley)  
**Success Criteria**: All agents respond coherently, cost tracking is accurate, no API errors

---

## Pre-Testing Checklist

- [ ] Dev server running on localhost:3006
- [ ] Database initialized with chat_sessions and chat_messages tables
- [ ] DeepSeek API credentials loaded (API_KEY, MODEL, BASE_URL in `.secrets/deepseek.conf`)
- [ ] Jasper, Sensei, and Assistant agents created in database
- [ ] All engineers have access to the testing interface

---

## Test Scenario 1: Personal Assistant Workflow

**Goal**: Verify assistant agent can handle quick help tasks  
**Time**: 5 minutes

### Setup
1. Open chat interface
2. Select **"Frank's Assistant"** or **"Make me a"** agent
3. Start new chat session (note session ID)

### Steps
1. Send message: "I need help calculating HVAC load for a 14-unit building. What information do you need from me?"
2. Wait for response
3. Record response quality (coherent, helpful, role-appropriate?)
4. Send follow-up: "The building is 2,000 sqft per unit in Montreal climate zone"
5. Record assistant's follow-up questions and suggestions

### Expected Outcome
- Agent asks clarifying questions (occupancy type, ventilation needs, etc.)
- Response demonstrates understanding of HVAC calculation process
- Model used shows in response metadata
- Cost tracked (should be $0.0002-0.0005 per message)

### Quality Checklist
- [ ] Agent responds within 10 seconds
- [ ] Response is coherent and role-appropriate
- [ ] Agent asks relevant follow-up questions
- [ ] Cost is tracked accurately
- [ ] No API errors in response

---

## Test Scenario 2: Sensei Review Workflow

**Goal**: Verify coach agent can review technical work  
**Time**: 5 minutes

### Setup
1. Open chat interface
2. Select **"Sensei"** agent
3. Start new chat session

### Steps
1. Send message: "I calculated HVAC load at 12 tons for our 14-unit building. Does that seem reasonable?"
2. Wait for response
3. Record feedback quality (technical depth, constructive tone?)
4. Send follow-up: "The building is 2,000 sqft/unit, Montreal climate, mixed residential/commercial"
5. Record whether agent identifies issues or validates approach

### Expected Outcome
- Agent provides technical feedback (asks for assumptions, methodology details)
- Response shows understanding of MEP design principles
- Tone is direct and mentoring (per Sensei system prompt)
- Model used and cost tracked

### Quality Checklist
- [ ] Agent provides technical feedback
- [ ] Response demonstrates MEP knowledge
- [ ] Tone is appropriately rigorous/mentoring
- [ ] Cost is tracked (should be slightly higher due to longer response)
- [ ] No API errors

---

## Test Scenario 3: Coordination Workflow

**Goal**: Verify orchestrator can guide team coordination  
**Time**: 5 minutes

### Setup
1. Open chat interface
2. Select **"Jasper"** agent (orchestrator)
3. Start new chat session

### Steps
1. Send message: "What should be our workflow order for the CPE L'Enfantillage MEP project?"
2. Wait for response
3. Record whether response explains coordination → calculation → drawing workflow
4. Send follow-up: "We have Charles on mechanical, Ramy on electrical. Who should lead coordination?"
5. Record suggestions

### Expected Outcome
- Agent explains proper MEP workflow sequence
- Provides clear decision framework
- Suggests team coordination approach
- Cost tracked

### Quality Checklist
- [ ] Agent provides clear workflow guidance
- [ ] Response demonstrates understanding of MEP process
- [ ] Suggestions are practical and team-aware
- [ ] Response completes in <10 seconds
- [ ] Cost tracked accurately

---

## Test Scenario 4: Cost Tracking Validation

**Goal**: Verify token counting and cost calculation are accurate  
**Time**: 3 minutes

### Steps
1. From any of the above sessions, open database query tool (or API response log)
2. Verify that each message shows:
   - `model_used`: "deepseek-v4-flash" (or configured model)
   - `cost_usd`: non-zero value (typically $0.0002-0.0010 per message)
3. For a multi-message session, verify total cost = sum of individual messages
4. Check that cost increases with longer messages

### Expected Outcome
- All agent responses have cost_usd populated
- Costs are consistent with pricing model (DeepSeek: $0.00014 prompt, $0.00056 completion per 1K tokens)
- Cost increases with response length

### Quality Checklist
- [ ] All messages have cost_usd > 0
- [ ] Costs are reasonable (not $0 or suspiciously high)
- [ ] Longer responses have higher costs
- [ ] Total session cost = sum of messages

---

## Test Scenario 5: Multi-Message Conversation Flow

**Goal**: Verify chat history is maintained and context carries across messages  
**Time**: 5 minutes

### Setup
1. Open chat interface
2. Select **"Sensei"** agent
3. Start new chat session

### Steps
1. Send message 1: "I'm designing the ventilation for a residential building"
2. Wait for response
3. Send message 2: "The building has 6 units. How do I calculate total CFM?"
4. Wait for response
5. Send message 3: "That gives us 3,600 CFM. What size main duct do I need?"
6. Record whether agent remembers "residential" + "6 units" from message 1

### Expected Outcome
- Agent maintains context across multiple messages
- Response to message 3 references earlier conversation
- No repeated explanations (agent remembers what was said)
- All messages logged with session_id

### Quality Checklist
- [ ] Agent references previous messages in responses
- [ ] No context loss across multi-turn conversation
- [ ] Session ID consistent across all messages in session
- [ ] Chat history retrieved correctly

---

## Test Execution Log

Use the template below to track results for each engineer:

```
Engineer: [Name]
Date: [YYYY-MM-DD]
Time: [HH:MM-HH:MM]

Scenario 1 (Personal Assistant): [PASS/FAIL] - Notes: 
Scenario 2 (Sensei Review):      [PASS/FAIL] - Notes: 
Scenario 3 (Coordination):       [PASS/FAIL] - Notes: 
Scenario 4 (Cost Tracking):      [PASS/FAIL] - Notes: 
Scenario 5 (Multi-Message):      [PASS/FAIL] - Notes: 

Overall Quality: [Excellent/Good/Fair/Poor]
Issues Found: [List any bugs, errors, or quality issues]
Suggestions: [Any improvement suggestions from engineer]
```

---

## Validation Checklist (Completed After All Testing)

- [ ] 5+ scenarios completed with all engineers
- [ ] No unrecovered API errors
- [ ] Cost tracking accurate for all messages
- [ ] Agent responses coherent and role-appropriate
- [ ] Chat history maintained across sessions
- [ ] All agents working (Jasper, Sensei, Assistant)
- [ ] Multi-turn conversations work smoothly
- [ ] Engineers report positive experience

---

## Troubleshooting

### Issue: "Agent not found" error
**Fix**: Verify agent exists in database. Check that agent_id in API call matches an agent created in /api/agents

### Issue: "Credentials not found" error
**Fix**: Check `.secrets/deepseek.conf` has correct format:
```
API_KEY=sk-...
MODEL=deepseek-v4-flash
BASE_URL=https://api.deepseek.com/v1
```

### Issue: Long response delays (>15 seconds)
**Cause**: DeepSeek API latency or large token counts  
**Fix**: Retry; if persistent, check network connection

### Issue: Cost is $0.00000
**Fix**: Verify cost-calculator.ts is loaded and prices are configured. Check token count isn't zero.

### Issue: Chat history not remembered in message 3
**Fix**: Verify chat_messages table has all previous messages. Check that fetchMessages() retrieves last 10 messages.

---

## Next Steps After Testing

1. **Collect Results**: Compile all engineer feedback into TEAM-TESTING-RESULTS.md
2. **Fix Critical Issues**: Any API errors or data loss must be resolved before deployment
3. **Iterate Minor Issues**: Address quality suggestions (response tone, better context, etc.)
4. **Deploy**: Once all scenarios pass with no errors, deploy to production

---

## Notes

- Keep testing sessions brief (20-30 min) to avoid fatigue
- Focus on **functionality** first, **experience** second
- Document any errors immediately (they help identify issues)
- Positive feedback is as important as bug reports (validates approach)

