import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const db = getDb();
    const agents = db
      .prepare("SELECT * FROM agents ORDER BY created_at DESC")
      .all();
    return NextResponse.json(agents);
  } catch (err) {
    console.error("Error fetching agents:", err);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      role,
      system_prompt,
      context,
      skills_json,
      workflows_json,
      llm_provider,
      llm_model,
      owner_email,
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
    } = body;

    // Validate required fields
    if (!name || !role || !system_prompt || !llm_provider || !llm_model) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO agents (id, name, role, system_prompt, context, skills_json, workflows_json, llm_provider, llm_model, owner_email, temperature, maxTokens, topP, frequencyPenalty, presencePenalty, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      name,
      role,
      system_prompt,
      context || null,
      skills_json ? JSON.stringify(skills_json) : "[]",
      workflows_json ? JSON.stringify(workflows_json) : "[]",
      llm_provider,
      llm_model,
      owner_email || null,
      temperature ?? 0.7,
      maxTokens ?? 2000,
      topP ?? 1.0,
      frequencyPenalty ?? 0.0,
      presencePenalty ?? 0.0,
      now,
      now
    );

    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
    return NextResponse.json(agent, { status: 201 });
  } catch (err) {
    console.error("Error creating agent:", err);
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}
