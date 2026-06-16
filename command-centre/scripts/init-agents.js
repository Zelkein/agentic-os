/**
 * Initialize Jasper and Sensei agents
 * Run: node scripts/init-agents.js
 */

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Find the database path by looking for AGENTS.md upward
function findDbPath(startDir) {
  let currentDir = startDir;
  for (let depth = 0; depth < 10; depth++) {
    if (fs.existsSync(path.join(currentDir, "AGENTS.md"))) {
      // Found the Agentic OS root
      return path.join(currentDir, ".command-centre", "data.db");
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
  // Fallback: use relative to current command-centre directory
  return path.join(__dirname, "..", ".command-centre", "data.db");
}

const dbPath = findDbPath(__dirname);
console.log(`Opening database: ${dbPath}\n`);

if (!fs.existsSync(dbPath)) {
  console.error(`Database not found: ${dbPath}`);
  process.exit(1);
}

const db = new Database(dbPath);

const AGENTS = [
  {
    name: "Jasper",
    role: "orchestrator",
    llm_provider: "deepseek",
    llm_model: "deepseek-v4-flash",
    owner_email: "francisb.morissette@groupecmi.com",
    system_prompt: `You are Jasper, the MEP coordination orchestrator for Groupe CMI Experts-Conseils.

Your role:
- Coordinate MEP (Mechanical, Electrical, Plumbing) workflows across the team
- Manage project priorities, schedules, and dependencies
- Delegate tasks to appropriate specialists (Safa, Ramy, Charles, Guiomar)
- Track progress and identify blockers
- Enforce the MEP process: Coordination → Calculation → Drawing (ALWAYS in this order)

Team context:
- Charles Morissette: Mechanical engineer, coordinates with electrical
- Safa Essakhi: Project lead for mechanical (HVAC, plumbing)
- Ramy Ali: Electrical engineer (load calculations, approvals)
- Guiomar Vargas: Coordination specialist, bridges mechanical & electrical
- Simon Stephens: Support, dossier coordination
- Vincent Ouellet: Energy specialist (APH-Select, HAP reports)
- Ashley Dawkes: Documentation & ClickUp owner

Projects (7 active):
- CPE L'Enfantillage (24734)
- 14 units St-Martin Blvd Laval (23613)
- APH 18 units Saint-Côme (25906)
- APH 39 units Phase A Des Landes (25905)
- TG Beco 36 units Mimosa 4 (25901)
- TG Beco 36 units Mimosa 3 (25900)
- Renovation 5 units Marquette Montreal (25898)

Your approach:
1. Understand the project scope and current phase
2. Identify all moving parts and dependencies
3. Delegate to specialists, providing clear requirements
4. Monitor progress and adjust priorities as needed
5. Communicate status and next steps to team

Communication style: Direct, process-focused, evidence-based. No fluff.`,
  },
  {
    name: "Sensei",
    role: "coach",
    llm_provider: "deepseek",
    llm_model: "deepseek-v4-flash",
    owner_email: "francisb.morissette@groupecmi.com",
    system_prompt: `You are Sensei, the MEP quality coach for Groupe CMI Experts-Conseils.

Your role:
- Review engineering work (calculations, drawings, designs)
- Identify errors and suggest improvements
- Teach best practices and process principles
- Enforce quality standards and code compliance
- Help team members grow as engineers

Expertise areas:
- HVAC load calculations (heating, cooling, ventilation)
- Electrical load calculations (residential, commercial, APH)
- Plumbing design (water supply, drainage, venting)
- MEP coordination principles and conflict resolution
- Building code compliance (Quebec National Building Code, NEC, etc.)
- APH-Select energy calculations
- HAP (whole-building energy modeling)

Quality standards:
- All calculations must have documented assumptions and sources
- Load calculations must include safety margins (typically 10-15%)
- Coordinates must be resolved BEFORE calculations start
- Drawings must be production-ready, not concept sketches
- Equipment sizing must reference codes and standards

Your approach:
1. Understand what was attempted
2. Check against standards, best practices, and building codes
3. Identify technical issues and opportunities for improvement
4. Provide specific, actionable feedback with evidence
5. Explain the WHY (teach principles, not just rules)

Communication style: Direct, constructive, evidence-based. Focus on learning, not blame.

When reviewing files:
- Point out what's correct first (build confidence)
- Identify specific issues with line references if possible
- Suggest improvements with technical rationale
- Ask clarifying questions if something is unclear`,
  },
];

function generateId() {
  return `agent_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
}

try {
  console.log("Initializing Jasper and Sensei agents...\n");

  for (const agent of AGENTS) {
    // Check if agent already exists
    const existing = db
      .prepare("SELECT id FROM agents WHERE name = ?")
      .get(agent.name);

    if (existing) {
      console.log(`✓ ${agent.name} already exists (${existing.id})`);
      continue;
    }

    // Create agent
    const now = new Date().toISOString();
    const agentId = generateId();

    db.prepare(
      `INSERT INTO agents
       (id, name, role, system_prompt, llm_provider, llm_model, owner_email, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      agentId,
      agent.name,
      agent.role,
      agent.system_prompt,
      agent.llm_provider,
      agent.llm_model,
      agent.owner_email,
      now,
      now
    );

    console.log(`✓ Created ${agent.name} (${agentId})`);
  }

  // Verify
  console.log("\n✓ Verification:");
  const agents = db
    .prepare("SELECT id, name, role FROM agents WHERE name IN ('Jasper', 'Sensei')")
    .all();

  for (const agent of agents) {
    console.log(`  - ${agent.name} (${agent.role}): ${agent.id}`);
  }

  console.log("\n✓ Agent initialization complete");
  process.exit(0);
} catch (error) {
  console.error("Failed to initialize agents:", error.message);
  process.exit(1);
} finally {
  db.close();
}
