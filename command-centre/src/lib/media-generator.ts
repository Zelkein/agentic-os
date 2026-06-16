/**
 * media-generator.ts — Abstraction for AI media generation (image/video/audio).
 * Routes through existing LLM credential system for API keys.
 */
import { loadCredential } from "./llm-credentials";

export interface MediaResult {
  id: string;
  type: "image" | "video" | "audio";
  prompt: string;
  url: string | null;
  status: "generating" | "done" | "failed";
  error?: string;
  createdAt: string;
  modelUsed?: string;
}

interface GenerateOptions {
  provider?: string;
  model?: string;
  width?: number;
  height?: number;
  negativePrompt?: string;
}

const GENERATION_PROVIDERS: Record<string, { model: string; url: string }> = {
  "openai": { model: "dall-e-3", url: "https://api.openai.com/v1/images/generations" },
  "replicate": { model: "stability-ai/sdxl", url: "https://api.replicate.com/v1/predictions" },
  "together": { model: "stabilityai/stable-diffusion-xl-base-1.0", url: "https://api.together.xyz/v1/images/generations" },
};

function generateId(): string {
  return `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function now(): string {
  return new Date().toISOString();
}

/**
 * Generate an image from a text prompt.
 * Uses configured provider fallback: OpenAI → Replicate → Together.
 */
export async function generateImage(prompt: string, options?: GenerateOptions): Promise<MediaResult> {
  const id = generateId();
  const result: MediaResult = { id, type: "image", prompt, url: null, status: "generating", createdAt: now() };

  // Try each provider in order
  const providers = options?.provider ? [options.provider] : ["openai", "replicate", "together"];
  for (const provider of providers) {
    const config = GENERATION_PROVIDERS[provider];
    if (!config) continue;

    const credential = loadCredential(provider);
    if (!credential) continue;

    try {
      const model = options?.model || config.model;
      const response = await fetch(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${credential.apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          n: 1,
          size: options?.width && options?.height ? `${options.width}x${options.height}` : "1024x1024",
          ...(provider === "replicate" ? { input: { prompt } } : {}),
        }),
      });

      if (!response.ok) continue;

      if (provider === "openai") {
        const data = await response.json() as { data: Array<{ url: string }> };
        result.url = data.data?.[0]?.url || null;
      } else if (provider === "replicate") {
        const data = await response.json() as { urls?: { get?: string }; output?: string[] };
        if (data.urls?.get) {
          // Poll for completion
          for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const pollRes = await fetch(data.urls.get, {
              headers: { "Authorization": `Bearer ${credential.apiKey}` },
            });
            if (!pollRes.ok) break;
            const pollData = await pollRes.json() as { status?: string; output?: string[] };
            if (pollData.status === "succeeded" && pollData.output?.[0]) {
              result.url = pollData.output[0];
              break;
            }
            if (pollData.status === "failed") break;
          }
        }
      } else {
        const data = await response.json() as { data?: Array<{ url: string }> };
        result.url = data.data?.[0]?.url || null;
      }

      if (result.url) {
        result.status = "done";
        result.modelUsed = model;
        return result;
      }
    } catch {
      continue; // Try next provider
    }
  }

  result.status = "failed";
  result.error = "No image provider available or all providers failed";
  return result;
}

/**
 * Generate video description/storyboard from text (placeholder for future video gen).
 */
export async function generateVideo(prompt: string, _options?: GenerateOptions): Promise<MediaResult> {
  const id = generateId();
  return {
    id,
    type: "video",
    prompt,
    url: null,
    status: "failed",
    error: "Video generation requires a dedicated API key (Runway, Veo, etc.)",
    createdAt: now(),
  };
}

/**
 * Generate audio/speech from text.
 */
export async function generateAudio(text: string, options?: GenerateOptions): Promise<MediaResult> {
  const id = generateId();
  const result: MediaResult = { id, type: "audio", prompt: text, url: null, status: "generating", createdAt: now() };

  // Try ElevenLabs first
  const credential = loadCredential("elevenlabs") || loadCredential("openai");
  if (!credential) {
    result.status = "failed";
    result.error = "No TTS provider configured (add ELEVENLABS_API_KEY or OPENAI_API_KEY)";
    return result;
  }

  try {
    if (credential.provider === "elevenlabs" || process.env.ELEVENLABS_API_KEY) {
      const apiKey = credential.apiKey || process.env.ELEVENLABS_API_KEY || "";
      const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: { stability: 0.5, similarity_boost: 0.5 },
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        result.url = URL.createObjectURL(blob);
        result.status = "done";
        result.modelUsed = "elevenlabs";
        return result;
      }
    }
  } catch {
    // Fall through
  }

  result.status = "failed";
  result.error = "Audio generation failed";
  return result;
}
