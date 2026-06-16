import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Fallback heuristic parser when API key is not available
function fallbackParse(text: string) {
  const lowerText = text.toLowerCase();

  // Detect role from keywords
  let role = "assistant";
  if (
    lowerText.includes("orchestrator") ||
    lowerText.includes("coordinate") ||
    lowerText.includes("manage") ||
    lowerText.includes("delegate")
  ) {
    role = "orchestrator";
  } else if (
    lowerText.includes("coach") ||
    lowerText.includes("review") ||
    lowerText.includes("mentor") ||
    lowerText.includes("teach")
  ) {
    role = "coach";
  } else if (
    lowerText.includes("specialist") ||
    lowerText.includes("specific") ||
    lowerText.includes("domain")
  ) {
    role = "sub_agent";
  }

  // Extract name from text (first few words or use "Custom Agent")
  let name = "Custom Agent";
  const words = text.split(" ");
  if (words.length > 2) {
    name = words.slice(0, 3).join(" ");
  }

  // Build system prompt based on role and text
  let systemPrompt = "";
  if (role === "coach") {
    systemPrompt = `You are a coaching agent specializing in: ${text}

Your role:
- Review work and provide detailed feedback
- Identify errors and suggest improvements
- Teach principles and best practices
- Enforce quality standards
- Be direct, constructive, and evidence-based

Approach:
1. Understand what was attempted
2. Check against standards and best practices
3. Identify technical issues and opportunities
4. Provide specific, actionable improvements`;
  } else if (role === "orchestrator") {
    systemPrompt = `You are an orchestrator agent responsible for: ${text}

Your role:
- Coordinate workflows and task delegation
- Manage team priorities and dependencies
- Track progress and identify blockers
- Make decisions aligned with project goals
- Communicate status and next steps

Approach:
1. Understand all moving parts
2. Identify dependencies and conflicts
3. Delegate to appropriate specialists
4. Monitor progress and adjust as needed`;
  } else if (role === "sub_agent") {
    systemPrompt = `You are a specialized agent for: ${text}

Your role:
- Handle specific engineering or technical tasks
- Provide expert domain knowledge
- Report results clearly and completely
- Ask clarifying questions when needed
- Support the orchestrator and other agents

Approach:
1. Understand the specific requirement
2. Apply domain expertise
3. Provide detailed, evidence-based results`;
  } else {
    systemPrompt = `You are a personal assistant for: ${text}

Your role:
- Support team members with daily tasks
- Handle calculations, analysis, and modifications
- Answer questions about processes and standards
- Coordinate with other agents as needed
- Track progress and deadlines

Personality: Helpful, proactive, focused on user goals.`;
  }

  return {
    name,
    role,
    system_prompt: systemPrompt,
    confidence: 0.6, // Lower confidence for heuristic parsing
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text field is required" }, { status: 400 });
    }

    // Try Claude API if key is available
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const client = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const prompt = `You are an expert at understanding what AI agents people want to create.

Given this request: "${text}"

Extract and return a JSON object with these fields:
{
  "name": "descriptive agent name (2-4 words)",
  "role": "one of: orchestrator, coach, assistant, or sub_agent",
  "system_prompt": "detailed system prompt (200-400 words) based on their request",
  "confidence": 0.0 to 1.0 (how confident you are in this extraction)
}

Make the system_prompt detailed, actionable, and grounded in their description.
Return ONLY valid JSON, no markdown or extra text.`;

        const message = await client.messages.create({
          model: "claude-opus-4",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const responseText =
          message.content[0].type === "text" ? message.content[0].text : "";

        // Parse JSON from response
        const parsed = JSON.parse(responseText);

        // Validate required fields
        if (!parsed.name || !parsed.role || !parsed.system_prompt) {
          // Fall back to heuristic if parsing failed
          return NextResponse.json(fallbackParse(text));
        }

        // Validate role
        const validRoles = ["orchestrator", "coach", "assistant", "sub_agent"];
        if (!validRoles.includes(parsed.role)) {
          parsed.role = "assistant";
        }

        return NextResponse.json({
          name: parsed.name,
          role: parsed.role,
          system_prompt: parsed.system_prompt,
          confidence: parsed.confidence || 0.85,
        });
      } catch (apiError) {
        console.warn("Claude API parsing failed, using fallback:", apiError);
        return NextResponse.json(fallbackParse(text));
      }
    }

    // No API key available, use fallback parser
    return NextResponse.json(fallbackParse(text));
  } catch (error) {
    console.error("Parse agent intent error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to parse agent intent",
      },
      { status: 500 }
    );
  }
}
