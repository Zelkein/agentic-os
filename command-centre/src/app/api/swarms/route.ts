import { NextRequest, NextResponse } from 'next/server';
import { SwarmEngine } from '@/lib/swarm/swarm-engine';

export async function GET() {
  try {
    const swarms = SwarmEngine.listSwarms();
    return NextResponse.json({ swarms });
  } catch (error) {
    console.error('GET /api/swarms error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, workspaceId, projectSlug, layout } = body;

    if (!name || !workspaceId) {
      return NextResponse.json(
        { error: 'name and workspaceId are required' },
        { status: 400 }
      );
    }

    const swarm = SwarmEngine.createSwarm(name, workspaceId, projectSlug, layout);
    return NextResponse.json(swarm, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
