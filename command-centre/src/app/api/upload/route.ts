import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validateFile, generateStorageFilename, generateStoragePath } from "@/lib/file-utils";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sessionId = formData.get("sessionId") as string | null;
    const userEmail = formData.get("userEmail") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Generate storage filename and path
    const storageFilename = generateStorageFilename(file.name, sessionId);
    const storagePath = generateStoragePath(sessionId, storageFilename);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", new Date().toISOString().split("T")[0], sessionId);
    fs.mkdirSync(uploadsDir, { recursive: true });

    // Write file to disk
    const fullPath = path.join(uploadsDir, storageFilename);
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(fullPath, Buffer.from(bytes));

    // Store metadata in database
    const db = getDb();
    const fileId = randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO uploaded_files (id, session_id, filename, file_type, file_size, mime_type, storage_path, uploaded_by, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      fileId,
      sessionId,
      file.name,
      validation.fileType,
      file.size,
      file.type,
      storagePath,
      userEmail || null,
      now
    );

    return NextResponse.json(
      {
        fileId,
        filename: file.name,
        storagePath,
        fileType: validation.fileType,
        fileSize: file.size,
        uploadedAt: now,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
