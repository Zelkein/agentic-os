import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";
import { getUserContext } from "@/lib/user-context";
import { ensureUserExists, grantAccess } from "@/lib/rbac";

interface DeploymentConfig {
  agents: {
    template_name: string;
    role: string;
    visibility: "private" | "team" | "public";
    base_prompt: string;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const userContext = getUserContext(request);
    ensureUserExists(userContext.email, userContext.role);

    // Only admins can deploy to team
    if (userContext.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can deploy agents" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { manifest, team_emails } = body;

    if (!manifest || !manifest.agents || !Array.isArray(team_emails)) {
      return NextResponse.json(
        { error: "Invalid request. Provide manifest and team_emails" },
        { status: 400 }
      );
    }

    const db = getDb();
    const now = new Date().toISOString();
    const deploymentResults = [];

    // Ensure all team members exist in users table
    for (const email of team_emails) {
      ensureUserExists(email, "engineer");
    }

    // Deploy each agent in manifest
    for (const agentConfig of manifest.agents) {
      const { template_name, role, visibility, base_prompt } = agentConfig;

      // Create template
      const templateId = randomUUID();
      db.prepare(
        `INSERT INTO agent_templates (id, name, role, base_system_prompt, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(templateId, template_name, role, base_prompt, userContext.email, now);

      // Create agent from template (global deployment, no project_id)
      const agentId = randomUUID();
      db.prepare(
        `INSERT INTO agents (id, name, role, system_prompt, visibility, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(agentId, template_name, role, base_prompt, visibility, userContext.email, now, now);

      // Grant access to all team members (view level for team agents)
      for (const email of team_emails) {
        grantAccess(agentId, email, "view");
      }

      deploymentResults.push({
        agent_id: agentId,
        template_id: templateId,
        name: template_name,
        role,
        visibility,
        granted_to_count: team_emails.length,
      });
    }

    return NextResponse.json(
      {
        success: true,
        deployed_agents: deploymentResults,
        team_members_count: team_emails.length,
        message: `Deployed ${deploymentResults.length} agents to ${team_emails.length} team members`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/deploy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET endpoint to check deployment status
 */
export async function GET(request: NextRequest) {
  try {
    const userContext = getUserContext(request);
    ensureUserExists(userContext.email, userContext.role);

    const db = getDb();

    // Get total agents, templates, and deployments
    const agentCount = (
      db.prepare("SELECT COUNT(*) as count FROM agents").get() as {
        count: number;
      }
    ).count;

    const templateCount = (
      db.prepare("SELECT COUNT(*) as count FROM agent_templates").get() as {
        count: number;
      }
    ).count;

    const deploymentCount = (
      db.prepare("SELECT COUNT(*) as count FROM agent_deployments").get() as {
        count: number;
      }
    ).count;

    const userCount = (
      db.prepare("SELECT COUNT(*) as count FROM users").get() as {
        count: number;
      }
    ).count;

    return NextResponse.json({
      total_agents: agentCount,
      total_templates: templateCount,
      total_deployments: deploymentCount,
      total_users: userCount,
    });
  } catch (error) {
    console.error("GET /api/deploy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
