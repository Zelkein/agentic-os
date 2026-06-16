'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Plus, Trash2, Loader2, Bot, ChevronRight } from 'lucide-react';
import { useSwarmStore } from '@/store/swarm-store';
import type { Swarm, SwarmStatus, SwarmLayout } from '@/types/swarm';
import { getSwarmStatusColor, getRoleColor, getProviderColor } from '@/lib/swarm/swarm-ui';

// ── Style helpers ─────────────────────────────────────────────────

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: 'var(--font-space-grotesk), Space Grotesk, sans-serif', ...s,
});

const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: 'var(--font-inter), Inter, sans-serif', ...s,
});

// ── Create Swarm Modal ────────────────────────────────────────────

function CreateSwarmModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const createSwarm = useSwarmStore((s) => s.createSwarm);
  const [name, setName] = useState('');
  const [projectSlug, setProjectSlug] = useState('');
  const [layout, setLayout] = useState<SwarmLayout>('mosaic');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      setSubmitting(true);
      try {
        const wsId = 'default';
        const result = await createSwarm(name.trim(), wsId, projectSlug.trim() || undefined, layout);
        if (result) onCreated();
      } finally {
        setSubmitting(false);
      }
    },
    [name, projectSlug, layout, createSwarm, onCreated]
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
          width: 420,
          maxWidth: '90vw',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          padding: 24,
        }}
      >
        <h2 style={sg({ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 20px' })}>
          Nouveau Swarm
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={sp({ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 })}>
              Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Feature X Swarm"
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
          <div style={{ marginBottom: 16 }}>
            <label style={sp({ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 })}>
              Project Slug
            </label>
            <input
              value={projectSlug}
              onChange={(e) => setProjectSlug(e.target.value)}
              placeholder="e.g. my-project"
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
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={sp({ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 })}>
              Layout
            </label>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as SwarmLayout)}
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
              <option value="mosaic">Mosaic</option>
              <option value="columns">Columns</option>
              <option value="focus">Focus</option>
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
              disabled={submitting || !name.trim()}
              style={sp({
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: '#fff',
                backgroundColor: 'var(--accent-color)',
                border: 'none',
                borderRadius: 6,
                cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer',
                opacity: submitting || !name.trim() ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              })}
            >
              {submitting && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              {submitting ? 'Creating...' : 'Create Swarm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Swarm Card ────────────────────────────────────────────────────

function SwarmCard({
  swarm,
  onSelect,
  onDelete,
}: {
  swarm: Swarm;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const statusColor = getSwarmStatusColor(swarm.status);
  const paneCount = 0; // Could be fetched, but placeholder for now

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleting) return;
    setDeleting(true);
    try {
      await onDelete(swarm.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      onClick={() => onSelect(swarm.id)}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 10,
        padding: 16,
        cursor: 'pointer',
        transition: 'all 150ms ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-color)';
        e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent-color)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Top row: name + status badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={16} color={statusColor} />
          <span style={sg({ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' })}>
            {swarm.name}
          </span>
        </div>
        <span
          style={sp({
            fontSize: 11,
            fontWeight: 600,
            color: statusColor,
            backgroundColor: `${statusColor}18`,
            padding: '2px 8px',
            borderRadius: 4,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          })}
        >
          {swarm.status}
        </span>
      </div>

      {/* Middle: meta info */}
      <div style={sp({ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 16 })}>
        <span>Project: {swarm.projectSlug || '—'}</span>
        <span>Layout: {swarm.layout}</span>
      </div>

      {/* Bottom: date */}
      <div style={sp({ fontSize: 11, color: 'var(--text-tertiary)' })}>
        Created {new Date(swarm.createdAt).toLocaleDateString()} · Updated {new Date(swarm.updatedAt).toLocaleDateString()}
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        title="Delete swarm"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          border: 'none',
          borderRadius: 6,
          backgroundColor: 'transparent',
          color: 'var(--text-tertiary)',
          cursor: 'pointer',
          opacity: 0,
          transition: 'opacity 150ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
      >
        {deleting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
      </button>

      {/* Arrow hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          color: 'var(--text-tertiary)',
          opacity: 0,
          transition: 'opacity 150ms ease',
        }}
        className="card-arrow"
      >
        <ChevronRight size={14} />
      </div>
    </div>
  );
}

// ── SwarmList (main export) ───────────────────────────────────────

export default function SwarmList() {
  const router = useRouter();
  const swarms = useSwarmStore((s) => s.swarms);
  const loading = useSwarmStore((s) => s.loading);
  const error = useSwarmStore((s) => s.error);
  const fetchSwarms = useSwarmStore((s) => s.fetchSwarms);
  const deleteSwarm = useSwarmStore((s) => s.deleteSwarm);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchSwarms();
  }, [fetchSwarms]);

  const handleSelect = useCallback(
    (id: string) => router.push(`/swarms/${id}`),
    [router]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteSwarm(id);
    },
    [deleteSwarm]
  );

  if (loading && swarms.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-tertiary)' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={sg({ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 })}>
            Swarms
          </h1>
          <p style={sp({ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' })}>
            Multi-agent coordination teams
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={sp({
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 500,
            color: '#fff',
            backgroundColor: 'var(--accent-color)',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'opacity 150ms ease',
          })}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = 0.9; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = 1; }}
        >
          <Plus size={14} />
          Nouveau Swarm
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={sp({
            padding: '10px 14px',
            fontSize: 13,
            color: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 6,
            marginBottom: 16,
          })}
        >
          {error}
        </div>
      )}

      {/* Empty state */}
      {swarms.length === 0 && !loading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
            gap: 12,
            color: 'var(--text-tertiary)',
          }}
        >
          <Layers size={40} style={{ opacity: 0.4 }} />
          <p style={sp({ fontSize: 14, margin: 0 })}>No swarms yet</p>
          <p style={sp({ fontSize: 12, margin: 0 })}>Create your first swarm to start coordinating agents</p>
          <button
            onClick={() => setShowCreate(true)}
            style={sp({
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              color: '#fff',
              backgroundColor: 'var(--accent-color)',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            })}
          >
            <Plus size={14} />
            Nouveau Swarm
          </button>
        </div>
      ) : (
        /* Grid of swarm cards */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 12,
          }}
        >
          {swarms.map((swarm) => (
            <SwarmCard
              key={swarm.id}
              swarm={swarm}
              onSelect={handleSelect}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateSwarmModal
          onClose={() => setShowCreate(false)}
          onCreated={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
