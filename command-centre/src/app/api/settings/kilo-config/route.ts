import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getConfig } from "@/lib/config";

function getKiloConfigPath(): string {
  return path.join(getConfig().agenticOsDir, "kilo.json");
}

export async function GET() {
  try {
    const configPath = getKiloConfigPath();
    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ content: "", exists: false, lastModified: null });
    }
    const content = fs.readFileSync(configPath, "utf-8");
    const stat = fs.statSync(configPath);
    return NextResponse.json({ content, exists: true, lastModified: stat.mtime.toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read kilo.json";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, lastModified } = body as { content: string; lastModified?: string };
    if (typeof content !== "string") {
      return NextResponse.json({ error: "content must be a string" }, { status: 400 });
    }
    // Validate JSON
    try { JSON.parse(content); } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const configPath = getKiloConfigPath();
    if (lastModified && fs.existsSync(configPath)) {
      const stat = fs.statSync(configPath);
      if (stat.mtime.toISOString() !== lastModified) {
        return NextResponse.json(
          { error: "File was modified since you loaded it. Reload and try again." },
          { status: 409 },
        );
      }
    }
    const tmpPath = configPath + ".tmp";
    fs.writeFileSync(tmpPath, content, "utf-8");
    fs.renameSync(tmpPath, configPath);
    const stat = fs.statSync(configPath);
    return NextResponse.json({ saved: true, lastModified: stat.mtime.toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save kilo.json";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
