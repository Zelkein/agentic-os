import { getDb } from './db';

export interface SkillDefinition {
  name: string;
  inputs: Record<string, string>;
  outputs: Record<string, string>;
  triggers?: string[];
}

export interface SkillInvocationRequest {
  agent_id: string;
  skill_name: string;
  inputs: Record<string, any>;
}

export interface SkillInvocationResult {
  id: string;
  status: 'success' | 'failed' | 'timeout';
  outputs: Record<string, any>;
  error_message?: string;
  invoked_at: string;
  completed_at: string;
}

/**
 * Load skill definition from .agents/skills/{skill_name}/SKILL.md
 */
export async function loadSkillDefinition(skillName: string): Promise<SkillDefinition | null> {
  // In production, this would read from .agents/skills/{skillName}/SKILL.md
  // Parse YAML frontmatter to extract name, inputs, outputs, triggers

  // For now, return null (skill definitions are in SKILL.md files)
  // This function would be implemented in Week 5 skill loader
  return null;
}

/**
 * Invoke a skill from an agent
 */
export async function invokeSkill(
  request: SkillInvocationRequest,
  timeout: number = 30000
): Promise<SkillInvocationResult> {
  const db = getDb();
  const invocationId = `skill_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const invokedAt = new Date().toISOString();

  try {
    // 1. Record invocation start
    db.prepare(
      `INSERT INTO skill_invocations (id, agent_id, skill_name, inputs, status, invoked_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      invocationId,
      request.agent_id,
      request.skill_name,
      JSON.stringify(request.inputs),
      'pending',
      invokedAt
    );

    // 2. Invoke skill (would be implemented in Week 5)
    // This is a placeholder - actual implementation would call the skill
    const skillOutputs = await executeSkill(request.skill_name, request.inputs, timeout);

    // 3. Record success
    const completedAt = new Date().toISOString();
    db.prepare(
      `UPDATE skill_invocations
       SET status = ?, outputs = ?, completed_at = ?
       WHERE id = ?`
    ).run('success', JSON.stringify(skillOutputs), completedAt, invocationId);

    return {
      id: invocationId,
      status: 'success',
      outputs: skillOutputs,
      invoked_at: invokedAt,
      completed_at: completedAt
    };
  } catch (error) {
    const completedAt = new Date().toISOString();
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Record failure
    db.prepare(
      `UPDATE skill_invocations
       SET status = ?, error_message = ?, completed_at = ?
       WHERE id = ?`
    ).run('failed', errorMsg, completedAt, invocationId);

    throw error;
  }
}

/**
 * Execute a skill (placeholder - would be implemented in Week 5)
 * In production, this would:
 * - Load skill definition from SKILL.md
 * - Validate inputs against schema
 * - Execute skill logic (could be DB queries, API calls, etc.)
 * - Return outputs
 */
async function executeSkill(
  skillName: string,
  inputs: Record<string, any>,
  timeout: number
): Promise<Record<string, any>> {
  // Placeholder implementation
  // Week 5 would implement actual skill execution

  switch (skillName) {
    case 'mep-checklist-validation':
      // Would load and execute mep-checklist-validation skill
      return {
        status: 'success',
        can_proceed: false,
        blocked_by: ['Coordination not complete']
      };

    case 'excel-template-management':
      // Would load and execute excel-template-management skill
      return {
        status: 'success',
        template_loaded: true
      };

    default:
      throw new Error(`Unknown skill: ${skillName}`);
  }
}

/**
 * Get invocation history for an agent
 */
export function getInvocationHistory(agentId: string, limit: number = 20): SkillInvocationResult[] {
  const db = getDb();

  const invocations = db
    .prepare(
      `SELECT id, status, outputs, error_message, invoked_at, completed_at
       FROM skill_invocations
       WHERE agent_id = ?
       ORDER BY invoked_at DESC
       LIMIT ?`
    )
    .all(agentId, limit) as any[];

  return invocations.map(inv => ({
    id: inv.id,
    status: inv.status,
    outputs: inv.outputs ? JSON.parse(inv.outputs) : {},
    error_message: inv.error_message,
    invoked_at: inv.invoked_at,
    completed_at: inv.completed_at
  }));
}

/**
 * Check if skill execution was successful
 */
export function wasSkillSuccessful(invocationId: string): boolean {
  const db = getDb();
  const result = db
    .prepare('SELECT status FROM skill_invocations WHERE id = ?')
    .get(invocationId) as { status: string } | undefined;

  return result?.status === 'success';
}
