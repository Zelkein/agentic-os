import type { SwarmLayout, SwarmPane } from '@/types/swarm';

/**
 * Grid layout algorithms for arranging panes.
 * Supports mosaic, columns, and focus layouts.
 */

export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Calculate grid positions for panes based on layout type and count.
 */
export function calculateLayout(
  panes: SwarmPane[],
  layout: SwarmLayout,
  totalSlots: number = 16
): Map<string, GridPosition> {
  const positions = new Map<string, GridPosition>();
  const count = Math.min(panes.length, totalSlots);

  if (count === 0) return positions;

  switch (layout) {
    case 'mosaic':
      return mosaicLayout(panes, count);
    case 'columns':
      return columnsLayout(panes, count);
    case 'focus':
      return focusLayout(panes, count);
    default:
      return columnsLayout(panes, count);
  }
}

/**
 * Mosaic: fills grid optimally like a tiling window manager.
 * 1 pane = full. 2 = split L/R. 3+ = rows of 4.
 */
function mosaicLayout(panes: SwarmPane[], count: number): Map<string, GridPosition> {
  const positions = new Map<string, GridPosition>();
  const cols = 4;
  for (let i = 0; i < count; i++) {
    positions.set(panes[i].id, { x: i % cols, y: Math.floor(i / cols), w: 1, h: 1 });
  }
  return positions;
}

/**
 * Columns: stacks panes vertically in columns.
 * 1-4 panes = 1 column. 5-8 = 2 columns. 9+ = 3+ columns.
 */
function columnsLayout(panes: SwarmPane[], count: number): Map<string, GridPosition> {
  const positions = new Map<string, GridPosition>();
  const cols = Math.min(Math.ceil(count / 4), count);
  const rowsPerCol = Math.ceil(count / cols);
  for (let i = 0; i < count; i++) {
    const col = Math.floor(i / rowsPerCol);
    const row = i % rowsPerCol;
    positions.set(panes[i].id, { x: col, y: row, w: 1, h: 1 });
  }
  return positions;
}

/**
 * Focus: one big pane (first), others as small bars on the side.
 */
function focusLayout(panes: SwarmPane[], count: number): Map<string, GridPosition> {
  const positions = new Map<string, GridPosition>();
  if (count > 0) positions.set(panes[0].id, { x: 0, y: 0, w: 3, h: 4 });
  for (let i = 1; i < Math.min(count, 5); i++) {
    positions.set(panes[i].id, { x: 3, y: i - 1, w: 1, h: 1 });
  }
  for (let i = 5; i < count; i++) {
    positions.set(panes[i].id, { x: (i - 5) % 4, y: 3 + Math.floor((i - 5) / 4), w: 1, h: 1 });
  }
  return positions;
}
