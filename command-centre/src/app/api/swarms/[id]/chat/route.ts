import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { SwarmEngine } from '@/lib/swarm/swarm-engine';
import type { SwarmChatMessage } from '@/types/swarm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const swarm = SwarmEngine.getSwarm(id);

    if (!swarm) {
      return NextResponse.json({ error: 'Swarm not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const db = getDb();
    const messages = db
      .prepare('SELECT * FROM swarm_chat_messages WHERE swarm_id = ? ORDER BY created_at ASC LIMIT ?')
      .all(id, limit) as SwarmChatMessage[];

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('GET /api/swarms/[id]/chat error:', error);
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
    const { paneId, role, content, metadata } = body;

    if (!role || !content) {
      return NextResponse.json(
        { error: 'role and content are required' },
        { status: 400 }
      );
    }

    const validRoles = ['user', 'agent', 'coordinator', 'system'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `role must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    const db = getDb();
    const now = new Date().toISOString();
    const messageId = crypto.randomUUID();

    db.prepare(
      `INSERT INTO swarm_chat_messages (id, swarm_id, pane_id, role, content, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(messageId, id, paneId || null, role, content, metadata || null, now);

    const message = db
      .prepare('SELECT * FROM swarm_chat_messages WHERE id = ?')
      .get(messageId) as SwarmChatMessage;

    return NextResponse.json(message, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
