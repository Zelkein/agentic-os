import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const views = db
    .prepare("SELECT * FROM saved_views ORDER BY createdAt DESC")
    .all() as Array<{
    id: string;
    name: string;
    filters: string;
    sort: string;
    viewType: string;
    clientId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  return NextResponse.json(
    views.map((v) => ({ ...v, filters: JSON.parse(v.filters) }))
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, filters, sort, viewType, clientId } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO saved_views (id, name, filters, sort, viewType, clientId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    name.trim(),
    JSON.stringify(filters || {}),
    sort || "createdAt",
    viewType || "board",
    clientId || null,
    now,
    now
  );

  return NextResponse.json({ id, name: name.trim() }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, filters, sort, viewType } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const db = getDb();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const params: any[] = [];

  if (name !== undefined) {
    updates.push("name = ?");
    params.push(name.trim());
  }
  if (filters !== undefined) {
    updates.push("filters = ?");
    params.push(JSON.stringify(filters));
  }
  if (sort !== undefined) {
    updates.push("sort = ?");
    params.push(sort);
  }
  if (viewType !== undefined) {
    updates.push("viewType = ?");
    params.push(viewType);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  updates.push("updatedAt = ?");
  params.push(now);
  params.push(id);

  db.prepare(`UPDATE saved_views SET ${updates.join(", ")} WHERE id = ?`).run(
    ...params
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const db = getDb();
  db.prepare("DELETE FROM saved_views WHERE id = ?").run(id);

  return NextResponse.json({ ok: true });
}
