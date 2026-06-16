import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getConfig, getClientAgenticOsDir } from "@/lib/config";

export const dynamic = "force-dynamic";

const GALLERY_ROOTS = ["context", "brand_context", "docs", ".claude/skills"];
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);
const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".avi"]);
const AUDIO_EXTS = new Set([".mp3", ".wav", ".ogg", ".m4a", ".flac"]);
const PDF_EXTS = new Set([".pdf"]);

function classifyFile(name: string): string {
  const ext = path.extname(name).toLowerCase();
  if (IMAGE_EXTS.has(ext)) return "image";
  if (VIDEO_EXTS.has(ext)) return "video";
  if (AUDIO_EXTS.has(ext)) return "audio";
  if (PDF_EXTS.has(ext)) return "pdf";
  return "document";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type") || "all";
    const dateRange = searchParams.get("dateRange") || "all";
    const q = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);
    const clientId = searchParams.get("clientId");

    const baseDir = clientId && clientId !== "root"
      ? getClientAgenticOsDir(clientId)
      : getConfig().agenticOsDir;

    // Walk through all gallery roots and collect files
    const allFiles: Array<{
      id: string;
      name: string;
      type: string;
      size: number;
      modifiedAt: string;
      storagePath: string;
      relativePath: string;
    }> = [];

    const now = Date.now();
    const dateCutoffs: Record<string, number> = {
      today: now - 86400000,
      week: now - 7 * 86400000,
      month: now - 30 * 86400000,
    };
    const cutoff = dateRange !== "all" ? dateCutoffs[dateRange] || 0 : 0;

    for (const root of GALLERY_ROOTS) {
      const rootDir = path.join(baseDir, root);
      if (!fs.existsSync(rootDir)) continue;

      const walk = (dir: string, depth = 0) => {
        if (depth > 4) return; // Safety limit
        let entries: fs.Dirent[];
        try {
          entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
          return;
        }

        for (const entry of entries) {
          if (entry.name.startsWith(".") || entry.name === "node_modules") continue;

          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(fullPath, depth + 1);
            continue;
          }

          try {
            const stat = fs.statSync(fullPath);
            const fileType = classifyFile(entry.name);

            // Apply type filter
            if (typeFilter !== "all" && fileType !== typeFilter) continue;

            // Apply date filter
            if (cutoff > 0 && stat.mtimeMs < cutoff) continue;

            // Apply search
            if (q && !entry.name.toLowerCase().includes(q.toLowerCase())) continue;

            // Compute relative path from baseDir
            const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
            const id = crypto.createHash("sha256").update(relativePath).digest("hex").slice(0, 16);

            allFiles.push({
              id,
              name: entry.name,
              type: fileType,
              size: stat.size,
              modifiedAt: stat.mtime.toISOString(),
              storagePath: relativePath,
              relativePath,
            });
          } catch {
            // Skip unreadable files
          }
        }
      };

      walk(rootDir);
    }

    // Sort by modified date descending
    allFiles.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

    const sliced = allFiles.slice(0, limit);

    // Compute stats
    const stats = {
      total: allFiles.length,
      images: allFiles.filter(f => f.type === "image").length,
      videos: allFiles.filter(f => f.type === "video").length,
      audio: allFiles.filter(f => f.type === "audio").length,
      documents: allFiles.filter(f => f.type === "document").length,
      totalSize: formatSize(allFiles.reduce((sum, f) => sum + f.size, 0)),
    };

    return NextResponse.json({ files: sliced, total: allFiles.length, stats });
  } catch (error) {
    console.error("GET /api/files error:", error);
    return NextResponse.json(
      { error: "Failed to fetch files", files: [], total: 0, stats: { total: 0, images: 0, videos: 0, audio: 0, documents: 0, totalSize: "0B" } },
      { status: 500 }
    );
  }
}
