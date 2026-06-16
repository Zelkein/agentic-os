import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/user-context";
import { canDeleteAgent, ensureUserExists, grantAccess } from "@/lib/rbac";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = getUserContext(req);
    ensureUserExists(userContext.email, userContext.role);

    const { id } = await params;
    const body = await req.json();
    const { email, access_level = "view" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!["view", "edit", "admin"].includes(access_level)) {
      return NextResponse.json(
        { error: "Invalid access level. Must be view, edit, or admin" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify agent exists
    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Check if user is authorized to share (must be creator or admin)
    if (!canDeleteAgent(userContext.email, id)) {
      return NextResponse.json(
        { error: "Not authorized to share this agent" },
        { status: 403 }
      );
    }

    // Ensure target user exists in users table
    ensureUserExists(email, "engineer");

    // Grant access
    grantAccess(id, email, access_level);

    return NextResponse.json({
      success: true,
      agent_id: id,
      shared_with: email,
      access_level,
    });
  } catch (err) {
    console.error("Error sharing agent:", err);
    return NextResponse.json({ error: "Failed to share agent" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = getUserContext(req);
    ensureUserExists(userContext.email, userContext.role);

    const { id } = await params;
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const db = getDb();

    // Verify agent exists
    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Check if user is authorized to revoke (must be creator or admin)
    if (!canDeleteAgent(userContext.email, id)) {
      return NextResponse.json(
        { error: "Not authorized to revoke access to this agent" },
        { status: 403 }
      );
    }

    // Revoke access
    db.prepare("DELETE FROM agent_access WHERE agent_id = ? AND user_email = ?").run(id, email);

    return NextResponse.json({
      success: true,
      agent_id: id,
      revoked_from: email,
    });
  } catch (err) {
    console.error("Error revoking agent access:", err);
    return NextResponse.json(
      { error: "Failed to revoke agent access" },
      { status: 500 }
    );
  }
}
