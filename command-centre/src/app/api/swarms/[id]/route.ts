import { NextRequest, NextResponse } from 'next/server';
import { SwarmEngine } from '@/lib/swarm/swarm-engine';
import type { Swarm } from '@/types/swarm';

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

    return NextResponse.json(swarm);
  } catch (error) {
    console.error('GET /api/swarms/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = SwarmEngine.getSwarm(id);

    if (!existing) {
      return NextResponse.json({ error: 'Swarm not found' }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields: (keyof Pick<Swarm, 'status' | 'layout' | 'name' | 'projectSlug'>)[] = [
      'status', 'layout', 'name', 'projectSlug',
    ];

    const updateFields: Partial<Pick<Swarm, 'status' | 'layout' | 'name' | 'projectSlug'>> = {};
    for (const field of allowedFields) {
      if (field in body) {
        (updateFields as any)[field] = body[field];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    SwarmEngine.updateSwarm(id, updateFields);
    const updated = SwarmEngine.getSwarm(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/swarms/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = SwarmEngine.getSwarm(id);

    if (!existing) {
      return NextResponse.json({ error: 'Swarm not found' }, { status: 404 });
    }

    SwarmEngine.deleteSwarm(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/swarms/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
