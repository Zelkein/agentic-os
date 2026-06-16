import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
  const unreadOnly = searchParams.get("unread") === "true";

  const db = getDb();
  let query = "SELECT * FROM notifications";
  const params: any[] = [];

  if (unreadOnly) {
    query += " WHERE read = 0";
  }

  query += " ORDER BY createdAt DESC LIMIT ?";
  params.push(limit);

  const notifications = db.prepare(query).all(...params) as Array<{
    id: string;
    type: string;
    title: string;
    message: string | null;
    taskId: string | null;
    read: number;
    createdAt: string;
  }>;

  // Count unread
  const unreadCount = db
    .prepare("SELECT COUNT(*) as cnt FROM notifications WHERE read = 0")
    .get() as { cnt: number };

  return NextResponse.json({
    notifications,
    unreadCount: unreadCount.cnt,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, title, message, taskId } = body;

  if (!type || !title) {
    return NextResponse.json(
      { error: "type and title are required" },
      { status: 400 }
    );
  }

  const validTypes = [
    "task_assigned",
    "task_completed",
    "task_failed",
    "task_comment",
    "task_status_change",
    "system",
  ];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: `Invalid type: ${type}` }, { status: 400 });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO notifications (id, type, title, message, taskId, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, type, title, message || null, taskId || null, now);

  return NextResponse.json({ id }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  // Mark all as read
  const db = getDb();
  db.exec("UPDATE notifications SET read = 1 WHERE read = 0");
  return NextResponse.json({ ok: true });
}
