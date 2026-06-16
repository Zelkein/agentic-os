import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { AgentChatSession } from "@/types/agent-chat";
import { randomUUID } from "crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    // Verify agent exists
    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");
    
    let sessions: AgentChatSession[];
    if (userEmail) {
      sessions = db
        .prepare(
          "SELECT * FROM chat_sessions WHERE agent_id = ? AND user_email = ? ORDER BY updated_at DESC"
        )
        .all(id, userEmail) as AgentChatSession[];
    } else {
      sessions = db
        .prepare(
          "SELECT * FROM chat_sessions WHERE agent_id = ? ORDER BY updated_at DESC"
        )
        .all(id) as AgentChatSession[];
    }
    
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("GET /api/agents/[id]/chat/sessions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const db = getDb();

    // Verify agent exists
    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(agentId);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    
    const body = await request.json();
    const { userEmail, title } = body;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: "userEmail is required" },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    const session: AgentChatSession = {
      id: randomUUID(),
      agent_id: agentId,
      user_email: userEmail,
      title: title || null,
      created_at: now,
      updated_at: now,
    };
    
    db.prepare(
      `INSERT INTO chat_sessions (id, agent_id, user_email, title, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      session.id,
      session.agent_id,
      session.user_email,
      session.title,
      session.created_at,
      session.updated_at
    );
    
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("POST /api/agents/[id]/chat/sessions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}