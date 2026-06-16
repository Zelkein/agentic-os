#!/usr/bin/env node
/**
 * API Translation Proxy — Bridges Anthropic-format requests from Claude Code
 * to OpenAI-compatible backends (DeepSeek, SiliconFlow, etc.).
 *
 * Usage: node scripts/api-proxy.cjs [--port PORT] [--target URL] [--api-key KEY] [--model-map JSON]
 *
 * Claude Code → this proxy → DeepSeek / SiliconFlow / any OpenAI-compatible API
 */

const http = require("http");

const PORT = parseInt(process.env.API_PROXY_PORT || "9393", 10);
const TARGET_BASE = process.env.API_PROXY_TARGET || "https://api.deepseek.com/v1";
const TARGET_MODEL = process.env.API_PROXY_TARGET_MODEL || "deepseek-chat";
const API_KEY = process.env.API_PROXY_KEY || "";

if (!API_KEY) {
  console.error("[api-proxy] API_PROXY_KEY not set. Exiting.");
  process.exit(1);
}

console.error(`[api-proxy] Listening on :${PORT} → ${TARGET_BASE} (model: ${TARGET_MODEL})`);

/**
 * Convert Anthropic messages array to OpenAI messages array.
 */
function anthropicToOpenAI(messages, systemPrompt) {
  const openai = [];
  if (systemPrompt) {
    // Anthropic system is a string; OpenAI uses a system message
    openai.push({ role: "system", content: systemPrompt });
  }
  for (const msg of messages) {
    if (typeof msg.content === "string") {
      openai.push({ role: msg.role, content: msg.content });
    } else if (Array.isArray(msg.content)) {
      // Anthropic content blocks → extract text
      const parts = [];
      for (const block of msg.content) {
        if (block.type === "text") parts.push(block.text);
        // Skip tool_use, tool_result, images for now
      }
      openai.push({ role: msg.role, content: parts.join("\n") });
    }
  }
  return openai;
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Only handle POST to /v1/messages (Anthropic format)
  if (req.method !== "POST") {
    res.writeHead(405);
    res.end("Method Not Allowed");
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      const anthropicReq = JSON.parse(body);
      const stream = anthropicReq.stream === true;

      // Build OpenAI-format request
      const messages = anthropicToOpenAI(anthropicReq.messages || [], anthropicReq.system);
      const openaiReq = {
        model: TARGET_MODEL,
        messages,
        max_tokens: anthropicReq.max_tokens || 4096,
        temperature: anthropicReq.temperature ?? 0.7,
        stream,
      };

      console.error(`[api-proxy] → ${TARGET_BASE}/chat/completions (stream=${stream})`);

      const msgId = "msg_" + Date.now();
      const fetch = globalThis.fetch;
      const targetUrl = `${TARGET_BASE}/chat/completions`;

      if (stream) {
        // Streaming: pipe SSE from OpenAI → Anthropic SSE format
        const upstream = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify(openaiReq),
        });

        if (!upstream.ok) {
          const errText = await upstream.text();
          console.error(`[api-proxy] Upstream error ${upstream.status}: ${errText.slice(0, 200)}`);
          res.writeHead(upstream.status);
          res.end(errText);
          return;
        }

        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });

        let contentIdx = 0;
        let fullText = "";
        res.write(`event: message_start\ndata: ${JSON.stringify({ type: "message_start", message: { id: msgId, type: "message", role: "assistant", content: [], model: TARGET_MODEL, stop_reason: null, usage: null } })}\n\n`);
        res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: "content_block_start", index: contentIdx, content_block: { type: "text", text: "" } })}\n\n`);

        let buffer = "";
        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();

        async function pump() {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta;
                  if (delta?.content) {
                    fullText += delta.content;
                    res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", index: contentIdx, delta: { type: "text_delta", text: delta.content } })}\n\n`);
                  }
                } catch {}
              }
            }
            // Flush remaining buffer
            if (buffer.startsWith("data: ") && buffer.slice(6).trim() !== "[DONE]") {
              try {
                const parsed = JSON.parse(buffer.slice(6).trim());
                const delta = parsed.choices?.[0]?.delta;
                if (delta?.content) {
                  fullText += delta.content;
                  res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", index: contentIdx, delta: { type: "text_delta", text: delta.content } })}\n\n`);
                }
              } catch {}
            }

            const usage = { input_tokens: messages.reduce((s, m) => s + ((m.content?.length || 0) / 4) | 0, 5), output_tokens: (fullText.length / 4) | 0 };
            res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: "content_block_stop", index: contentIdx })}\n\n`);
            res.write(`event: message_delta\ndata: ${JSON.stringify({ type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage })}\n\n`);
            res.write(`event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}\n\n`);
            res.end();
          } catch (err) {
            console.error(`[api-proxy] Stream error: ${err.message}`);
            if (!res.headersSent) res.writeHead(500);
            res.end();
          }
        }
        pump();
      } else {
        // Non-streaming
        const upstream = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({ ...openaiReq, stream: false }),
        });

        const upstreamJson = await upstream.json();
        if (!upstream.ok) {
          console.error(`[api-proxy] Upstream error ${upstream.status}: ${JSON.stringify(upstreamJson).slice(0, 200)}`);
          res.writeHead(upstream.status);
          res.end(JSON.stringify(upstreamJson));
          return;
        }

        const content = upstreamJson.choices?.[0]?.message?.content || "";
        const response = {
          id: msgId || "msg_" + Date.now(),
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: content }],
          model: TARGET_MODEL,
          stop_reason: upstreamJson.choices?.[0]?.finish_reason === "stop" ? "end_turn" : "max_tokens",
          usage: {
            input_tokens: upstreamJson.usage?.prompt_tokens || 0,
            output_tokens: upstreamJson.usage?.completion_tokens || 0,
          },
        };
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response));
      }
    } catch (err) {
      console.error(`[api-proxy] Error: ${err.message}`);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
    }
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.error(`[api-proxy] Ready on http://127.0.0.1:${PORT}`);
});
