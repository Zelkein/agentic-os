import { NextRequest, NextResponse } from "next/server";

/**
 * Intent Parser for chat messages
 * Analyzes user messages to determine task type and suggest appropriate agents
 */

export interface ParseIntentResponse {
  taskType: string;
  suggestedAgents: string[];
  confidence: number;
  reasoning: string;
}

// Task type keywords for heuristic matching
const taskTypePatterns: Record<string, { keywords: string[]; agents: string[] }> = {
  review: {
    keywords: ["review", "check", "verify", "validate", "correct", "audit", "examine"],
    agents: ["sensei"],
  },
  calculation: {
    keywords: [
      "calculate",
      "compute",
      "determine",
      "estimate",
      "size",
      "load",
      "analysis",
      "analyze",
    ],
    agents: ["assistant", "sub_agent"],
  },
  coordination: {
    keywords: [
      "coordinate",
      "align",
      "sync",
      "conflict",
      "discipline",
      "interface",
      "integrate",
      "dependencies",
    ],
    agents: ["jasper"],
  },
  explanation: {
    keywords: ["explain", "how", "why", "understand", "teach", "learn", "help me", "what is"],
    agents: ["sensei", "assistant"],
  },
  project_management: {
    keywords: [
      "schedule",
      "timeline",
      "deadline",
      "priority",
      "milestone",
      "status",
      "progress",
      "workflow",
    ],
    agents: ["jasper"],
  },
  support: {
    keywords: [
      "help",
      "need",
      "issue",
      "problem",
      "stuck",
      "error",
      "question",
      "unclear",
      "guidance",
    ],
    agents: ["assistant"],
  },
};

/**
 * Heuristic parser: Use keyword matching to classify intent
 */
function classifyIntentHeuristic(
  message: string
): { taskType: string; suggestedAgents: string[]; confidence: number } {
  const lowerMessage = message.toLowerCase();
  const scores: Record<string, number> = {};

  // Score each task type based on keyword matches
  for (const [taskType, { keywords }] of Object.entries(taskTypePatterns)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        score += 1;
      }
    }
    scores[taskType] = score;
  }

  // Find the task type with the highest score
  const bestMatch = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
  const taskType = bestMatch ? bestMatch[0] : "support";
  const score = bestMatch ? bestMatch[1] : 0;

  // Calculate confidence (0-1)
  // If no keywords matched, confidence is low (0.3)
  // If some keywords matched, confidence increases (0.5-0.8)
  const confidence = Math.min(0.3 + (score / 3) * 0.5, 0.9);

  return {
    taskType,
    suggestedAgents: taskTypePatterns[taskType]?.agents || ["assistant"],
    confidence,
  };
}

/**
 * Analyze message for context clues:
 * - Attached files → likely review task
 * - Mentions of other team members → likely coordination task
 * - Contains numbers → likely calculation task
 */
function enrichWithContext(
  message: string,
  taskType: string,
  files?: any[]
): { taskType: string; suggestedAgents: string[]; confidence: number } {
  let agents = taskTypePatterns[taskType]?.agents || ["assistant"];

  // If files attached, suggest review-focused agents
  if (files && files.length > 0) {
    const hasCalcFile = files.some(
      (f: any) => f.type === "xlsx" || f.type === "pdf"
    );
    const hasDrawingFile = files.some((f: any) => f.type === "dwg");

    if (hasCalcFile && taskType === "support") {
      // Review calculations is primary task
      return {
        taskType: "review",
        suggestedAgents: ["sensei"],
        confidence: 0.75,
      };
    }

    if (hasDrawingFile && (taskType === "support" || taskType === "review")) {
      // Coordination review for drawings
      return {
        taskType: "review",
        suggestedAgents: ["sensei", "jasper"],
        confidence: 0.7,
      };
    }
  }

  // Boost confidence if multiple strong signals
  const containsNumbers = /\d+/.test(message);
  let confidence = taskType === "calculation" && containsNumbers ? 0.8 : 0.6;

  return {
    taskType,
    suggestedAgents: agents,
    confidence,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, message, attachedFiles, agentPreference } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "message field is required" },
        { status: 400 }
      );
    }

    // If user specified a preference, skip analysis and return that
    if (agentPreference) {
      const validAgents = ["jasper", "sensei", "assistant"];
      if (validAgents.includes(agentPreference)) {
        return NextResponse.json({
          taskType: "user_preference",
          suggestedAgents: [agentPreference],
          confidence: 1.0,
          reasoning: `User selected ${agentPreference} directly.`,
        });
      }
    }

    // Classify intent using heuristic parser
    let result = classifyIntentHeuristic(message);

    // Enrich with context (files, mentions, etc.)
    result = enrichWithContext(message, result.taskType, attachedFiles);

    // Generate reasoning explanation
    const reasoning =
      result.confidence > 0.7
        ? `Detected ${result.taskType} task from message keywords.`
        : `Message suggests ${result.taskType} task (low confidence). Consider ${result.suggestedAgents[0]} agent.`;

    return NextResponse.json({
      taskType: result.taskType,
      suggestedAgents: result.suggestedAgents,
      confidence: result.confidence,
      reasoning,
    });
  } catch (error) {
    console.error("Parse user intent error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to parse user intent",
      },
      { status: 500 }
    );
  }
}
