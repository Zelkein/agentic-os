import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";
import { getUserContext } from "@/lib/user-context";
import { ensureUserExists } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const userContext = getUserContext(request);
    ensureUserExists(userContext.email, userContext.role);

    const db = getDb();
    const templates = db.prepare("SELECT * FROM agent_templates ORDER BY created_at DESC").all();

    return NextResponse.json(templates);
  } catch (error) {
    console.error("GET /api/agent-templates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = getUserContext(request);
    ensureUserExists(userContext.email, userContext.role);

    const body = await request.json();
    const { name, role, base_system_prompt, version = "v1" } = body;

    if (!name || !role) {
      return NextResponse.json(
        { error: "Name and role are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO agent_templates (id, name, role, base_system_prompt, version, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, name, role, base_system_prompt || null, version, userContext.email, now);

    const template = db.prepare("SELECT * FROM agent_templates WHERE id = ?").get(id);
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("POST /api/agent-templates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
