import { NextRequest, NextResponse } from 'next/server';
import { SwarmEngine } from '@/lib/swarm/swarm-engine';
import { SwarmMailbox } from '@/lib/swarm/swarm-mailbox';

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
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const paneId = searchParams.get('paneId');

    let messages;
    if (paneId) {
      messages = SwarmMailbox.getMessagesForPane(paneId, limit);
    } else {
      messages = SwarmMailbox.getMessages(id, limit);
    }

    const unreadCount = paneId
      ? SwarmMailbox.getUnreadCount(id, paneId)
      : SwarmMailbox.getUnreadCount(id);

    return NextResponse.json({ messages, unreadCount });
  } catch (error) {
    console.error('GET /api/swarms/[id]/mailbox error:', error);
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
    const { senderPaneId, recipientPaneId, messageType, subject, body: messageBody, priority } = body;

    if (!senderPaneId || !subject || !messageBody) {
      return NextResponse.json(
        { error: 'senderPaneId, subject, and body are required' },
        { status: 400 }
      );
    }

    const message = SwarmMailbox.send(id, senderPaneId, subject, messageBody, {
      recipientPaneId,
      messageType,
      priority,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
