import fs from "fs";
import path from "path";
import { getConfig } from "./config";

export interface LLMCredential {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

const credentialCache: Map<string, LLMCredential> = new Map();

/**
 * Load LLM credentials from .secrets/*.conf files
 * Format: API_KEY=xxx, BASE_URL=xxx, MODEL=xxx
 */
export function loadCredential(provider: string): LLMCredential | null {
  if (credentialCache.has(provider)) {
    return credentialCache.get(provider)!;
  }

  const config = getConfig();
  const credPath = path.join(config.agenticOsDir, ".secrets", `${provider}.conf`);

  if (!fs.existsSync(credPath)) {
    console.warn(`Credential file not found: ${credPath}`);
    return null;
  }

  try {
    const content = fs.readFileSync(credPath, "utf-8");
    const lines = content.split("\n");
    const credential: Partial<LLMCredential> = { provider };

    for (const line of lines) {
      if (line.startsWith("API_KEY=")) {
        credential.apiKey = line.replace("API_KEY=", "").trim();
      } else if (line.startsWith("BASE_URL=")) {
        credential.baseUrl = line.replace("BASE_URL=", "").trim();
      } else if (line.startsWith("MODEL=")) {
        credential.model = line.replace("MODEL=", "").trim();
      }
    }

    if (!credential.apiKey || !credential.baseUrl || !credential.model) {
      console.error(`Invalid credential format in ${credPath}`);
      return null;
    }

    const cred = credential as LLMCredential;
    credentialCache.set(provider, cred);
    return cred;
  } catch (err) {
    console.error(`Error loading credential ${provider}:`, err);
    return null;
  }
}

/**
 * Get all available LLM providers
 */
export function getAvailableProviders(): string[] {
  const config = getConfig();
  const secretsDir = path.join(config.agenticOsDir, ".secrets");

  if (!fs.existsSync(secretsDir)) {
    return [];
  }

  return fs
    .readdirSync(secretsDir)
    .filter((f) => f.endsWith(".conf"))
    .map((f) => f.replace(".conf", ""));
}
