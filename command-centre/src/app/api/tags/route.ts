import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { emitTaskEvent } from "@/lib/event-bus";
import crypto from "crypto";
import type { Tag } from "@/types/task";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    let rows: Tag[];
    if (clientId) {
      rows = db
        .prepare("SELECT * FROM tags WHERE clientId = ? OR clientId IS NULL ORDER BY name ASC")
        .all(clientId) as Tag[];
    } else {
      rows = db.prepare("SELECT * FROM tags ORDER BY name ASC").all() as Tag[];
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET /api/tags error:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json() as { name: string; color?: string; clientId?: string | null };

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      "INSERT INTO tags (id, name, color, clientId, createdAt) VALUES (?, ?, ?, ?, ?)"
    ).run(id, body.name.trim(), body.color || "#6366f1", body.clientId || null, now);

    const tag = db.prepare("SELECT * FROM tags WHERE id = ?").get(id) as Tag;

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("POST /api/tags error:", error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}