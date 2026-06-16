# Week 4 API Reference

Complete API documentation for the Sub-agent Dispatch system.

---

## Intent Parser Endpoint

### Request
```
POST /api/parse-user-intent
Content-Type: application/json

{
  "message": "I need to check if my HVAC calculations are correct",
  "sessionId": "session_123456",          // Optional
  "attachedFiles": [                      // Optional
    {
      "id": "file_abc123",
      "filename": "hvac-calc.xlsx",
      "type": "xlsx",
      "url": "/api/uploads/file_abc123"
    }
  ],
  "agentPreference": "sensei"             // Optional: "jasper", "sensei", "assistant"
}
```

### Response
```json
{
  "taskType": "review",
  "suggestedAgents": ["sensei"],
  "confidence": 0.85,
  "reasoning": "Detected review/validation task from message keywords."
}
```

### Task Types
- `calculation` → Assistant or Specialist
- `review` → Sensei (coach)
- `coordination` → Jasper (orchestrator)
- `explanation` → Sensei or Assistant
- `project_management` → Jasper
- `support` → Personal Assistant
- `user_preference` → User-specified agent

### Example Requests

#### Calculation Task
```bash
curl -X POST http://localhost:3006/api/parse-user-intent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Calculate the HVAC load for a 14-unit residential building"
  }'
```

**Response:**
```json
{
  "taskType": "calculation",
  "suggestedAgents": ["assistant", "sub_agent"],
  "confidence": 0.8,
  "reasoning": "Detected calculation task from keywords: calculate, load"
}
```

#### Review Task with File
```bash
curl -X POST http://localhost:3006/api/parse-user-intent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you review my calculation?",
    "attachedFiles": [
      {
        "id": "file_123",
        "filename": "hvac-calc.xlsx",
        "type": "xlsx"
      }
    ]
  }'
```

**Response:**
```json
{
  "taskType": "review",
  "suggestedAgents": ["sensei"],
  "confidence": 0.75,
  "reasoning": "XLSX file attached suggests calculation review task"
}
```

#### Coordination Task
```bash
curl -X POST http://localhost:3006/api/parse-user-intent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What process should we use for MEP coordination?"
  }'
```

**Response:**
```json
{
  "taskType": "coordination",
  "suggestedAgents": ["jasper"],
  "confidence": 0.9,
  "reasoning": "Detected coordination/workflow task from keywords: coordinate, process"
}
```

---

## Agent Execution Endpoint

### Request
```
POST /api/agents/{agentId}/execute
Content-Type: application/json

{
  "message": "What is your role in this organization?",
  "sessionId": "session_123456",
  "attachedFiles": [                      // Optional
    {
      "id": "file_abc123",
      "filename": "drawing.dwg",
      "type": "dwg",
      "url": "/api/uploads/file_abc123"
    }
  ]
}
```

### Response
```json
{
  "response": "I am Sensei, the MEP quality coach...",
  "modelUsed": "deepseek-v4-flash",
  "costUsd": 0.00035,
  "tokens": {
    "prompt": 248,
    "completion": 156,
    "total": 404
  }
}
```

### Example Requests

#### Simple Query (No History)
```bash
# First, get Sensei's agent ID
SENSEI_ID="e5f10baa-1ec9-4752-a317-ec6a8440d1e3"
SESSION_ID="session_test_$(date +%s)"

curl -X POST "http://localhost:3006/api/agents/${SENSEI_ID}/execute" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"What's the best practice for HVAC equipment sizing?\",
    \"sessionId\": \"${SESSION_ID}\"
  }"
```

**Response:**
```json
{
  "response": "Best practice for HVAC equipment sizing includes...",
  "modelUsed": "deepseek-v4-flash",
  "costUsd": 0.00042,
  "tokens": {
    "prompt": 312,
    "completion": 289,
    "total": 601
  }
}
```

#### Multi-Turn Conversation
```bash
# Message 1: Ask for guidance
curl -X POST "http://localhost:3006/api/agents/${SENSEI_ID}/execute" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"I'm sizing equipment for a 14-unit building\",
    \"sessionId\": \"${SESSION_ID}\"
  }"

# Message 2: Follow-up (agent remembers context)
curl -X POST "http://localhost:3006/api/agents/${SENSEI_ID}/execute" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"How do I handle diversity factors in my calculation?\",
    \"sessionId\": \"${SESSION_ID}\"
  }"
```

The second response will include context from the first message in the conversation history.

#### With File Attachment
```bash
curl -X POST "http://localhost:3006/api/agents/${SENSEI_ID}/execute" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Please review my HVAC calculation\",
    \"sessionId\": \"${SESSION_ID}\",
    \"attachedFiles\": [
      {
        \"id\": \"file_hvac_123\",
        \"filename\": \"hvac-load-calc.xlsx\",
        \"type\": \"xlsx\",
        \"url\": \"/api/uploads/file_hvac_123\"
      }
    ]
  }"
```

---

## Agent IDs & System Prompts

### Jasper (Orchestrator)
```
ID: 4cf03254-934a-459c-97d7-0d749c43a93a
Role: orchestrator
Provider: deepseek
Model: deepseek-v4-flash
```

**Best for:**
- Project coordination
- Priority decisions
- Team delegation
- Workflow guidance

**Example Usage:**
```bash
JASPER_ID="4cf03254-934a-459c-97d7-0d749c43a93a"

curl -X POST "http://localhost:3006/api/agents/${JASPER_ID}/execute" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"We have MEP coordination conflicts on our project. What's our process?\",
    \"sessionId\": \"session_coordination\"
  }"
```

