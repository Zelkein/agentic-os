import 'server-only';
import { getDb } from '@/lib/db';
import type { SwarmMailboxMessage, MailboxMessageType } from '@/types/swarm';

/**
 * Mailbox bus — inter-agent communication within a swarm.
 * Messages are persisted in SQLite for durability.
 */

export class SwarmMailbox {
  static send(
    swarmId: string,
    senderPaneId: string,
    subject: string,
    body: string,
    options?: {
      recipientPaneId?: string;
      messageType?: MailboxMessageType;
      priority?: number;
    }
  ): SwarmMailboxMessage {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const msg: SwarmMailboxMessage = {
      id,
      swarmId,
      senderPaneId,
      recipientPaneId: options?.recipientPaneId ?? null,
      messageType: options?.messageType ?? 'request',
      subject,
      body,
      priority: options?.priority ?? 0,
      status: 'pending',
      createdAt: now,
      readAt: null,
    };
    db.prepare(`INSERT INTO swarm_mailbox (id, swarm_id, sender_pane_id, recipient_pane_id, message_type, subject, body, priority, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      msg.id, msg.swarmId, msg.senderPaneId, msg.recipientPaneId,
      msg.messageType, msg.subject, msg.body, msg.priority, msg.createdAt
    );
    return msg;
  }

  static broadcast(
    swarmId: string,
    senderPaneId: string,
    subject: string,
    body: string,
    messageType: MailboxMessageType = 'broadcast'
  ): SwarmMailboxMessage {
    return this.send(swarmId, senderPaneId, subject, body, { messageType });
  }

  static getMessages(swarmId: string, limit: number = 50): SwarmMailboxMessage[] {
    const db = getDb();
    return db.prepare('SELECT * FROM swarm_mailbox WHERE swarm_id = ? ORDER BY priority ASC, created_at DESC LIMIT ?').all(swarmId, limit) as SwarmMailboxMessage[];
  }

  static getMessagesForPane(paneId: string, limit: number = 20): SwarmMailboxMessage[] {
    const db = getDb();
    return db.prepare('SELECT * FROM swarm_mailbox WHERE recipient_pane_id = ? OR recipient_pane_id IS NULL ORDER BY priority ASC, created_at DESC LIMIT ?').all(paneId, limit) as SwarmMailboxMessage[];
  }

  static markRead(id: string): void {
    const db = getDb();
    db.prepare("UPDATE swarm_mailbox SET status = 'read', read_at = ? WHERE id = ?").run(new Date().toISOString(), id);
  }

  static markActed(id: string): void {
    const db = getDb();
    db.prepare("UPDATE swarm_mailbox SET status = 'acted_upon' WHERE id = ?").run(id);
  }

  static getUnreadCount(swarmId: string, paneId?: string): number {
    const db = getDb();
    if (paneId) {
      return (db.prepare('SELECT COUNT(*) as c FROM swarm_mailbox WHERE swarm_id = ? AND (recipient_pane_id = ? OR recipient_pane_id IS NULL) AND status = ?').get(swarmId, paneId, 'pending') as any).c;
    }
    return (db.prepare('SELECT COUNT(*) as c FROM swarm_mailbox WHERE swarm_id = ? AND status = ?').get(swarmId, 'pending') as any).c;
  }
}
