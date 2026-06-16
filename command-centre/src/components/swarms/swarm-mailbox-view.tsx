'use client';

import { useEffect } from 'react';
import {
  Mail,
  MailOpen,
  AlertCircle,
  ArrowUp,
  Loader2,
} from 'lucide-react';
import type { SwarmMailboxMessage } from '@/types/swarm';
import { useSwarmStore } from '@/store/swarm-store';
import { getMessageTypeColor } from '@/lib/swarm/swarm-ui';

// ── Style helpers ─────────────────────────────────────────────────

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: 'var(--font-space-grotesk), Space Grotesk, sans-serif', ...s,
});

const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: 'var(--font-inter), Inter, sans-serif', ...s,
});

// ── Props ─────────────────────────────────────────────────────────

export interface SwarmMailboxViewProps {
  swarmId: string;
}

// ── Single message row ────────────────────────────────────────────

function MailboxMessageRow({ message }: { message: SwarmMailboxMessage }) {
  const typeColor = getMessageTypeColor(message.messageType);
  const isUnread = message.status === 'pending';

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '10px 12px',
        backgroundColor: isUnread ? 'var(--bg-hover)' : 'transparent',
        borderRadius: 6,
        borderLeft: `3px solid ${typeColor}`,
        cursor: 'pointer',
        transition: 'background 120ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isUnread ? 'var(--bg-hover)' : 'transparent'; }}
    >
      {/* Icon */}
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        {isUnread ? (
          <Mail size={14} color={typeColor} />
        ) : (
          <MailOpen size={14} color="var(--text-tertiary)" />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Subject + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span
            style={sg({
              fontSize: 12,
              fontWeight: isUnread ? 600 : 500,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            })}
          >
            {message.subject}
          </span>
          {/* Priority badge */}
          {message.priority > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              <AlertCircle size={10} color="#ef4444" />
              <span style={sp({ fontSize: 10, color: '#ef4444', fontWeight: 600 })}>
                P{message.priority}
              </span>
            </span>
          )}
        </div>

        {/* Body preview */}
        <div
          style={sp({
            fontSize: 11,
            color: 'var(--text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: 4,
          })}
        >
          {message.body}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Message type badge */}
          <span
            style={sp({
              fontSize: 9,
              fontWeight: 600,
              color: typeColor,
              backgroundColor: `${typeColor}15`,
              padding: '1px 5px',
              borderRadius: 3,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            })}
          >
            {message.messageType}
          </span>
          {/* Timestamp */}
          <span style={sp({ fontSize: 10, color: 'var(--text-tertiary)' })}>
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
          {/* Status */}
          <span style={sp({ fontSize: 10, color: 'var(--text-tertiary)' })}>
            · {message.status}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────

export default function SwarmMailboxView({ swarmId }: SwarmMailboxViewProps) {
  const mailbox = useSwarmStore((s) => s.mailbox);
  const loading = useSwarmStore((s) => s.loading);
  const fetchMailbox = useSwarmStore((s) => s.fetchMailbox);
  const unreadCount = useSwarmStore((s) => s.unreadCount);

  useEffect(() => {
    if (swarmId) fetchMailbox(swarmId);
  }, [swarmId, fetchMailbox]);

  // Sort: unread first, then by creation date desc
  const sortedMessages = [...mailbox].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 4px 8px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Mail size={14} color="var(--text-secondary)" />
          <span style={sg({ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' })}>
            Mailbox
          </span>
        </div>
        {unreadCount > 0 && (
          <span
            style={sp({
              fontSize: 10,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: 'var(--accent-color)',
              padding: '1px 7px',
              borderRadius: 10,
            })}
          >
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* Messages list */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          maxHeight: 400,
          overflowY: 'auto',
        }}
      >
        {loading && sortedMessages.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-tertiary)' }} />
          </div>
        ) : sortedMessages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              color: 'var(--text-tertiary)',
              gap: 6,
            }}
          >
            <MailOpen size={24} style={{ opacity: 0.4 }} />
            <span style={sp({ fontSize: 12 })}>No messages yet</span>
          </div>
        ) : (
          sortedMessages.map((msg) => (
            <MailboxMessageRow key={msg.id} message={msg} />
          ))
        )}
      </div>
    </div>
  );
}
