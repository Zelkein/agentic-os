import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (err) {
    console.error("Error fetching agent:", err);
    return NextResponse.json({ error: "Failed to fetch agent" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE agents SET
        name = COALESCE(?, name),
        role = COALESCE(?, role),
        system_prompt = COALESCE(?, system_prompt),
        context = COALESCE(?, context),
        skills_json = COALESCE(?, skills_json),
        workflows_json = COALESCE(?, workflows_json),
        llm_provider = COALESCE(?, llm_provider),
        llm_model = COALESCE(?, llm_model),
        owner_email = COALESCE(?, owner_email),
        temperature = COALESCE(?, temperature),
        maxTokens = COALESCE(?, maxTokens),
        topP = COALESCE(?, topP),
        frequencyPenalty = COALESCE(?, frequencyPenalty),
        presencePenalty = COALESCE(?, presencePenalty),
        updated_at = ?
       WHERE id = ?`
    ).run(
      name,
      role,
      system_prompt,
      context,
      skills_json ? JSON.stringify(skills_json) : undefined,
      workflows_json ? JSON.stringify(workflows_json) : undefined,
      llm_provider,
      llm_model,
      owner_email,
      temperature ?? undefined,
      maxTokens ?? undefined,
      topP ?? undefined,
      frequencyPenalty ?? undefined,
      presencePenalty ?? undefined,
      now,
      id
    );

    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
    return NextResponse.json(agent);
  } catch (err) {
    console.error("Error updating agent:", err);
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    db.prepare("DELETE FROM agents WHERE id = ?").run(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting agent:", err);
    return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 });
  }
}
