import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { getConfig } from "./config";
import { loadCredential } from "./llm-credentials";

const execFileP = promisify(execFile);

// -- Tunables --------------------------------------------------------------
const MAX_TEXT_BYTES = 200 * 1024; // cap how much text we inject per file
const OCR_DPI = 300; // higher DPI dramatically improves OCR on dense tables
const MAX_PDF_PAGES = 8; // safety cap for very long PDFs
const VISION_MAX_WIDTH = 1600; // downscale images sent to the vision model

const TEXT_EXTS = new Set([
  "md", "txt", "csv", "json", "html", "log", "yaml", "yml",
  "sh", "ts", "tsx", "js", "jsx", "py", "css", "scss", "sql", "xml", "toml",
]);
const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp"]);

const IMAGE_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

export interface AttachmentRef {
  fileName?: string;
  relativePath?: string;
  filePath?: string;
  extension?: string;
}

export interface VisionImage {
  fileName: string;
  dataUrl: string;
}

export interface AttachmentExtractionResult {
  /** Human/LLM-readable text blocks to inject into the prompt. */
  textBlocks: string[];
  /** Base64 data-URL images to send to a vision model (only when vision is available). */
  images: VisionImage[];
  /** Diagnostic notes (unreadable/unsupported files, etc.). */
  notes: string[];
}

// -- Vision provider detection -----------------------------------------------
export interface VisionConfig {
  provider: string;
  model: string;
}

/**
 * Returns the configured vision provider, if any. Drop a
 * `.secrets/vision.conf` (OpenAI-compatible: API_KEY, BASE_URL, MODEL) to
 * enable image understanding. Returns null when not configured.
 */
export function getVisionConfig(): VisionConfig | null {
  const cred = loadCredential("vision");
  if (!cred) return null;
  return { provider: "vision", model: cred.model };
}