### Sensei (Coach)
```
ID: e5f10baa-1ec9-4752-a317-ec6a8440d1e3
Role: coach
Provider: deepseek
Model: deepseek-v4-flash
```

**Best for:**
- Calculation review
- Drawing review
- Code compliance
- Teaching & mentoring

**Example Usage:**
```bash
SENSEI_ID="e5f10baa-1ec9-4752-a317-ec6a8440d1e3"

curl -X POST "http://localhost:3006/api/agents/${SENSEI_ID}/execute" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Is my boiler sizing correct for a 280 kW heating load?\",
    \"sessionId\": \"session_review\"
  }"
```

---

## Cost Examples

### DeepSeek v4-flash Pricing
- **Prompt:** $0.00014 per 1K tokens
- **Completion:** $0.00056 per 1K tokens

### Typical Costs
| Scenario | Avg Tokens | Cost |
|----------|-----------|------|
| Simple question | 100 prompt + 150 completion | $0.00018 |
| Calculation review | 200 prompt + 400 completion | $0.00051 |
| Multi-turn context (3 msgs) | 400 prompt + 600 completion | $0.00112 |

### Cost Tracking
All agent responses include actual token counts:
```json
{
  "tokens": {
    "prompt": 248,
    "completion": 156,
    "total": 404
  },
  "costUsd": 0.00035
}
```

Stored in database for later analysis:
```sql
SELECT SUM(cost_usd) as total_cost
FROM chat_messages
WHERE role = 'agent'
  AND created_at >= '2026-05-15'
  AND created_at < '2026-05-20';
```

---

## Testing Guide

### 1. Local Validation (Before Team Testing)
```bash
cd /c/agentic-os-v2/command-centre

# Start dev server
npm run dev &

# Wait for server to be ready (check http://localhost:3006)

# Run validation tests
npx ts-node tests/manual-validation.ts
```

### 2. Test Each Endpoint Individually

#### Test Intent Parser
```bash
# Test calculation classification
curl -X POST http://localhost:3006/api/parse-user-intent \
  -H "Content-Type: application/json" \
  -d '{"message": "Calculate HVAC load for 14 units"}'

# Test review classification
curl -X POST http://localhost:3006/api/parse-user-intent \
  -H "Content-Type: application/json" \
  -d '{"message": "Review my calculation"}'

# Test coordination classification
curl -X POST http://localhost:3006/api/parse-user-intent \
  -H "Content-Type: application/json" \
  -d '{"message": "What MEP coordination process?"}'
```

#### Test Agent Execution
```bash
# Get agent IDs from database
sqlite3 /c/agentic-os-v2/.command-centre/data.db \
  "SELECT id, name FROM agents WHERE name IN ('Jasper', 'Sensei')"

# Test Sensei
SENSEI_ID="e5f10baa-1ec9-4752-a317-ec6a8440d1e3"
curl -X POST "http://localhost:3006/api/agents/${SENSEI_ID}/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is your role?",
    "sessionId": "test_session_'$(date +%s)'"
  }'

# Test Jasper
JASPER_ID="4cf03254-934a-459c-97d7-0d749c43a93a"
curl -X POST "http://localhost:3006/api/agents/${JASPER_ID}/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is your role?",
    "sessionId": "test_session_'$(date +%s)'"
  }'
```

### 3. Verify Database Logging
```bash
sqlite3 /c/agentic-os-v2/.command-centre/data.db

# Check chat messages were stored
SELECT session_id, role, model_used, cost_usd, LENGTH(content) as content_length
FROM chat_messages
WHERE role = 'agent'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Common Issues & Solutions

### Intent Parser Returns Wrong Task Type
- Check keyword list in `/src/app/api/parse-user-intent/route.ts`
- Add more keywords for the misclassified task type
- Use `agentPreference` to override classification

### Agent Doesn't Respond
- Verify agent ID is correct (check database)
- Check LLM credentials in `.secrets/deepseek.conf`
- Verify `sessionId` is provided
- Check server logs for LLM API errors

### Cost Seems High
- Review token counts in response
- Compare with pricing table in `cost-calculator.ts`
- Most responses should be <$0.001

### Response Time Slow
- Check LLM provider response time (may be 5-10 seconds)
- Verify server has adequate resources
- Check network connectivity

---

## Production Deployment

### Pre-Deployment Checklist
- [ ] Run `manual-validation.ts` and all tests pass
- [ ] Test with actual team members (Phase 4)
- [ ] Verify cost tracking is accurate
- [ ] Load test: simulate 10+ concurrent requests
- [ ] Error handling: test with invalid inputs
- [ ] Database cleanup: verify session cleanup job

### Deployment Steps
1. Ensure all endpoints respond correctly
2. Verify agents have correct system prompts
3. Test file attachment integration
4. Monitor cost tracking accuracy
5. Collect feedback from team testing
6. Address any critical issues found
7. Deploy to production endpoints

### Monitoring
Monitor these metrics after deployment:
- Average response time per agent
- Total monthly cost
- Error rates
- User satisfaction scores
- Agent classification accuracy

---

## Support

For issues or questions:
- Check WEEK-4-IMPLEMENTATION.md for overview
- Review test logs in `tests/` directory
- Check database for stored messages and costs
- Run manual validation tests to diagnose issues
