import { getDb } from './db';

export interface MEPContext {
  project_id: string;
  current_phase: 'coordination' | 'calculation' | 'drawing' | 'complete';
  completed_phases: string[];
  next_milestone_date?: string;
  active_team_members: string[];
}

export interface ProjectContextRecord {
  project_id: string;
  current_phase: string;
  updated_at: string;
  updated_by: string;
}

/**
 * Get MEP context for a project
 * Loads from database (project_context table)
 */
export function getMEPContext(projectId: string): MEPContext {
  const db = getDb();

  // Load project context from database
  const context = db
    .prepare('SELECT * FROM project_context WHERE project_id = ?')
    .get(projectId) as ProjectContextRecord | undefined;

  const currentPhase = (context?.current_phase || 'coordination') as 'coordination' | 'calculation' | 'drawing' | 'complete';

  // Derive completed phases from current phase
  const phases = ['coordination', 'calculation', 'drawing', 'complete'];
  const phaseIndex = phases.indexOf(currentPhase);
  const completedPhases = phases.slice(0, phaseIndex);

  // Load active team members (users with access to agents on this project)
  const teamMembers = db
    .prepare(
      `
      SELECT DISTINCT aa.user_email
      FROM agent_access aa
      JOIN agents a ON aa.agent_id = a.id
      WHERE a.id IN (
        SELECT agent_id FROM agent_deployments WHERE project_id = ?
      )
      `
    )
    .all(projectId) as Array<{ user_email: string }> | undefined;

  return {
    project_id: projectId,
    current_phase: currentPhase,
    completed_phases: completedPhases,
    active_team_members: teamMembers?.map(m => m.user_email) || []
  };
}

/**
 * Update MEP phase for a project
 */
export function updateMEPPhase(
  projectId: string,
  newPhase: 'coordination' | 'calculation' | 'drawing' | 'complete',
  updatedBy: string
): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(
    `
    INSERT OR REPLACE INTO project_context (project_id, current_phase, updated_at, updated_by)
    VALUES (?, ?, ?, ?)
    `
  ).run(projectId, newPhase, now, updatedBy);
}

/**
 * Get session context for a project
 * Loads decisions, blockers, and assumptions from latest session
 */
export function getSessionContext(projectId: string): any {
  const db = getDb();

  const context = db
    .prepare(
      `
      SELECT sc.id, sc.decisions, sc.blockers, sc.assumptions
      FROM session_contexts sc
      WHERE sc.project_id = ?
      ORDER BY sc.updated_at DESC
      LIMIT 1
      `
    )
    .get(projectId) as any | undefined;

  if (!context) {
    return null;
  }

  return {
    id: context.id,
    decisions: context.decisions ? JSON.parse(context.decisions) : [],
    blockers: context.blockers ? JSON.parse(context.blockers) : [],
    assumptions: context.assumptions ? JSON.parse(context.assumptions) : []
  };
}

/**
 * Record a decision in the session context
 */
export function recordDecision(projectId: string, decision: any): void {
  const db = getDb();
  const context = getSessionContext(projectId);
  const decisions = context?.decisions || [];
  decisions.push(decision);

  const contextId = context?.id || require('crypto').randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `
    INSERT OR REPLACE INTO session_contexts (id, project_id, decisions, updated_at)
    VALUES (?, ?, ?, ?)
    `
  ).run(contextId, projectId, JSON.stringify(decisions), now);
}

/**
 * Record a blocker in the session context
 */
export function recordBlocker(projectId: string, blocker: any): void {
  const db = getDb();
  const context = getSessionContext(projectId);
  const blockers = context?.blockers || [];
  blockers.push(blocker);

  const contextId = context?.id || require('crypto').randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `
    INSERT OR REPLACE INTO session_contexts (id, project_id, blockers, updated_at)
    VALUES (?, ?, ?, ?)
    `
  ).run(contextId, projectId, JSON.stringify(blockers), now);
}

/**
 * Check if a phase transition is allowed
 */
export function canTransitionPhase(
  projectId: string,
  newPhase: 'coordination' | 'calculation' | 'drawing' | 'complete'
): { allowed: boolean; reason?: string } {
  const context = getMEPContext(projectId);
  const phases = ['coordination', 'calculation', 'drawing', 'complete'];
  const currentIndex = phases.indexOf(context.current_phase);
  const newIndex = phases.indexOf(newPhase);

  // Can only move forward or stay in same phase
  if (newIndex < currentIndex) {
    return {
      allowed: false,
      reason: `Cannot move backward from ${context.current_phase} to ${newPhase}`
    };
  }

  // Additional validation per phase
  if (newPhase === 'calculation') {
    // Check coordination is complete (would be enforced by mep-checklist-validation skill)
    return { allowed: true };
  }

  if (newPhase === 'drawing') {
    // Check calculation is complete
    return { allowed: true };
  }

  return { allowed: true };
}
