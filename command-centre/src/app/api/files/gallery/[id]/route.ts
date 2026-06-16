import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getConfig, getClientAgenticOsDir } from "@/lib/config";

const GALLERY_ROOTS = ["context", "brand_context", "docs", ".claude/skills"];

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = request.nextUrl.searchParams.get("clientId");
    const baseDir = clientId && clientId !== "root"
      ? getClientAgenticOsDir(clientId)
      : getConfig().agenticOsDir;

    // Walk directories to find file by its stable hash ID
    let foundPath: string | null = null;
    for (const root of GALLERY_ROOTS) {
      const rootDir = path.join(baseDir, root);
      if (!fs.existsSync(rootDir)) continue;

      const walk = (dir: string) => {
        if (foundPath) return;
        let entries: fs.Dirent[];
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
        catch { return; }

        for (const entry of entries) {
          if (entry.name.startsWith(".")) continue;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) { walk(fullPath); continue; }
          if (!entry.isFile()) continue;

          const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
          const fileId = crypto.createHash("sha256").update(relativePath).digest("hex").slice(0, 16);
          if (fileId === id) { foundPath = fullPath; return; }
        }
      };
      walk(rootDir);
    }

    if (!foundPath) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    fs.unlinkSync(foundPath);
    return NextResponse.json({ success: true, deleted: path.basename(foundPath) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
