import 'server-only';
import { getDb } from '@/lib/db';
import type { Swarm, SwarmPane, SwarmStatus, PaneStatus } from '@/types/swarm';

/**
 * SwarmEngine — Core orchestration logic for multi-agent swarms.
 * Manages lifecycle: create → deploy → coordinate → complete.
 */

export class SwarmEngine {
  /** Create a new swarm with initial metadata */
  static createSwarm(
    name: string,
    workspaceId: string,
    projectSlug: string = '',
    layout: string = 'mosaic'
  ): Swarm {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO swarms (id, name, workspace_id, status, layout, project_slug, created_at, updated_at)
      VALUES (?, ?, ?, 'idle', ?, ?, ?, ?)`).run(id, name, workspaceId, layout, projectSlug, now, now);
    return this.getSwarm(id)!;
  }

  /** Get a single swarm by ID */
  static getSwarm(id: string): Swarm | null {
    const db = getDb();
    return (db.prepare('SELECT * FROM swarms WHERE id = ?').get(id) as any) ?? null;
  }

  /** List all swarms, newest first */
  static listSwarms(): Swarm[] {
    const db = getDb();
    return db.prepare('SELECT * FROM swarms ORDER BY created_at DESC').all() as Swarm[];
  }

  /** Update swarm fields (status, layout, project_slug) */
  static updateSwarm(id: string, fields: Partial<Pick<Swarm, 'status' | 'layout' | 'name' | 'projectSlug'>>): void {
    const db = getDb();
    const sets: string[] = [];
    const vals: any[] = [];
    const keyMap: Record<string, string> = { status: 'status', layout: 'layout', name: 'name', projectSlug: 'project_slug' };
    for (const [k, v] of Object.entries(fields)) {
      const col = keyMap[k];
      if (col && v !== undefined) { sets.push(`${col} = ?`); vals.push(v); }
    }
    if (!sets.length) return;
    vals.push(new Date().toISOString(), id);
    db.prepare(`UPDATE swarms SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`).run(...vals);
  }

  /** Delete swarm and all related data (cascade) */
  static deleteSwarm(id: string): void {
    const db = getDb();
    db.prepare('DELETE FROM swarms WHERE id = ?').run(id);
  }

  /** Add a pane (agent slot) to a swarm */
  static addPane(
    swarmId: string,
    agentId: string,
    role: string,
    provider: string = 'custom',
    gridPos?: { x: number; y: number }
  ): SwarmPane {
    const db = getDb();
    const swarm = this.getSwarm(swarmId);
    if (!swarm) throw new Error('Swarm not found');
    const paneCount = (db.prepare('SELECT COUNT(*) as c FROM swarm_panes WHERE swarm_id = ?').get(swarmId) as any).c;
    if (paneCount >= 16) throw new Error('Max 16 panes per swarm');
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const x = gridPos?.x ?? (paneCount % 4);
    const y = gridPos?.y ?? Math.floor(paneCount / 4);
    db.prepare(`INSERT INTO swarm_panes (id, swarm_id, agent_id, role, grid_x, grid_y, provider, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, swarmId, agentId, role, x, y, provider, now, now);
    return this.getPane(id)!;
  }

  /** Get a single pane */
  static getPane(id: string): SwarmPane | null {
    const db = getDb();
    return (db.prepare('SELECT * FROM swarm_panes WHERE id = ?').get(id) as any) ?? null;
  }

  /** Get all panes for a swarm */
  static getPanes(swarmId: string): SwarmPane[] {
    const db = getDb();
    return db.prepare('SELECT * FROM swarm_panes WHERE swarm_id = ? ORDER BY grid_y, grid_x').all(swarmId) as SwarmPane[];
  }

  /** Update pane fields */
  static updatePane(id: string, fields: Partial<Pick<SwarmPane, 'status' | 'currentTask' | 'pid' | 'gridX' | 'gridY' | 'gridW' | 'gridH'>>): void {
    const db = getDb();
    const sets: string[] = [];
    const vals: any[] = [];
    const keyMap: Record<string, string> = {
      status: 'status', currentTask: 'current_task', pid: 'pid',
      gridX: 'grid_x', gridY: 'grid_y', gridW: 'grid_w', gridH: 'grid_h'
    };
    for (const [k, v] of Object.entries(fields)) {
      const col = keyMap[k];
      if (col && v !== undefined) { sets.push(`${col} = ?`); vals.push(v); }
    }
    if (!sets.length) return;
    vals.push(new Date().toISOString(), id);
    db.prepare(`UPDATE swarm_panes SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`).run(...vals);
  }

  /** Remove a pane from a swarm */
  static removePane(id: string): void {
    const db = getDb();
    db.prepare('DELETE FROM swarm_panes WHERE id = ?').run(id);
  }

  /** Count panes per status in a swarm */
  static paneStatusSummary(swarmId: string): Record<string, number> {
    const db = getDb();
    const rows = db.prepare('SELECT status, COUNT(*) as c FROM swarm_panes WHERE swarm_id = ? GROUP BY status').all(swarmId) as any[];
    const summary: Record<string, number> = { idle: 0, running: 0, waiting: 0, error: 0, done: 0 };
    for (const r of rows) summary[r.status] = r.c;
    return summary;
  }
}
