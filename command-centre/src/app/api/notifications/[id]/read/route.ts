import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const db = getDb();

  if (id === "all") {
    db.exec("UPDATE notifications SET read = 1 WHERE read = 0");
  } else {
    db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(id);
  }

  return NextResponse.json({ ok: true });
}