// -- Helpers -----------------------------------------------------------------
function resolveDiskPath(ref: AttachmentRef): string | null {
  const config = getConfig();

  // -- Build resolvable candidates from client-supplied refs ----------
  // Rules:
  //   1.  NEVER trust an absolute filePath from the client (path traversal).
  //   2.  Reject ".." in relativePath / fileName to prevent directory escape.
  //   3.  Resolve all candidates to absolute paths and verify they stay
  //       inside agenticOsDir (belt-and-suspenders).
  const candidates: string[] = [];

  if (ref.relativePath) {
    if (ref.relativePath.includes("..")) return null; // explicit block
    candidates.push(path.join(config.agenticOsDir, ref.relativePath));
  }
  if (ref.fileName) {
    if (ref.fileName.includes("/") || ref.fileName.includes("..")) return null; // explicit block
    candidates.push(path.join(config.agenticOsDir, "projects", ref.fileName));
  }

  const workspacePrefix = config.agenticOsDir.endsWith(path.sep)
    ? config.agenticOsDir
    : config.agenticOsDir + path.sep;

  for (const c of candidates) {
    try {
      const resolved = path.resolve(c);
      if (!resolved.startsWith(workspacePrefix)) continue;
      if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) return resolved;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function extOf(ref: AttachmentRef, diskPath: string): string {
  const fromRef = (ref.extension || "").toLowerCase().replace(/^\./, "");
  if (fromRef) return fromRef;
  return path.extname(diskPath).slice(1).toLowerCase();
}

async function extractPdfText(filePath: string): Promise<string> {
  try {
    const { stdout } = await execFileP("pdftotext", ["-layout", filePath, "-"], {
      maxBuffer: 20 * 1024 * 1024,
    });
    return stdout.trim();
  } catch (err) {
    console.error(
      `[attachment-content] pdftotext failed for ${filePath}:`,
      err instanceof Error ? err.message : err
    );
    return "";
  }
}

async function renderPdfToPngs(filePath: string): Promise<{ dir: string; pages: string[] }> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cc-att-"));
  const prefix = path.join(dir, "page");
  await execFileP("pdftoppm", [
    "-png",
    "-r", String(OCR_DPI),
    "-f", "1",
    "-l", String(MAX_PDF_PAGES),
    filePath,
    prefix,
  ]);
  const pages = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .sort()
    .map((f) => path.join(dir, f));
  return { dir, pages };
}

// -- OCR (tesseract.js, lazy singleton worker) -------------------------------
type OcrWorker = Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>>;
type OcrGlobal = typeof globalThis & { __ccOcrWorker?: Promise<OcrWorker> };

async function getOcrWorker(): Promise<OcrWorker> {
  const g = globalThis as OcrGlobal;
  if (g.__ccOcrWorker) return g.__ccOcrWorker;
  g.__ccOcrWorker = (async () => {
    const { createWorker } = await import("tesseract.js");
    const cachePath = path.join(getConfig().agenticOsDir, ".command-centre", "tesseract-cache");
    fs.mkdirSync(cachePath, { recursive: true });
    return createWorker("eng+fra", 1, { cachePath });
  })();
  return g.__ccOcrWorker;
}

async function ocrImageFile(imagePath: string): Promise<string> {
  let prePath: string | null = null;
  try {
    const sharp = (await import("sharp")).default;
    prePath = `${imagePath}.pre.png`;
    await sharp(imagePath).grayscale().normalize().sharpen().toFile(prePath);
    const worker = await getOcrWorker();
    const { data } = await worker.recognize(prePath);
    return (data.text || "").trim();
  } catch (err) {
    console.error(
      `[attachment-content] OCR failed for ${imagePath}:`,
      err instanceof Error ? err.message : err
    );
    return "";
  } finally {
    if (prePath) {
      try { fs.rmSync(prePath, { force: true }); } catch { /* ignore */ }
    }
  }
}

async function makeVisionDataUrl(imagePath: string, ext: string): Promise<string> {
  try {
    const sharp = (await import("sharp")).default;
    const buf = await sharp(imagePath)
      .resize({ width: VISION_MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch (err) {
    console.error(
      `[attachment-content] sharp resize failed for ${imagePath}, sending original:`,
      err instanceof Error ? err.message : err
    );
    const buf = fs.readFileSync(imagePath);
    const mime = IMAGE_MIME[ext] || "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  }
}

function rmDir(dir: string) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
}

// -- Main entry point --------------------------------------------------------
export async function extractAttachments(
  filesJson: string | null | undefined,
  opts: { visionAvailable: boolean }
): Promise<AttachmentExtractionResult> {
  const result: AttachmentExtractionResult = { textBlocks: [], images: [], notes: [] };

  let refs: AttachmentRef[];
  try {
    const parsed = JSON.parse(filesJson || "[]");
    refs = Array.isArray(parsed) ? parsed : [];
  } catch {
    return result;
  }
  if (refs.length === 0) return result;

  for (const ref of refs) {
    const name = ref.fileName || ref.relativePath || "attachment";
    const diskPath = resolveDiskPath(ref);
    if (!diskPath) {
      result.notes.push(`Could not locate file on disk: ${name}`);
      continue;
    }
    const ext = extOf(ref, diskPath);

    // 1) Plain text-like files: inject directly
    if (TEXT_EXTS.has(ext)) {
      try {
        const buf = fs.readFileSync(diskPath);
        const truncated = buf.length > MAX_TEXT_BYTES;
        const text = buf.subarray(0, MAX_TEXT_BYTES).toString("utf-8");
        result.textBlocks.push(
          `### Attached file: ${name}\n\`\`\`${ext}\n${text}\n\`\`\`${truncated ? "\n[truncated]" : ""}`
        );
      } catch {
        result.notes.push(`Failed to read text file: ${name}`);
      }
      continue;
    }

    // 2) PDFs: prefer real embedded text; otherwise render + OCR (+vision)
    if (ext === "pdf") {
      const pdfText = await extractPdfText(diskPath);
      if (pdfText.length >= 40) {
        const truncated = pdfText.length > MAX_TEXT_BYTES;
        result.textBlocks.push(
          `### Attached PDF (extracted text): ${name}\n${pdfText.slice(0, MAX_TEXT_BYTES)}${truncated ? "\n[truncated]" : ""}`
        );
        continue;
      }
      // Image-based / vector-drawn PDF — no extractable text
      let rendered: { dir: string; pages: string[] } | null = null;
      try {
        rendered = await renderPdfToPngs(diskPath);
        if (opts.visionAvailable) {
          for (const page of rendered.pages) {
            result.images.push({ fileName: name, dataUrl: await makeVisionDataUrl(page, "png") });
          }
        }
        let ocrText = "";
        for (const page of rendered.pages) {
          const pageText = await ocrImageFile(page);
          if (pageText) ocrText += `${pageText}\n`;
        }
        if (ocrText.trim()) {
          result.textBlocks.push(
            `### Attached PDF (image-based, read via OCR): ${name}\n[Note: this PDF has no selectable text; the content below was extracted by OCR and may contain recognition errors.]\n${ocrText.trim().slice(0, MAX_TEXT_BYTES)}`
          );
        } else if (!opts.visionAvailable) {
          result.notes.push(`Could not read image-based PDF (OCR found no text): ${name}`);
        }
      } catch {
        result.notes.push(`Failed to process PDF: ${name}`);
      } finally {
        if (rendered) rmDir(rendered.dir);
      }
      continue;
    }

    // 3) Images: vision (if available) + OCR text
    if (IMAGE_EXTS.has(ext)) {
      try {
        if (opts.visionAvailable) {
          result.images.push({ fileName: name, dataUrl: await makeVisionDataUrl(diskPath, ext) });
        }
        const ocrText = await ocrImageFile(diskPath);
        if (ocrText.trim()) {
          result.textBlocks.push(
            `### Attached image (read via OCR): ${name}\n[Note: text extracted by OCR, may contain errors.]\n${ocrText.trim().slice(0, MAX_TEXT_BYTES)}`
          );
        } else if (!opts.visionAvailable) {
          result.notes.push(`Could not read image (OCR found no text): ${name}`);
        }
      } catch {
        result.notes.push(`Failed to process image: ${name}`);
      }
      continue;
    }

    result.notes.push(`Unsupported file type for reading: ${name} (.${ext})`);
  }

  return result;
}

/**
 * Compose the augmented user text (original message + injected file content).
 */
export function buildAugmentedText(userText: string, extraction: AttachmentExtractionResult): string {
  const parts: string[] = [userText.trim()];
  if (extraction.textBlocks.length > 0) {
    parts.push(
      "---",
      "The user attached the following file(s). Use their content to answer:",
      "",
      extraction.textBlocks.join("\n\n")
    );
  }
  if (extraction.notes.length > 0) {
    parts.push("", `[Attachment notes: ${extraction.notes.join("; ")}]`);
  }
  return parts.join("\n");
}
