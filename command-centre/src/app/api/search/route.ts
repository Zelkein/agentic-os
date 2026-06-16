import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const db = getDb();

  // Sanitize FTS5 query: escape special chars, wrap in quotes for prefix search
  const sanitized = q.replace(/['"*()]/g, "").trim();
  if (!sanitized) {
    return NextResponse.json({ results: [] });
  }
  const ftsQuery = `"${sanitized}"*`;

  try {
    // Search tasks via FTS
    const tasks: Array<{
      id: string;
      title: string;
      description: string | null;
      status: string;
      priority: string;
      rank: number;
    }> = db
      .prepare(
        `SELECT t.id, t.title, t.description, t.status, t.priority, rank
         FROM tasks_fts f
         JOIN tasks t ON t.rowid = f.rowid
         WHERE tasks_fts MATCH ?
         ORDER BY rank
         LIMIT ?`
      )
      .all(ftsQuery, limit) as any;

    // Search comments via FTS
    const comments: Array<{
      taskId: string;
      taskTitle: string;
      content: string;
      rank: number;
    }> = db
      .prepare(
        `SELECT c.taskId, t.title as taskTitle, c.content, rank
         FROM task_comments_fts f
         JOIN task_comments c ON c.rowid = f.rowid
         JOIN tasks t ON t.id = c.taskId
         WHERE task_comments_fts MATCH ?
         ORDER BY rank
         LIMIT ?`
      )
      .all(ftsQuery, limit) as any;

    // Fallback: LIKE search if FTS returned nothing (for very short queries)
    let likeResults: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
    }> = [];
    if (tasks.length === 0 && comments.length === 0) {
      likeResults = db
        .prepare(
          `SELECT id, title, status, priority FROM tasks
           WHERE title LIKE ? OR description LIKE ?
           ORDER BY createdAt DESC
           LIMIT ?`
        )
        .all(`%${sanitized}%`, `%${sanitized}%`, limit) as any;
    }

    return NextResponse.json({
      results: {
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          type: "task" as const,
        })),
        comments: comments.map((c) => ({
          taskId: c.taskId,
          taskTitle: c.taskTitle,
          snippet: c.content.slice(0, 200),
          type: "comment" as const,
        })),
        likeResults: likeResults.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          type: "task" as const,
        })),
      },
    });
  } catch (err) {
    console.error("[search] FTS5 error:", err);
    // Fallback to LIKE-only search
    try {
      const fallback = db
        .prepare(
          `SELECT id, title, status, priority FROM tasks
           WHERE title LIKE ? OR description LIKE ?
           ORDER BY createdAt DESC
           LIMIT ?`
        )
        .all(`%${sanitized}%`, `%${sanitized}%`, limit) as any;
      return NextResponse.json({
        results: {
          tasks: fallback.map((t: any) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            type: "task",
          })),
          comments: [],
          likeResults: [],
        },
      });
    } catch {
      return NextResponse.json({ results: [] });
    }
  }
}
