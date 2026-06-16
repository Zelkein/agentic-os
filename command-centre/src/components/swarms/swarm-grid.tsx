'use client';

import { useMemo } from 'react';
import type { SwarmPane, SwarmLayout } from '@/types/swarm';
import { calculateLayout } from '@/lib/swarm/swarm-grid';
import SwarmPaneCard from '@/components/swarms/swarm-pane';

// ── Style helpers ─────────────────────────────────────────────────

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: 'var(--font-space-grotesk), Space Grotesk, sans-serif', ...s,
});

const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: 'var(--font-inter), Inter, sans-serif', ...s,
});

// ── Grid cell size ────────────────────────────────────────────────

const CELL_W = 200;
const CELL_H = 180;
const GAP = 8;

// ── Props ─────────────────────────────────────────────────────────

export interface SwarmGridProps {
  swarmId: string;
  panes: SwarmPane[];
  layout: SwarmLayout;
  onRemovePane?: (id: string) => void;
  onExecutePane?: (id: string) => void;
  onChatPane?: (id: string) => void;
}

// ── Component ─────────────────────────────────────────────────────

export default function SwarmGrid({
  swarmId,
  panes,
  layout,
  onRemovePane,
  onExecutePane,
  onChatPane,
}: SwarmGridProps) {
  // Compute grid positions using the swarm-grid calculateLayout function.
  // We transform the Map<string, GridPosition> into a merged record for rendering.
  const positions = useMemo(() => calculateLayout(panes, layout), [panes, layout]);

  // Compute total grid dimensions
  const gridDims = useMemo(() => {
    let maxX = 0;
    let maxY = 0;
    for (const pos of positions.values()) {
      maxX = Math.max(maxX, pos.x + pos.w);
      maxY = Math.max(maxY, pos.y + pos.h);
    }
    return { cols: Math.max(maxX, 1), rows: Math.max(maxY, 1) };
  }, [positions]);

  // Empty state
  if (panes.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
          borderRadius: 8,
          border: '1px dashed var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-tertiary)',
          gap: 8,
        }}
      >
        <span style={sg({ fontSize: 14 })}>No panes yet</span>
        <span style={sp({ fontSize: 12 })}>Add agents to this swarm to create panes</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridDims.cols}, 1fr)`,
        gridAutoRows: `minmax(${CELL_H}px, auto)`,
        gap: GAP,
        minHeight: 200,
      }}
    >
      {panes.map((pane) => {
        const pos = positions.get(pane.id);
        if (!pos) return null;

        return (
          <div
            key={pane.id}
            style={{
              gridColumn: `${pos.x + 1} / span ${pos.w}`,
              gridRow: `${pos.y + 1} / span ${pos.h}`,
            }}
          >
            <SwarmPaneCard
              pane={pane}
              onRemove={onRemovePane}
              onExecute={onExecutePane}
              onChat={onChatPane}
            />
          </div>
        );
      })}
    </div>
  );
}
