import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

// Wayland config path (Windows host, accessed from WSL)
const WAYLAND_CONFIG_PATH =
  "C:\\Users\\Frank\\AppData\\Roaming\\Wayland\\config\\wayland-config.txt";

// WSL mount equivalent
const WAYLAND_CONFIG_WSL = "/mnt/c/Users/Frank/AppData/Roaming/Wayland/config/wayland-config.txt";

interface WaylandAssistant {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  isPreset: boolean;
  isBuiltin: boolean;
  presetAgentType?: string;
  enabledSkills?: string[];
  promptsI18n?: Record<string, { systemPrompt?: string }>;
}

interface WaylandModelConfig {
  id: string;
  name: string;
  platform: string;
  baseUrl: string;
  model: string;
}

interface WaylandConfig {
  assistants: WaylandAssistant[];
  "model.config"?: WaylandModelConfig[];
}

function decodeWaylandConfig(raw: string): WaylandConfig {
  // Wayland config is double-encoded: base64 → URL-encoded JSON → JSON
  const b64decoded = Buffer.from(raw, "base64").toString("utf-8");
  const urlDecoded = decodeURIComponent(b64decoded);
  return JSON.parse(urlDecoded);
}

function mapRole(presetAgentType?: string): string {
  switch (presetAgentType) {
    case "orchestrator": return "orchestrator";
    case "coach": return "coach";
    case "sub_agent": return "sub_agent";
    default: return "assistant";
  }
}

function mapProvider(platform: string): string {
  switch (platform?.toLowerCase()) {
    case "openai": return "openai";
    case "anthropic": return "claude";
    case "deepseek": return "deepseek";
    case "google": return "gemini";
    case "ollama": return "ollama";
    default: return platform || "deepseek";
  }
}

export async function POST() {
  try {
    // Read Wayland config
    const configPath = fs.existsSync(WAYLAND_CONFIG_WSL)
      ? WAYLAND_CONFIG_WSL
      : WAYLAND_CONFIG_PATH;

    if (!fs.existsSync(configPath)) {
      return NextResponse.json(
        { error: "Wayland config not found. Is Wayland installed?" },
        { status: 404 }
      );
    }

    const raw = fs.readFileSync(configPath, "utf-8");
    const config = decodeWaylandConfig(raw);

    if (!config.assistants || config.assistants.length === 0) {
      return NextResponse.json(
        { error: "No assistants found in Wayland config" },
        { status: 404 }
      );
    }

    // Build model lookup
    const modelLookup = new Map<string, WaylandModelConfig>();
    if (config["model.config"]) {
      for (const m of config["model.config"]) {
        modelLookup.set(m.id, m);
      }
    }

    const db = getDb();
    const now = new Date().toISOString();
    const imported: any[] = [];
    const skipped: string[] = [];

    // Get existing agent names to avoid duplicates
    const existingNames = new Set(
      (db.prepare("SELECT name FROM agents").all() as { name: string }[]).map(
        (r) => r.name.toLowerCase()
      )
    );

    for (const assistant of config.assistants) {
      // Skip built-in agents (Wayland presets)
      if (assistant.isBuiltin) {
        skipped.push(`${assistant.name} (built-in)`);
        continue;
      }

      // Skip disabled agents
      if (!assistant.enabled) {
        skipped.push(`${assistant.name} (disabled)`);
        continue;
      }

      // Skip duplicates by name
      if (existingNames.has(assistant.name.toLowerCase())) {
        skipped.push(`${assistant.name} (already exists)`);
        continue;
      }

      // Extract system prompt from Wayland format
      let systemPrompt = "";
      if (assistant.promptsI18n) {
        const enPrompt = assistant.promptsI18n["en-US"];
        if (enPrompt?.systemPrompt) {
          systemPrompt = enPrompt.systemPrompt;
        }
        // Try French
        const frPrompt = assistant.promptsI18n["fr-CA"] || assistant.promptsI18n["fr-FR"];
        if (!systemPrompt && frPrompt?.systemPrompt) {
          systemPrompt = frPrompt.systemPrompt;
        }
      }

      const id = randomUUID();
      const role = mapRole(assistant.presetAgentType);
      const skills = assistant.enabledSkills || [];

      db.prepare(
        `INSERT INTO agents (id, name, role, system_prompt, context, skills_json, workflows_json,
         llm_provider, llm_model, owner_email, visibility, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        assistant.name,
        role,
        systemPrompt || null,
        assistant.description || null,
        JSON.stringify(skills),
        "[]",
        "deepseek",
        "deepseek-v4-flash",
        null,
        "team",
        now,
        now
      );

      existingNames.add(assistant.name.toLowerCase());
      imported.push({
        id,
        name: assistant.name,
        role,
        skills: skills.length,
        hasPrompt: !!systemPrompt,
      });
    }

    return NextResponse.json({
      imported: imported.length,
      skipped: skipped.length,
      agents: imported,
      skipped_names: skipped,
    });
  } catch (err) {
    console.error("Error importing Wayland agents:", err);
    return NextResponse.json(
      {
        error: "Failed to import Wayland agents",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}