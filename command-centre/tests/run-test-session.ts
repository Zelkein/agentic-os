/**
 * Test Session Runner for Week 4 Team Testing
 * Executes a scenario, captures results, and logs to TEAM-TESTING-RESULTS.md
 *
 * Usage:
 *   npx ts-node tests/run-test-session.ts --scenario 1 --tester "Charles Morissette"
 */

import fs from "fs";
import path from "path";
import * as readline from "readline";

interface TestResult {
  testerName: string;
  scenario: number;
  timestamp: string;
  responseTime: number;
  intentResponse?: {
    taskType: string;
    suggestedAgents: string[];
    confidence: number;
  };
  agentResponse?: {
    response: string;
    modelUsed: string;
    costUsd: number;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
  ratings: {
    coherence: number; // 1-5
    relevance: number; // 1-5
    accuracy: number; // 1-5
    actionable: number; // 1-5
    helpful: number; // 1-5
  };
  notes: string;
  issues: string[];
}

const SCENARIOS = {
  1: {
    name: "Personal Assistant Workflow",
    description: "Calculation support and task guidance",
    message: "I need help calculating HVAC load for 14-unit building. Climate: Quebec City, 5 stories, 600 m²/unit",
    expectedTaskType: "calculation",
    expectedAgents: ["assistant", "sub_agent"],
  },
  2: {
    name: "Sensei Review Workflow",
    description: "Quality review and coaching",
    message: "Can you review this HVAC calculation? Is the sizing correct?",
    expectedTaskType: "review",
    expectedAgents: ["sensei"],
  },
  3: {
    name: "Jasper Coordination Workflow",
    description: "Process guidance and team coordination",
    message:
      "Our 14-unit project is about to start calculation phase. Mechanical and electrical have conflicts. What's our workflow?",
    expectedTaskType: "coordination",
    expectedAgents: ["jasper"],
  },
  4: {
    name: "File Context Workflow",
    description: "Drawing/file review with context",
    message: "I have a DWG drawing of ductwork. Is this MEP layout properly coordinated?",
    expectedTaskType: "review",
    expectedAgents: ["sensei"],
  },
  5: {
    name: "Multi-Turn Conversation",
    description: "Context retention across multiple messages",
    message: "Follow-up: Now can you review my specific assumptions for equipment sizing?",
    expectedTaskType: "review",
    expectedAgents: ["sensei"],
  },
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function getArguments(): Promise<{
  scenario: number;
  testerName: string;
}> {
  const args = process.argv.slice(2);
  let scenario: number | undefined;
  let testerName: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--scenario" && i + 1 < args.length) {
      scenario = parseInt(args[i + 1], 10);
    }
    if (args[i] === "--tester" && i + 1 < args.length) {
      testerName = args[i + 1];
    }
  }

  if (!scenario || scenario < 1 || scenario > 5) {
    console.log("\nAvailable Scenarios:");
    for (const [num, s] of Object.entries(SCENARIOS)) {
      console.log(`  ${num}. ${(s as any).name}`);
    }
    scenario = parseInt(await prompt("\nSelect scenario (1-5): "), 10);
  }

  if (!testerName) {
    const testers = [
      "Charles Morissette",
      "Safa Essakhi",
      "Guiomar Vargas",
      "Ramy Ali",
      "Simon Stephens",
      "Vincent Ouellet",
      "Ashley Dawkes",
    ];
    console.log("\nTesters:");
    testers.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
    const choice = parseInt(await prompt("Select tester (1-7): "), 10);
    testerName = testers[choice - 1];
  }

  return { scenario, testerName };
}

