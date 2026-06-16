import { NextRequest, NextResponse } from "next/server";
import { getAgent, BRIDGE_AGENTS } from "@/lib/agent-bridge-config";
import { getAgentStatus, proxyChat } from "@/lib/agent-bridge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Catch-all route for /api/agents/bridge/[name]/...
 *
 * GET /api/agents/bridge/[name]/status  → health check for one agent
 * POST /api/agents/bridge/[name]/chat   → proxy chat message to agent
 * POST /api/agents/bridge/[name]/chat   → with stream:true returns SSE
 * GET  /api/agents/bridge/[name]        → same as /status
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    return NextResponse.json({ error: "Agent name required" }, { status: 400 });
  }

  const name = slug[0];
  const subPath = slug[1] || "status";

  const agent = getAgent(name);
  if (!agent) {
    return NextResponse.json({ error: `Unknown agent: ${name}` }, { status: 404 });
  }

  try {
    const status = await getAgentStatus(name);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({ error: "Health check failed" }, { status: 500 });
  }
}

/**
 * POST /api/agents/bridge/[name]/chat
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  if (!slug || slug.length < 2 || slug[1] !== "chat") {
    return NextResponse.json({ error: "Use POST /api/agents/bridge/[name]/chat" }, { status: 400 });
  }

  const name = slug[0];

  try {
    const body = await request.json();
    const { messages, stream } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    const upstreamResp = await proxyChat(name, messages);

    if (stream) {
      const data = await upstreamResp.json();
      // Convert to SSE stream
      const encoder = new TextEncoder();
      const sseStream = new ReadableStream({
        start(controller) {
          const content = data?.choices?.[0]?.message?.content || "";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(sseStream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    const data = await upstreamResp.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`POST /api/agents/bridge/${slug?.[0]}/chat error:`, error);
    return NextResponse.json({ error: error.message || "Chat proxy failed" }, { status: 500 });
  }
}
