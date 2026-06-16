// Agent Bridge Config — maps Hermes agent names to their gateway URLs
// Auto-discovered from running Hermes gateways on the NucBox.
// Extend with future DGX Spark nodes by adding entries here.

export interface BridgeAgent {
  name: string;
  label: string;
  gatewayUrl: string;
  modelProvider: string;
  description: string;
  capabilities: string[];
  node: "nucbox" | "dgx-spark-1" | "dgx-spark-2";
}

// Core agent registry. The Command Centre uses this to proxy requests
// to each running Hermes gateway.
export const BRIDGE_AGENTS: BridgeAgent[] = [
  {
    name: "nova",
    label: "Nova",
    gatewayUrl: "http://localhost:8650",
    modelProvider: "Qwen3 30B / DeepSeek V4 Flash",
    description: "Orchestrateur principal — coordination, code, recherches.",
    capabilities: ["orchestrateur", "code", "recherche", "devops", "routing"],
    node: "nucbox",
  },
  {
    name: "harmony",
    label: "Harmony",
    gatewayUrl: "http://localhost:8652",
    modelProvider: "DeepSeek V4 Flash",
    description: "Triage courriels Groupe CMI — classement, priorisation.",
    capabilities: ["email", "triage", "notifications"],
    node: "nucbox",
  },
  {
    name: "butcher",
    label: "Butcher",
    gatewayUrl: "http://localhost:8653",
    modelProvider: "DeepSeek V4 Flash",
    description: "Revue de code, audits, corrections — le critique.",
    capabilities: ["code-review", "audit", "qa"],
    node: "nucbox",
  },
  {
    name: "agent-47",
    label: "Agent 47",
    gatewayUrl: "http://localhost:8654",
    modelProvider: "Opus 4.8 / DeepSeek V4",
    description: "Expert IA/ML — fine-tuning, benchmarking, agents.",
    capabilities: ["mlops", "fine-tuning", "eval", "research"],
    node: "nucbox",
  },
  {
    name: "tobby",
    label: "Tobby",
    gatewayUrl: "http://localhost:8655",
    modelProvider: "DeepSeek V4 Flash",
    description: "Assistant MEP — ventilation, plomberie, électricité.",
    capabilities: ["mep", "hvac", "calculs", "dessins"],
    node: "nucbox",
  },
  {
    name: "zoe",
    label: "Zoe",
    gatewayUrl: "http://localhost:8656",
    modelProvider: "DeepSeek V4 Flash",
    description: "Créative — contenu, design, médias.",
    capabilities: ["creative", "design", "content", "media"],
    node: "nucbox",
  },
  {
    name: "walle",
    label: "Walle",
    gatewayUrl: "http://localhost:8657",
    modelProvider: "DeepSeek V4 Flash",
    description: "Automatisation — scripts, crons, pipelines.",
    capabilities: ["automation", "scripts", "devops", "cron"],
    node: "nucbox",
  },
];

export function getAgent(name: string): BridgeAgent | undefined {
  return BRIDGE_AGENTS.find((a) => a.name === name);
}

export function getAgentsByNode(node: string): BridgeAgent[] {
  return BRIDGE_AGENTS.filter((a) => a.node === node);
}
