import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";
import { getUserContext } from "@/lib/user-context";
import { ensureUserExists } from "@/lib/rbac";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = getUserContext(request);
    ensureUserExists(userContext.email, userContext.role);

    const { id: templateId } = await params;
    const body = await request.json();
    const { project_id, system_prompt_override } = body;

    const db = getDb();

    // Verify template exists
    const template = db
      .prepare("SELECT * FROM agent_templates WHERE id = ?")
      .get(templateId);

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Check if deployment already exists for this template + project combo
    if (project_id) {
      const existing = db
        .prepare(
          "SELECT * FROM agent_deployments WHERE template_id = ? AND project_id = ?"
        )
        .get(templateId, project_id);

      if (existing) {
        // Update existing deployment
        db.prepare(
          "UPDATE agent_deployments SET system_prompt_override = ?, active = 1 WHERE template_id = ? AND project_id = ?"
        ).run(system_prompt_override || null, templateId, project_id);

        const updated = db
          .prepare(
            "SELECT * FROM agent_deployments WHERE template_id = ? AND project_id = ?"
          )
          .get(templateId, project_id);

        return NextResponse.json(updated);
      }
    }

    // Create new deployment
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO agent_deployments (id, template_id, project_id, system_prompt_override, deployed_by, deployed_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, templateId, project_id || null, system_prompt_override || null, userContext.email, now);

    const deployment = db
      .prepare("SELECT * FROM agent_deployments WHERE id = ?")
      .get(id);

    return NextResponse.json(deployment, { status: 201 });
  } catch (error) {
    console.error("POST /api/agent-templates/[id]/deploy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
