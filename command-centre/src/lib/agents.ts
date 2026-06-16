import { getDb } from "./db";

export interface Agent {
  id: string;
  name: string;
  role: string;
  system_prompt: string;
  context: string | null;
  skills_json: string;
  workflows_json: string;
  llm_provider: string;
  llm_model: string;
  owner_email: string | null;
  created_at: string;
  updated_at: string;
  is_template: number;
}

/**
 * Get an agent by its ID
 */
export async function getAgentById(id: string): Promise<Agent | null> {
  const db = getDb();
  const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(id) as Agent | undefined;
  return agent ?? null;
}