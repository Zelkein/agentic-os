import { NextRequest, NextResponse } from 'next/server';
import { SwarmEngine } from '@/lib/swarm/swarm-engine';
import type { SwarmPane } from '@/types/swarm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ paneId: string }> }
) {
  try {
    const { paneId } = await params;
    const existing = SwarmEngine.getPane(paneId);

    if (!existing) {
      return NextResponse.json({ error: 'Pane not found' }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields: (keyof Pick<SwarmPane, 'status' | 'currentTask' | 'pid' | 'gridX' | 'gridY' | 'gridW' | 'gridH'>)[] = [
      'status', 'currentTask', 'pid', 'gridX', 'gridY', 'gridW', 'gridH',
    ];

    const updateFields: Partial<Pick<SwarmPane, 'status' | 'currentTask' | 'pid' | 'gridX' | 'gridY' | 'gridW' | 'gridH'>> = {};
    for (const field of allowedFields) {
      if (field in body) {
        (updateFields as any)[field] = body[field];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    SwarmEngine.updatePane(paneId, updateFields);
    const updated = SwarmEngine.getPane(paneId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/swarms/panes/[paneId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ paneId: string }> }
) {
  try {
    const { paneId } = await params;
    const existing = SwarmEngine.getPane(paneId);

    if (!existing) {
      return NextResponse.json({ error: 'Pane not found' }, { status: 404 });
    }

    SwarmEngine.removePane(paneId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/swarms/panes/[paneId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
