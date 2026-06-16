import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { emitTaskEvent } from "@/lib/event-bus";
import crypto from "crypto";
import type { TaskComment } from "@/types/task";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const comments = db
      .prepare(
        "SELECT * FROM task_comments WHERE taskId = ? ORDER BY createdAt ASC"
      )
      .all(id) as TaskComment[];

    return NextResponse.json(comments);
  } catch (error) {
    console.error("GET /api/tasks/[id]/comments error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json() as { content: string; author?: string };

    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    // Verify task exists
    const task = db.prepare("SELECT id FROM tasks WHERE id = ?").get(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const commentId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      "INSERT INTO task_comments (id, taskId, author, content, createdAt) VALUES (?, ?, ?, ?, ?)"
    ).run(commentId, id, body.author || "", body.content.trim(), now);

    const comment = db.prepare("SELECT * FROM task_comments WHERE id = ?").get(commentId) as TaskComment;

    // Emit event so UI updates in real-time
    emitTaskEvent({
      type: "task:updated",
      task: { id, updatedAt: now } as any,
      timestamp: now,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks/[id]/comments error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}