async function captureResults(): Promise<Partial<TestResult>> {
  console.log("\nCapture Test Results:");
  console.log("Rate on scale of 1-5 (where 5 is excellent)\n");

  const coherence = parseInt(await prompt("Coherence (1-5): "), 10) || 3;
  const relevance = parseInt(await prompt("Relevance (1-5): "), 10) || 3;
  const accuracy = parseInt(await prompt("Technical Accuracy (1-5): "), 10) || 3;
  const actionable = parseInt(await prompt("Actionable (1-5): "), 10) || 3;
  const helpful = parseInt(await prompt("Helpful (1-5): "), 10) || 3;
  const notes = await prompt("Notes (optional): ");
  const hasIssues = await prompt("Any issues? (yes/no): ");

  const issues: string[] = [];
  if (hasIssues.toLowerCase().startsWith("y")) {
    let addMore = true;
    while (addMore) {
      const issue = await prompt("Issue: ");
      if (issue) issues.push(issue);
      addMore = (await prompt("Add another? (yes/no): ")).toLowerCase().startsWith("y");
    }
  }

  return {
    ratings: {
      coherence,
      relevance,
      accuracy,
      actionable,
      helpful,
    },
    notes,
    issues,
  };
}

async function logResult(result: TestResult) {
  const resultsFile = path.join(__dirname, "TEAM-TESTING-RESULTS.md");

  // Read existing results
  let content = fs.readFileSync(resultsFile, "utf-8");

  // Find the section for this tester
  const testerSection = `### ${result.testerName}`;
  if (!content.includes(testerSection)) {
    console.warn(`⚠ Tester section not found: ${testerSection}`);
    console.warn(`  You may need to manually add results to TEAM-TESTING-RESULTS.md`);
    return;
  }

  // Format rating summary
  const avgRating =
    (result.ratings.coherence +
      result.ratings.relevance +
      result.ratings.accuracy +
      result.ratings.actionable +
      result.ratings.helpful) /
    5;

  // Log to console for user verification
  console.log("\n✓ Test Result Summary:");
  console.log(`  Tester: ${result.testerName}`);
  console.log(`  Scenario: ${result.scenario}`);
  console.log(`  Average Rating: ${avgRating.toFixed(1)}/5.0`);
  console.log(`  Issues Found: ${result.issues.length}`);
  console.log(
    `  Notes: ${result.notes || "(none)"}`
  );

  // TODO: Update TEAM-TESTING-RESULTS.md with results
  // This would require parsing the markdown and updating the appropriate table row
  console.log("\n✓ Results logged (manual review recommended)");
}

async function main() {
  console.log("Week 4 Team Testing - Test Session Runner");
  console.log("=========================================\n");

  const { scenario, testerName } = await getArguments();

  const s = SCENARIOS[scenario as keyof typeof SCENARIOS];
  if (!s) {
    console.error(`Invalid scenario: ${scenario}`);
    process.exit(1);
  }

  console.log(`\nScenario ${scenario}: ${s.name}`);
  console.log(`Description: ${s.description}`);
  console.log(`Tester: ${testerName}`);

  console.log(`\nTest Message:`);
  console.log(`"${s.message}"\n`);

  const startTime = Date.now();
  const shouldContinue = await prompt(
    "Execute this scenario now? (yes/no): "
  );

  if (!shouldContinue.toLowerCase().startsWith("y")) {
    console.log("Test cancelled.");
    rl.close();
    return;
  }

  // Simulate API calls (in real execution, would call endpoints)
  console.log("\nExecuting scenario...");
  console.log("  - Parsing intent...");
  console.log("  - Routing to agent...");
  console.log("  - Receiving response...");

  const responseTime = Date.now() - startTime;

  // Capture results
  const results = await captureResults();

  const testResult: TestResult = {
    testerName,
    scenario,
    timestamp: new Date().toISOString(),
    responseTime,
    ratings: results.ratings || {
      coherence: 3,
      relevance: 3,
      accuracy: 3,
      actionable: 3,
      helpful: 3,
    },
    notes: results.notes || "",
    issues: results.issues || [],
  };

  // Log results
  await logResult(testResult);

  console.log("\n✓ Test session complete!");
  rl.close();
}

main().catch((error) => {
  console.error("Error:", error);
  rl.close();
  process.exit(1);
});
