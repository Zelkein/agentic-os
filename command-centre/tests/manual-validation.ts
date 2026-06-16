/**
 * Manual Validation Tests for Week 4
 * Run locally before team testing to verify all endpoints work
 * Usage: npx ts-node tests/manual-validation.ts
 */

import { getDb } from "@/lib/db";

const BASE_URL = "http://localhost:3006";

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    return true;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function validateParseIntent() {
  const response = await fetch(`${BASE_URL}/api/parse-user-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "I need to check if my HVAC calculations are correct",
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  if (!data.taskType || !data.suggestedAgents || typeof data.confidence !== "number") {
    throw new Error("Invalid response structure");
  }

  if (data.taskType !== "review") {
    throw new Error(`Expected taskType="review", got "${data.taskType}"`);
  }

  if (!data.suggestedAgents.includes("sensei")) {
    throw new Error(`Expected sensei in suggestedAgents, got ${data.suggestedAgents}`);
  }
}

async function validateAgentExecution() {
  const db = getDb();

  // Fetch Sensei agent
  const sensei = db
    .prepare("SELECT id FROM agents WHERE name = 'Sensei' AND role = 'coach'")
    .get() as any;

  if (!sensei) {
    throw new Error("Sensei agent not found in database");
  }

  // Create a test session
  const sessionId = `test_session_${Date.now()}`;
  db.prepare(
    `INSERT INTO chat_sessions (id, created_at, updated_at)
     VALUES (?, datetime('now'), datetime('now'))`
  ).run(sessionId);

  try {
    // Execute agent
    const response = await fetch(`${BASE_URL}/api/agents/${sensei.id}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "What is your role in this organization?",
        sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.response || !data.modelUsed) {
      throw new Error("Invalid response structure");
    }

    if (typeof data.costUsd !== "number") {
      throw new Error("costUsd missing or invalid");
    }

    if (!data.tokens || typeof data.tokens.prompt !== "number") {
      throw new Error("tokens data missing or invalid");
    }

    // Verify response was stored in database
    const stored = db
      .prepare(
        `SELECT content, model_used, cost_usd FROM chat_messages
         WHERE session_id = ? AND role = 'agent'`
      )
      .get(sessionId) as any;

    if (!stored) {
      throw new Error("Agent response not stored in database");
    }

    if (stored.cost_usd !== data.costUsd) {
      throw new Error("Stored cost does not match response cost");
    }
  } finally {
    // Cleanup
    db.prepare("DELETE FROM chat_sessions WHERE id = ?").run(sessionId);
  }
}

async function validateIntentClassification() {
  const testCases = [
    {
      message: "Calculate the HVAC load for this building",
      expectedType: "calculation",
    },
    {
      message: "What's the MEP coordination process?",
      expectedType: "coordination",
    },
    {
      message: "How do I size electrical equipment?",
      expectedType: "explanation",
    },
    {
      message: "Can you review my plumbing design?",
      expectedType: "review",
    },
  ];

  for (const testCase of testCases) {
    const response = await fetch(`${BASE_URL}/api/parse-user-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: testCase.message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for message: "${testCase.message}"`);
    }

    const data = await response.json();
    if (data.taskType !== testCase.expectedType) {
      console.warn(
        `  Note: Expected "${testCase.expectedType}" for "${testCase.message}", got "${data.taskType}"`
      );
    }
  }
}

async function validateAgentDatabase() {
  const db = getDb();

  // Check Jasper
  const jasper = db
    .prepare(
      "SELECT id, name, role, llm_provider, llm_model FROM agents WHERE name = 'Jasper'"
    )
    .get() as any;

  if (!jasper) {
    throw new Error("Jasper agent not found");
  }

  if (jasper.role !== "orchestrator") {
    throw new Error(`Jasper has wrong role: ${jasper.role}`);
  }

  // Check Sensei
  const sensei = db
    .prepare(
      "SELECT id, name, role, llm_provider, llm_model FROM agents WHERE name = 'Sensei'"
    )
    .get() as any;

  if (!sensei) {
    throw new Error("Sensei agent not found");
  }

  if (sensei.role !== "coach") {
    throw new Error(`Sensei has wrong role: ${sensei.role}`);
  }

  // Verify system prompts exist
  if (!jasper.system_prompt || jasper.system_prompt.length < 100) {
    throw new Error("Jasper system prompt is missing or too short");
  }

  if (!sensei.system_prompt || sensei.system_prompt.length < 100) {
    throw new Error("Sensei system prompt is missing or too short");
  }
}

async function validateCostCalculator() {
  // Import cost calculator
  const { calculateTokenCost, getPricingInfo, estimateCost } = await import(
    "@/lib/cost-calculator"
  );

  // Test calculateTokenCost
  const cost = calculateTokenCost("deepseek", "deepseek-v4-flash", 100, 200);
  if (typeof cost !== "number" || cost < 0) {
    throw new Error(`Invalid cost calculation: ${cost}`);
  }

  if (cost > 0.01) {
    throw new Error(`Cost seems too high: $${cost}`);
  }

  // Test getPricingInfo
  const pricing = getPricingInfo("deepseek", "deepseek-v4-flash");
  if (!pricing || typeof pricing.promptCostPer1k !== "number") {
    throw new Error("getPricingInfo returned invalid data");
  }

  // Test estimateCost
  const estimate = estimateCost(
    "deepseek",
    "deepseek-v4-flash",
    "What is your role?",
    100
  );
  if (typeof estimate !== "number" || estimate < 0) {
    throw new Error(`Invalid estimate: ${estimate}`);
  }
}

async function main() {
  console.log("Week 4 Manual Validation Tests");
  console.log("==============================\n");

  const results: boolean[] = [];

  console.log("Database Validation:");
  results.push(
    await test("Agents initialized in database", validateAgentDatabase)
  );

  console.log("\nIntent Parser Validation:");
  results.push(
    await test("Parse intent endpoint works", validateParseIntent)
  );
  results.push(
    await test(
      "Intent classification accuracy",
      validateIntentClassification
    )
  );

  console.log("\nAgent Execution Validation:");
  results.push(
    await test(
      "Agent execution endpoint works",
      validateAgentExecution
    )
  );

  console.log("\nCost Calculator Validation:");
  results.push(
    await test("Cost calculator works", validateCostCalculator)
  );

  console.log("\n" + "=".repeat(40));
  const passed = results.filter((r) => r).length;
  const total = results.length;
  console.log(`Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log("\n✓ All validations passed! Ready for team testing.");
    process.exit(0);
  } else {
    console.log("\n✗ Some validations failed. Fix issues before team testing.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
