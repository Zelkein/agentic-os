import { NextRequest, NextResponse } from 'next/server';
import { SwarmEngine } from '@/lib/swarm/swarm-engine';
import { SwarmMailbox } from '@/lib/swarm/swarm-mailbox';

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
    const { senderPaneId, subject, body: messageBody, messageType } = body;

    if (!senderPaneId || !subject || !messageBody) {
      return NextResponse.json(
        { error: 'senderPaneId, subject, and body are required' },
        { status: 400 }
      );
    }

    const message = SwarmMailbox.broadcast(
      id,
      senderPaneId,
      subject,
      messageBody,
      messageType
    );

    return NextResponse.json(message, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
