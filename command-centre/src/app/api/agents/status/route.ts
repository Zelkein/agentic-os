import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface AgentStatus {
  id: string;
  name: string;
  model: string;
  provider: string;
  status: "idle" | "running" | "error";
  queueDepth: number;
  currentTask: string | null;
  activeTime: string | null;
  latency: number | null;
  version: string;
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();

    // Get all configured agents
    const agents = db.prepare(`
      SELECT id, name, llm_provider, llm_model
      FROM agents
      ORDER BY name ASC
    `).all() as Array<{ id: string; name: string; llm_provider: string; llm_model: string }>;

    // Get running tasks per agent (using the task table, with a fallback agent name)
    // Since tasks don't have a direct agent_id, we infer from the model/provider
    const runningTasks = db.prepare(`
      SELECT model, COUNT(*) as count, MAX(updatedAt) as latest
      FROM tasks
      WHERE status IN ('running', 'queued')
      GROUP BY model
      ORDER BY count DESC
    `).all() as Array<{ model: string; count: number; latest: string }>;

    // Build a map of model -> running count
    const modelTaskCount = new Map<string, number>();
    const modelLatestTime = new Map<string, string>();
    for (const t of runningTasks) {
      modelTaskCount.set(t.model, t.count);
      if (t.latest) modelLatestTime.set(t.model, t.latest);
    }

    // Get total running/queued tasks count
    const totalRunning = db.prepare(`
      SELECT COUNT(*) as count FROM tasks WHERE status = 'running'
    `).get() as { count: number };

    const totalQueued = db.prepare(`
      SELECT COUNT(*) as count FROM tasks WHERE status = 'queued'
    `).get() as { count: number };

    // Build status for each agent
    const agentStatuses: AgentStatus[] = agents.map((agent) => {
      const taskCount = modelTaskCount.get(agent.llm_model) || 0;
      const latest = modelLatestTime.get(agent.llm_model) || null;

      let status: "idle" | "running" | "error" = "idle";
      if (taskCount > 0) status = "running";

      return {
        id: agent.id,
        name: agent.name,
        model: agent.llm_model,
        provider: agent.llm_provider,
        status,
        queueDepth: taskCount,
        currentTask: null, // Can be enriched with actual task title if needed
        activeTime: latest,
        latency: null, // Would need actual ping measurement
        version: "1.0",
      };
    });

    // Add inferred agents (from task model usage) that aren't in the agents table
    const configuredModels = new Set(agents.map(a => a.llm_model));
    for (const model of modelTaskCount.keys()) {
      if (!configuredModels.has(model) && model) {
        agentStatuses.push({
          id: `infer-${model}`,
          name: model,
          model,
          provider: "inferred",
          status: "running",
          queueDepth: modelTaskCount.get(model) || 0,
          currentTask: null,
          activeTime: modelLatestTime.get(model) || null,
          latency: null,
          version: "auto",
        });
      }
    }

    return NextResponse.json({
      agents: agentStatuses,
      summary: {
        total: agentStatuses.length,
        running: agentStatuses.filter(a => a.status === "running").length,
        idle: agentStatuses.filter(a => a.status === "idle").length,
        totalRunningTasks: totalRunning.count,
        totalQueuedTasks: totalQueued.count,
      },
    });
  } catch (error) {
    console.error("GET /api/agents/status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent status", agents: [], summary: { total: 0, running: 0, idle: 0, totalRunningTasks: 0, totalQueuedTasks: 0 } },
      { status: 500 }
    );
  }
}
