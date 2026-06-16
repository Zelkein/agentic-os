import { NextRequest, NextResponse } from "next/server";
import { getAllStatuses, computeMetrics } from "@/lib/agent-bridge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/agents/bridge
 * Returns live status for all Hermes agents running on the NucBox.
 * Each agent's health is checked in parallel (~3s max).
 */
export async function GET() {
  try {
    const statuses = await getAllStatuses();
    const metrics = computeMetrics(statuses);

    return NextResponse.json({
      agents: statuses,
      metrics,
    });
  } catch (error) {
    console.error("GET /api/agents/bridge error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bridge agent statuses", agents: [], metrics: null },
      { status: 500 }
    );
  }
}
