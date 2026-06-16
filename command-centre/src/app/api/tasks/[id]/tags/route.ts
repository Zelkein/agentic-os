import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Tag } from "@/types/task";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const tags = db
      .prepare(
        `SELECT t.* FROM tags t
         INNER JOIN task_tags tt ON tt.tagId = t.id
         WHERE tt.taskId = ?
         ORDER BY t.name ASC`
      )
      .all(id) as Tag[];

    return NextResponse.json(tags);
  } catch (error) {
    console.error("GET /api/tasks/[id]/tags error:", error);
    return NextResponse.json({ error: "Failed to fetch task tags" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json() as { tagId: string };

    // Verify task exists
    const task = db.prepare("SELECT id FROM tasks WHERE id = ?").get(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify tag exists
    const tag = db.prepare("SELECT id FROM tags WHERE id = ?").get(body.tagId);
    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Insert (ignore if already exists)
    db.prepare("INSERT OR IGNORE INTO task_tags (taskId, tagId) VALUES (?, ?)").run(id, body.tagId);

    const tags = db
      .prepare(
        `SELECT t.* FROM tags t
         INNER JOIN task_tags tt ON tt.tagId = t.id
         WHERE tt.taskId = ?
         ORDER BY t.name ASC`
      )
      .all(id) as Tag[];

    return NextResponse.json(tags);
  } catch (error) {
    console.error("POST /api/tasks/[id]/tags error:", error);
    return NextResponse.json({ error: "Failed to add tag to task" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json() as { tagId: string };

    db.prepare("DELETE FROM task_tags WHERE taskId = ? AND tagId = ?").run(id, body.tagId);

    const tags = db
      .prepare(
        `SELECT t.* FROM tags t
         INNER JOIN task_tags tt ON tt.tagId = t.id
         WHERE tt.taskId = ?
         ORDER BY t.name ASC`
      )
      .all(id) as Tag[];

    return NextResponse.json(tags);
  } catch (error) {
    console.error("DELETE /api/tasks/[id]/tags error:", error);
    return NextResponse.json({ error: "Failed to remove tag from task" }, { status: 500 });
  }
}