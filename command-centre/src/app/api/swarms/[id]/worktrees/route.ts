import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { SwarmEngine } from '@/lib/swarm/swarm-engine';
import type { SwarmWorktree } from '@/types/swarm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const swarm = SwarmEngine.getSwarm(id);

    if (!swarm) {
      return NextResponse.json({ error: 'Swarm not found' }, { status: 404 });
    }

    const db = getDb();
    const worktrees = db
      .prepare('SELECT * FROM swarm_worktrees WHERE swarm_id = ? ORDER BY created_at DESC')
      .all(id) as SwarmWorktree[];

    return NextResponse.json({ worktrees });
  } catch (error) {
    console.error('GET /api/swarms/[id]/worktrees error:', error);
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
    const { paneId, repoPath, branchName, worktreePath, baseBranch } = body;

    if (!paneId || !repoPath || !branchName || !worktreePath) {
      return NextResponse.json(
        { error: 'paneId, repoPath, branchName, and worktreePath are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const now = new Date().toISOString();
    const worktreeId = crypto.randomUUID();

    db.prepare(
      `INSERT INTO swarm_worktrees (id, swarm_id, pane_id, repo_path, branch_name, worktree_path, base_branch, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(worktreeId, id, paneId, repoPath, branchName, worktreePath, baseBranch || 'main', now);

    const worktree = db
      .prepare('SELECT * FROM swarm_worktrees WHERE id = ?')
      .get(worktreeId) as SwarmWorktree;

    return NextResponse.json(worktree, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
