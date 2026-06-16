'use client';

import { useState } from 'react';
import { Bot, Play, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import type { SwarmPane, PaneStatus } from '@/types/swarm';
import { getRoleColor, getRoleLabel, getProviderColor, getProviderLabel, getStatusColor } from '@/lib/swarm/swarm-ui';

// ── Style helpers ─────────────────────────────────────────────────

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: 'var(--font-space-grotesk), Space Grotesk, sans-serif', ...s,
});

const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: 'var(--font-inter), Inter, sans-serif', ...s,
});

// ── Props ─────────────────────────────────────────────────────────

export interface SwarmPaneProps {
  pane: SwarmPane;
  onRemove?: (id: string) => void;
  onExecute?: (id: string) => void;
  onChat?: (id: string) => void;
}

// ── Component ─────────────────────────────────────────────────────

export default function SwarmPaneCard({ pane, onRemove, onExecute, onChat }: SwarmPaneProps) {
  const [removing, setRemoving] = useState(false);

  const roleColor = getRoleColor(pane.role);
  const providerColor = getProviderColor(pane.provider);
  const statusColor = getStatusColor(pane.status);
  const isRunning = pane.status === 'running';

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    try {
      await onRemove?.(pane.id);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: `1px solid ${isRunning ? `${statusColor}40` : 'var(--border-color)'}`,
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        position: 'relative',
        transition: 'border-color 300ms ease',
        boxShadow: isRunning ? `0 0 12px ${statusColor}20` : 'none',
        animation: isRunning ? 'glow-pulse 2s ease-in-out infinite' : 'none',
      }}
    >
      {/* Glow animation keyframes injected via style tag */}
      {isRunning && (
        <style>{`
          @keyframes glow-pulse {
            0%, 100% { box-shadow: 0 0 8px ${statusColor}15; }
            50% { box-shadow: 0 0 18px ${statusColor}30; }
          }
        `}</style>
      )}

      {/* Top row: role badge + status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Role badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: roleColor,
              flexShrink: 0,
            }}
          />
          <span style={sg({ fontSize: 12, fontWeight: 600, color: roleColor })}>
            {getRoleLabel(pane.role)}
          </span>
        </div>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: statusColor,
              flexShrink: 0,
              animation: isRunning ? 'glow-dot 1.5s ease-in-out infinite' : 'none',
            }}
          />
          {isRunning && (
            <style>{`
              @keyframes glow-dot {
                0%, 100% { opacity: 0.6; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.3); }
              }
            `}</style>
          )}
          <span style={sp({ fontSize: 11, fontWeight: 500, color: statusColor, textTransform: 'uppercase' })}>
            {pane.status}
          </span>
        </div>
      </div>

      {/* Provider label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Bot size={12} color={providerColor} />
        <span style={sp({ fontSize: 11, fontWeight: 500, color: providerColor })}>
          {getProviderLabel(pane.provider)}
        </span>
      </div>

      {/* Current task */}
      {pane.currentTask && (
        <div
          style={sp({
            fontSize: 11,
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-tertiary)',
            padding: '4px 8px',
            borderRadius: 4,
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          })}
          title={pane.currentTask}
        >
          {pane.currentTask}
        </div>
      )}

      {/* Bottom: action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 'auto' }}>
        {onChat && (
          <button
            onClick={() => onChat(pane.id)}
            title="Chat with this pane"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              border: 'none',
              borderRadius: 4,
              backgroundColor: 'transparent',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--accent-color)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          >
            <MessageSquare size={12} />
          </button>
        )}
        {onExecute && (
          <button
            onClick={() => onExecute(pane.id)}
            title="Execute task"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              border: 'none',
              borderRadius: 4,
              backgroundColor: 'transparent',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = '#22c55e'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          >
            <Play size={12} />
          </button>
        )}
        {onRemove && (
          <button
            onClick={handleRemove}
            disabled={removing}
            title="Remove pane"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              border: 'none',
              borderRadius: 4,
              backgroundColor: 'transparent',
              color: 'var(--text-tertiary)',
              cursor: removing ? 'not-allowed' : 'pointer',
              transition: 'all 120ms ease',
              marginLeft: 'auto',
            }}
            onMouseEnter={(e) => { if (!removing) { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          >
            {removing ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />}
          </button>
        )}
      </div>
    </div>
  );
}
