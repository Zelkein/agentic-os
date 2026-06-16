import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface BoardColumn {
  id: string;
  title: string;
  statuses: string[];
  wipLimit: number | null;
  columnOrder: number;
}

export async function GET() {
  try {
    const db = getDb();
    const rows = db
      .prepare("SELECT * FROM board_columns ORDER BY columnOrder ASC")
      .all() as Array<{
      id: string;
      title: string;
      statuses: string;
      wipLimit: number | null;
      columnOrder: number;
    }>;

    const columns: BoardColumn[] = rows.map((r) => ({
      ...r,
      statuses: JSON.parse(r.statuses || "[]"),
    }));

    return NextResponse.json(columns);
  } catch (error) {
    console.error("GET /api/board-columns error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { title, statuses, wipLimit } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!Array.isArray(statuses) || statuses.length === 0) {
      return NextResponse.json({ error: "statuses must be a non-empty array" }, { status: 400 });
    }

    // Get max columnOrder
    const maxOrder = db
      .prepare("SELECT COALESCE(MAX(columnOrder), -1) as maxOrder FROM board_columns")
      .get() as { maxOrder: number };

    const id = `col_${crypto.randomUUID().slice(0, 8)}`;
    db.prepare(
      "INSERT INTO board_columns (id, title, statuses, wipLimit, columnOrder) VALUES (?, ?, ?, ?, ?)"
    ).run(id, title.trim(), JSON.stringify(statuses), wipLimit ?? null, maxOrder.maxOrder + 1);

    const column: BoardColumn = {
      id,
      title: title.trim(),
      statuses,
      wipLimit: wipLimit ?? null,
      columnOrder: maxOrder.maxOrder + 1,
    };

    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    console.error("POST /api/board-columns error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, title, statuses, wipLimit, columnOrder } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = db.prepare("SELECT id FROM board_columns WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (title !== undefined) {
      updates.push("title = ?");
      params.push(title.trim());
    }
    if (statuses !== undefined) {
      updates.push("statuses = ?");
      params.push(JSON.stringify(statuses));
    }
    if (wipLimit !== undefined) {
      updates.push("wipLimit = ?");
      params.push(wipLimit ?? null);
    }
    if (columnOrder !== undefined) {
      updates.push("columnOrder = ?");
      params.push(columnOrder);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    params.push(id);
    db.prepare(`UPDATE board_columns SET ${updates.join(", ")} WHERE id = ?`).run(...params);

    const updated = db.prepare("SELECT * FROM board_columns WHERE id = ?").get(id) as any;
    const column: BoardColumn = {
      ...updated,
      statuses: JSON.parse(updated.statuses || "[]"),
    };

    return NextResponse.json(column);
  } catch (error) {
    console.error("PUT /api/board-columns error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id query param is required" }, { status: 400 });
    }

    const existing = db.prepare("SELECT id FROM board_columns WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    // Don't allow deleting the last column
    const count = db.prepare("SELECT COUNT(*) as cnt FROM board_columns").get() as { cnt: number };
    if (count.cnt <= 1) {
      return NextResponse.json({ error: "Cannot delete the last column" }, { status: 400 });
    }

    db.prepare("DELETE FROM board_columns WHERE id = ?").run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/board-columns error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}