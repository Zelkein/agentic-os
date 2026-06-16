import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Tag } from "@/types/task";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const existing = db.prepare("SELECT * FROM tags WHERE id = ?").get(id) as Tag | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const body = await request.json() as { name?: string; color?: string };

    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.name !== undefined) {
      updates.push("name = ?");
      values.push(body.name.trim());
    }
    if (body.color !== undefined) {
      updates.push("color = ?");
      values.push(body.color);
    }

    if (updates.length === 0) {
      return NextResponse.json(existing);
    }

    db.prepare(`UPDATE tags SET ${updates.join(", ")} WHERE id = ?`).run(...values, id);

    const updated = db.prepare("SELECT * FROM tags WHERE id = ?").get(id) as Tag;
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/tags/[id] error:", error);
    return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const existing = db.prepare("SELECT * FROM tags WHERE id = ?").get(id) as Tag | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // CASCADE will clean up task_tags entries
    db.prepare("DELETE FROM tags WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tags/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}