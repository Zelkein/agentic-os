import { loadCredential } from "./llm-credentials";
import { calculateTokenCost } from "./cost-calculator";

// Reasoning models (e.g. deepseek-v4-flash) emit large amounts of internal
// `reasoning_content` before the final answer. A low cap can let reasoning
// consume the whole budget, leaving no room for `content`. Keep this high
// enough that the visible answer is always produced.
const MAX_OUTPUT_TOKENS = 8000;

export type ChatTextPart = { type: "text"; text: string };
export type ChatImagePart = { type: "image_url"; image_url: { url: string } };
export type ChatContentPart = ChatTextPart | ChatImagePart;

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  // A plain string for text-only turns, or an array of content parts for
  // multimodal (vision) turns following the OpenAI-compatible schema.
  content: string | ChatContentPart[];
}

/**
 * Build the chat-completions URL relative to the provider base URL.
 * Using `new URL("/v1/chat/completions", base)` would discard any path
 * prefix on the base (e.g. DashScope's `/compatible-mode/v1`), so we append
 * to the base path instead.
 */
function buildChatCompletionsUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
}

export interface LLMResponse {
  content: string;
  modelUsed: string;
  costUsd?: number;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

/**
 * Call LLM with simple prompt (backward compatible)
 */
export async function callLLM(
  provider: string,
  model: string,
  prompt: string,
  systemPrompt?: string
): Promise<LLMResponse> {
  const messages: ChatMessage[] = [
    ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
    { role: "user" as const, content: prompt },
  ];

  return callLLMWithHistory(provider, model, messages, systemPrompt);
}

/**
 * Call LLM with chat history support
 * Useful for multi-turn conversations with context
 */
export async function callLLMWithHistory(
  provider: string,
  model: string,
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<LLMResponse> {
  const credential = loadCredential(provider);
  if (!credential) {
    throw new Error(`Credentials not found for provider: ${provider}`);
  }

  const { apiKey, baseUrl } = credential;

  // Construct the request based on provider
  // We assume OpenAI-compatible API for all providers
  const url = buildChatCompletionsUrl(baseUrl);

  // Build message list with system prompt if provided
  const finalMessages: ChatMessage[] = [];
  if (systemPrompt) {
    finalMessages.push({ role: "system", content: systemPrompt });
  }
  finalMessages.push(...messages);

  const requestBody = {
    model,
    messages: finalMessages,
    temperature: 0.7,
    max_tokens: MAX_OUTPUT_TOKENS,
    stream: false,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  // Extract content and usage
  const content = data.choices[0]?.message?.content || "";
  const modelUsed = data.model || model;

  const promptTokens = data.usage?.prompt_tokens || 0;
  const completionTokens = data.usage?.completion_tokens || 0;
  const totalTokens = promptTokens + completionTokens;

  // Calculate cost using cost calculator
  const costUsd = calculateTokenCost(provider, model, promptTokens, completionTokens);

  return {
    content,
    modelUsed,
    costUsd,
    tokens: {
      prompt: promptTokens,
      completion: completionTokens,
      total: totalTokens,
    },
  };
}

export type LLMStreamChunk =
  | { type: "delta"; text: string }
  | {
      type: "done";
      modelUsed: string;
      costUsd?: number;
      tokens: { prompt: number; completion: number; total: number };
    };

/**
 * Stream an LLM response token-by-token using an OpenAI-compatible SSE endpoint.
 * Yields incremental `delta` chunks as text arrives, then a final `done` chunk
 * carrying the resolved model, cost, and token usage.
 */
export async function* streamLLMWithHistory(
  provider: string,
  model: string,
  messages: ChatMessage[],
  systemPrompt?: string
): AsyncGenerator<LLMStreamChunk> {
  const credential = loadCredential(provider);
  if (!credential) {
    throw new Error(`Credentials not found for provider: ${provider}`);
  }

  const { apiKey, baseUrl } = credential;
  const url = buildChatCompletionsUrl(baseUrl);

  const finalMessages: ChatMessage[] = [];
  if (systemPrompt) {
    finalMessages.push({ role: "system", content: systemPrompt });
  }
  finalMessages.push(...messages);

  const requestBody = {
    model,
    messages: finalMessages,
    temperature: 0.7,
    max_tokens: MAX_OUTPUT_TOKENS,
    stream: true,
    stream_options: { include_usage: true },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`LLM API error: ${response.status} ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let promptTokens = 0;
  let completionTokens = 0;
  let modelUsed = model;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;

      try {
        const json = JSON.parse(payload);
        if (json.model) modelUsed = json.model;
        const delta: string | undefined = json.choices?.[0]?.delta?.content;
        if (delta) {
          yield { type: "delta", text: delta };
        }
        if (json.usage) {
          promptTokens = json.usage.prompt_tokens ?? promptTokens;
          completionTokens = json.usage.completion_tokens ?? completionTokens;
        }
      } catch {
        // ignore malformed SSE fragments
      }
    }
  }

  const costUsd = calculateTokenCost(provider, model, promptTokens, completionTokens);
  yield {
    type: "done",
    modelUsed,
    costUsd,
    tokens: {
      prompt: promptTokens,
      completion: completionTokens,
      total: promptTokens + completionTokens,
    },
  };
}