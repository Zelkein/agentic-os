import { NextRequest, NextResponse } from 'next/server';
import { SwarmEngine } from '@/lib/swarm/swarm-engine';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const swarm = SwarmEngine.getSwarm(id);

    if (!swarm) {
      return NextResponse.json({ error: 'Swarm not found' }, { status: 404 });
    }

    const panes = SwarmEngine.getPanes(id);
    return NextResponse.json({ panes });
  } catch (error) {
    console.error('GET /api/swarms/[id]/panes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const swarm = SwarmEngine.getSwarm(id);

    if (!swarm) {
      return NextResponse.json({ error: 'Swarm not found' }, { status: 404 });
    }

    const body = await request.json();
    const { agentId, role, provider, gridX, gridY } = body;

    if (!agentId || !role) {
      return NextResponse.json(
        { error: 'agentId and role are required' },
        { status: 400 }
      );
    }

    const pane = SwarmEngine.addPane(
      id,
      agentId,
      role,
      provider,
      gridX !== undefined || gridY !== undefined
        ? { x: gridX ?? 0, y: gridY ?? 0 }
        : undefined
    );

    return NextResponse.json(pane, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
