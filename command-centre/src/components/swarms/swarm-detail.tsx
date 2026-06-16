'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Layers,
  LayoutGrid,
  LayoutList,
  Maximize2,
  Trash2,
  Loader2,
  Plus,
  Bot,
} from 'lucide-react';
import { useSwarmStore } from '@/store/swarm-store';
import type { SwarmLayout, SwarmPane } from '@/types/swarm';
import { getSwarmStatusColor } from '@/lib/swarm/swarm-ui';
import SwarmGrid from '@/components/swarms/swarm-grid';
import SwarmMailboxView from '@/components/swarms/swarm-mailbox-view';

// ── Style helpers ─────────────────────────────────────────────────

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: 'var(--font-space-grotesk), Space Grotesk, sans-serif', ...s,
});

const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: 'var(--font-inter), Inter, sans-serif', ...s,
});

// ── Layout icons map ──────────────────────────────────────────────

const LAYOUT_ICONS: Record<SwarmLayout, typeof LayoutGrid> = {
  mosaic: LayoutGrid,
  columns: LayoutList,
  focus: Maximize2,
};

// ── Props ─────────────────────────────────────────────────────────

export interface SwarmDetailProps {
  swarmId: string;
}

// ── Add Pane Modal ────────────────────────────────────────────────

function AddPaneModal({
  swarmId,
  onClose,
}: {
  swarmId: string;
  onClose: () => void;
}) {
  const addPane = useSwarmStore((s) => s.addPane);
  const [agentId, setAgentId] = useState('');
  const [role, setRole] = useState<string>('builder');
  const [provider, setProvider] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!agentId.trim()) return;
      setSubmitting(true);
      try {
        await addPane(swarmId, agentId.trim(), role, provider || undefined);
        onClose();
      } finally {
        setSubmitting(false);
      }
    },
    [agentId, role, provider, swarmId, addPane, onClose]
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: 400,
          maxWidth: '90vw',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          padding: 24,
        }}
      >
        <h2 style={sg({ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 20px' })}>
          Add Pane
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={sp({ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 })}>
              Agent ID *
            </label>
            <input
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="Agent identifier"
              style={sp({
                width: '100%',
                padding: '8px 12px',
                fontSize: 13,
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                outline: 'none',
                boxSizing: 'border-box',
              })}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={sp({ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 })}>
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={sp({
                width: '100%',
                padding: '8px 12px',
                fontSize: 13,
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                outline: 'none',
                boxSizing: 'border-box',
              })}
            >
              <option value="coordinator">Coordinator</option>
              <option value="builder">Builder</option>
              <option value="scout">Scout</option>
              <option value="reviewer">Reviewer</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={sp({ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 })}>
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              style={sp({
                width: '100%',
                padding: '8px 12px',
                fontSize: 13,
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                outline: 'none',
                boxSizing: 'border-box',
              })}
            >
              <option value="">Default (role-based)</option>
              <option value="claude">Claude Code</option>
              <option value="codex">Codex CLI</option>
              <option value="gemini">Gemini CLI</option>
              <option value="kimi">Kimi</option>
              <option value="opencode">OpenCode</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={sp({
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                cursor: 'pointer',
              })}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !agentId.trim()}
              style={sp({
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: '#fff',
                backgroundColor: 'var(--accent-color)',
                border: 'none',
                borderRadius: 6,
                cursor: submitting || !agentId.trim() ? 'not-allowed' : 'pointer',
                opacity: submitting || !agentId.trim() ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              })}
            >
              {submitting && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              {submitting ? 'Adding...' : 'Add Pane'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── SwarmDetail component ─────────────────────────────────────────

export default function SwarmDetail({ swarmId }: SwarmDetailProps) {
  const router = useRouter();
  const selectedSwarm = useSwarmStore((s) => s.selectedSwarm);
  const panes = useSwarmStore((s) => s.panes);
  const loading = useSwarmStore((s) => s.loading);
  const error = useSwarmStore((s) => s.error);
  const selectSwarm = useSwarmStore((s) => s.selectSwarm);
  const deleteSwarm = useSwarmStore((s) => s.deleteSwarm);
  const removePane = useSwarmStore((s) => s.removePane);

  const [showAddPane, setShowAddPane] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(true);

  useEffect(() => {
    if (swarmId) selectSwarm(swarmId);
  }, [swarmId, selectSwarm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      selectSwarm(null);
    };
  }, [selectSwarm]);

  const handleDeleteSwarm = useCallback(async () => {
    if (!window.confirm('Delete this swarm and all its panes?')) return;
    await deleteSwarm(swarmId);
    router.push('/swarms');
  }, [swarmId, deleteSwarm, router]);

  const handleRemovePane = useCallback(
    async (id: string) => {
      await removePane(id);
    },
    [removePane]
  );

  const handleExecutePane = useCallback((id: string) => {
    // Placeholder — wire to actual execution later
    console.log('Execute pane:', id);
  }, []);

  const handleChatPane = useCallback((id: string) => {
    // Placeholder — wire to chat later
    console.log('Chat with pane:', id);
  }, []);

  // ── Loading state ────────────────────────────────────────────────
  if (loading && !selectedSwarm) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-tertiary)' }} />
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────
  if (!selectedSwarm && !loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          gap: 12,
          color: 'var(--text-tertiary)',
        }}
      >
        <Layers size={40} style={{ opacity: 0.4 }} />
        <p style={sp({ fontSize: 14, margin: 0 })}>Swarm not found</p>
        <button
          onClick={() => router.push('/swarms')}
          style={sp({
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--accent-color)',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            cursor: 'pointer',
          })}
        >
          Back to Swarms
        </button>
      </div>
    );
  }

  if (!selectedSwarm) return null;

  const statusColor = getSwarmStatusColor(selectedSwarm.status);
  const LayoutIcon = LAYOUT_ICONS[selectedSwarm.layout];

  return (
    <div style={{ padding: '24px' }}>
      {/* Back button */}
      <button
        onClick={() => router.push('/swarms')}
        style={sp({
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '6px 10px',
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--text-secondary)',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          marginBottom: 16,
          transition: 'all 120ms ease',
        })}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--accent-color)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        <ArrowLeft size={14} />
        Back to Swarms
      </button>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 0 16px',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: 16,
        }}
      >
        {/* Left: name + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Layers size={20} color={statusColor} />
          <div>
            <h1 style={sg({ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 })}>
              {selectedSwarm.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <span
                style={sp({
                  fontSize: 11,
                  fontWeight: 600,
                  color: statusColor,
                  backgroundColor: `${statusColor}18`,
                  padding: '1px 8px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                })}
              >
                {selectedSwarm.status}
              </span>
              <span style={sp({ fontSize: 11, color: 'var(--text-tertiary)' })}>
                {selectedSwarm.projectSlug || 'No project'}
              </span>
              <span style={sp({ fontSize: 11, color: 'var(--text-tertiary)' })}>
                · {panes.length} pane{panes.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Right: layout selector + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Layout display */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
            }}
          >
            <LayoutIcon size={13} color="var(--text-secondary)" />
            <span style={sp({ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'capitalize' })}>
              {selectedSwarm.layout}
            </span>
          </div>

          {/* Add pane */}
          <button
            onClick={() => setShowAddPane(true)}
            title="Add pane"
            style={sp({
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 500,
              color: '#fff',
              backgroundColor: 'var(--accent-color)',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            })}
          >
            <Plus size={13} />
            Add Pane
          </button>

          {/* Delete swarm */}
          <button
            onClick={handleDeleteSwarm}
            title="Delete swarm"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              border: 'none',
              borderRadius: 6,
              backgroundColor: 'transparent',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          >
            <Trash2 size={14} />
          </button>

          {/* Toggle side panel */}
          <button
            onClick={() => setShowSidePanel((v) => !v)}
            title="Toggle mailbox panel"
            style={sp({
              padding: '6px 10px',
              fontSize: 12,
              color: showSidePanel ? 'var(--accent-color)' : 'var(--text-secondary)',
              backgroundColor: showSidePanel ? 'var(--bg-hover)' : 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              cursor: 'pointer',
            })}
          >
            Mailbox
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={sp({
            padding: '8px 12px',
            fontSize: 12,
            color: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 6,
            marginBottom: 12,
          })}
        >
          {error}
        </div>
      )}

      {/* ── Main content: grid + side panel ─────────────────────── */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Grid area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <SwarmGrid
            swarmId={swarmId}
            panes={panes}
            layout={selectedSwarm.layout}
            onRemovePane={handleRemovePane}
            onExecutePane={handleExecutePane}
            onChatPane={handleChatPane}
          />
        </div>

        {/* Side panel: mailbox */}
        {showSidePanel && (
          <div
            style={{
              width: 320,
              flexShrink: 0,
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              padding: 12,
              maxHeight: 'calc(100vh - 200px)',
              overflowY: 'auto',
            }}
          >
            <SwarmMailboxView swarmId={swarmId} />
          </div>
        )}
      </div>

      {/* Add pane modal */}
      {showAddPane && (
        <AddPaneModal
          swarmId={swarmId}
          onClose={() => setShowAddPane(false)}
        />
      )}
    </div>
  );
}
