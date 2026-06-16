// Agent Bridge — proxy between Command Centre and Hermes agent gateways
// 
// Status checks: direct HTTP GET to each gateway's /health endpoint (no auth).
// Chat: routed via the Qwen Router (port 8643) which accepts Bearer llama and
//       proxies to each agent's model provider.
//
// Auth: the Qwen Router uses "llama" as its Bearer token. Individual Hermes
//       gateways have separate auth that could be configured in future.

import { getAgent, BRIDGE_AGENTS, type BridgeAgent } from "./agent-bridge-config";

export interface BridgeStatus {
  name: string;
  online: boolean;
  label: string;
  modelProvider: string;
  description: string;
  node: string;
  latency: number | null;
  error: string | null;
  lastContact: string | null;
}

export interface BridgeMetrics {
  total: number;
  online: number;
  offline: number;
  byNode: Record<string, { total: number; online: number }>;
}

// Qwen Router accepts this for all model proxying
const GW_AUTH = "Bearer llama";
const QWEN_ROUTER_URL = "http://localhost:8643/v1/chat/completions";

const HEALTH_TIMEOUT_MS = 3000;

function gwHeaders(): Record<string, string> {
  return { Authorization: GW_AUTH, "Content-Type": "application/json" };
}

// ── Health Check ─────────────────────────────────────────────────────

async function checkHealth(agent: BridgeAgent): Promise<BridgeStatus> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    const resp = await fetch(`${agent.gatewayUrl}/health`, { signal: controller.signal });
    clearTimeout(timeout);

    return {
      name: agent.name,
      online: resp.ok,
      label: agent.label,
      modelProvider: agent.modelProvider,
      description: agent.description,
      node: agent.node,
      latency: resp.ok ? Date.now() - start : null,
      error: resp.ok ? null : `HTTP ${resp.status}`,
      lastContact: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      name: agent.name,
      online: false, label: agent.label,
      modelProvider: agent.modelProvider,
      description: agent.description,
      node: agent.node,
      latency: null,
      error: err.name === "AbortError" ? "timeout" : err.message,
      lastContact: new Date().toISOString(),
    };
  }
}

// ── Public API ───────────────────────────────────────────────────────

export async function getAllStatuses(): Promise<BridgeStatus[]> {
  const results = await Promise.allSettled(BRIDGE_AGENTS.map(checkHealth));
  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : {
      ...BRIDGE_AGENTS[i], online: false, latency: null,
      error: r.reason?.message ?? "unknown", lastContact: new Date().toISOString(),
    }
  );
}

export async function getAgentStatus(name: string): Promise<BridgeStatus | null> {
  const agent = getAgent(name);
  return agent ? checkHealth(agent) : null;
}

export function computeMetrics(statuses: BridgeStatus[]): BridgeMetrics {
  const byNode: Record<string, { total: number; online: number }> = {};
  for (const s of statuses) {
    if (!byNode[s.node]) byNode[s.node] = { total: 0, online: 0 };
    byNode[s.node].total++;
    if (s.online) byNode[s.node].online++;
  }
  return {
    total: statuses.length,
    online: statuses.filter(s => s.online).length,
    offline: statuses.filter(s => !s.online).length,
    byNode,
  };
}

/** Proxy a chat message via the Qwen Router. */
export async function proxyChat(
  name: string,
  messages: Array<{ role: string; content: string }>,
): Promise<Response> {
  const agent = getAgent(name);
  if (!agent) {
    return new Response(JSON.stringify({ error: `Unknown agent: ${name}` }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  return fetch(QWEN_ROUTER_URL, {
    method: "POST",
    headers: gwHeaders(),
    body: JSON.stringify({ model: name, messages, stream: false, max_tokens: 4096 }),
  });
}

/** Proxy streaming chat via the Qwen Router. */
export async function proxyChatStream(
  name: string,
  messages: Array<{ role: string; content: string }>,
): Promise<Response> {
  const agent = getAgent(name);
  if (!agent) {
    return new Response(JSON.stringify({ error: `Unknown agent: ${name}` }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  const upstreamResp = await fetch(QWEN_ROUTER_URL, {
    method: "POST",
    headers: gwHeaders(),
    body: JSON.stringify({ model: name, messages, stream: true, max_tokens: 4096 }),
  });

  if (!upstreamResp.ok) {
    const text = await upstreamResp.text();
    return new Response(text, { status: upstreamResp.status, headers: { "Content-Type": "application/json" } });
  }

  return new Response(upstreamResp.body, {
    status: 200,
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
