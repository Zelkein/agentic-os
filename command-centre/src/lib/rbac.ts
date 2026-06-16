import { getDb } from "./db";

export type AccessLevel = "view" | "edit" | "admin";
export type Visibility = "private" | "team" | "public";

interface Agent {
  id: string;
  visibility: Visibility;
  created_by: string;
}

interface User {
  email: string;
  role: "admin" | "engineer";
}

/**
 * Check if user can view an agent
 * - Creator can always view
 * - Admin users can view any agent
 * - Team/public agents visible to all users
 * - Private agents visible only to creator or granted users
 */
export function canViewAgent(userEmail: string, agentId: string): boolean {
  const db = getDb();
  const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(agentId) as Agent | undefined;

  if (!agent) return false;

  // Creator always has access
  if (agent.created_by === userEmail) return true;

  // Public agents visible to everyone
  if (agent.visibility === "public") return true;

  // Team agents visible to all users (no additional check needed)
  if (agent.visibility === "team") return true;

  // Private agents: check if user has been granted access
  const access = db
    .prepare("SELECT * FROM agent_access WHERE agent_id = ? AND user_email = ?")
    .get(agentId, userEmail) as { access_level: AccessLevel } | undefined;

  return !!access;
}

/**
 * Check if user can edit an agent
 * - Creator can edit if they have edit/admin access
 * - Users with edit or admin access level can edit
 */
export function canEditAgent(userEmail: string, agentId: string): boolean {
  const db = getDb();
  const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(agentId) as Agent | undefined;

  if (!agent) return false;

  // Creator can edit their own agents
  if (agent.created_by === userEmail) return true;

  // Check explicit access level
  const access = db
    .prepare("SELECT access_level FROM agent_access WHERE agent_id = ? AND user_email = ?")
    .get(agentId, userEmail) as { access_level: AccessLevel } | undefined;

  return !!(access && (access.access_level === "edit" || access.access_level === "admin"));
}

/**
 * Check if user can delete an agent
 * - Creator can delete
 * - Users with admin access level can delete
 */
export function canDeleteAgent(userEmail: string, agentId: string): boolean {
  const db = getDb();
  const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(agentId) as Agent | undefined;

  if (!agent) return false;

  // Creator can delete
  if (agent.created_by === userEmail) return true;

  // Check admin access level
  const access = db
    .prepare("SELECT access_level FROM agent_access WHERE agent_id = ? AND user_email = ?")
    .get(agentId, userEmail) as { access_level: AccessLevel } | undefined;

  return !!(access && access.access_level === "admin");
}

/**
 * Check if user can create agents
 * - Engineers can create
 * - Admins can create
 */
export function canCreateAgent(userEmail: string): boolean {
  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(userEmail) as User | undefined;

  // If user doesn't exist in users table, deny (should be created on first login)
  if (!user) return false;

  return true; // Both engineers and admins can create agents
}

/**
 * Grant access to an agent for a user
 */
export function grantAccess(
  agentId: string,
  userEmail: string,
  level: AccessLevel
): void {
  const db = getDb();
  const id = require("crypto").randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT OR REPLACE INTO agent_access (id, agent_id, user_email, access_level, granted_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, agentId, userEmail, level, now);
}

/**
 * Revoke all access to an agent for a user
 */
export function revokeAccess(agentId: string, userEmail: string): void {
  const db = getDb();
  db.prepare("DELETE FROM agent_access WHERE agent_id = ? AND user_email = ?").run(
    agentId,
    userEmail
  );
}

/**
 * Get all agents visible to a user (filtered by RBAC)
 */
export function getVisibleAgents(userEmail: string): any[] {
  const db = getDb();

  // Get all agents where:
  // 1. User is creator, OR
  // 2. Agent is public/team, OR
  // 3. User has been granted access
  const agents = db
    .prepare(
      `
    SELECT DISTINCT a.* FROM agents a
    LEFT JOIN agent_access aa ON a.id = aa.agent_id AND aa.user_email = ?
    WHERE
      a.created_by = ?
      OR a.visibility = 'public'
      OR a.visibility = 'team'
      OR aa.user_email = ?
    ORDER BY a.created_at DESC
    `
    )
    .all(userEmail, userEmail, userEmail) as any[];

  return agents;
}

/**
 * Ensure user exists in users table (call on first login/request)
 */
export function ensureUserExists(userEmail: string, role: "admin" | "engineer" = "engineer"): void {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(userEmail);

  if (!existing) {
    const now = new Date().toISOString();
    db.prepare("INSERT INTO users (email, role, created_at) VALUES (?, ?, ?)").run(
      userEmail,
      role,
      now
    );
  }
}
