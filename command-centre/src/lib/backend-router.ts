/**
 * Backend Router — provider-agnostic task execution abstraction.
 *
 * Routes task execution to the appropriate backend based on the model/provider:
 *   - anthropic models (opus, sonnet, haiku) → Claude CLI (via process-manager)
 *   - deepseek models → internal API proxy → DeepSeek API
 *   - siliconflow/glm models → internal API proxy → SiliconFlow API
 *   - kilo models → Kilo gateway
 *
 * Usage:
 *   import { backendRouter } from "@/lib/backend-router";
 *   const backend = backendRouter.resolve(model, process.env.BACKEND_MODE);
 *   if (backend.type === "claude-cli") { ... spawn claude ... }
 *   if (backend.type === "api-proxy") { ... route through proxy ... }
 *   if (backend.type === "kilo-gateway") { ... call Kilo ... }
 */

export type BackendType = "claude-cli" | "api-proxy" | "kilo-gateway";

export interface BackendRoute {
  type: BackendType;
  /** Model alias to pass to the CLI (only for claude-cli backend) */
  cliModelAlias?: string;
  /** Provider config for api-proxy backend */
  proxyConfig?: {
    target: string;
    apiKeyEnv: string;
    targetModel: string;
    port: number;
  };
}

/** Anthropic-native model IDs (routed through Claude CLI directly) */
const ANTHROPIC_MODELS = new Set(["opus", "sonnet", "haiku", "vision"]);

/** Models routed through the DeepSeek API proxy */
const DEEPSEEK_MODELS: Record<string, { targetModel: string }> = {
  "deepseek-v4-flash": { targetModel: "deepseek-chat" },
  "deepseek-v4-pro":   { targetModel: "deepseek-chat" },
  "deepseek-chat":     { targetModel: "deepseek-chat" },
  "deepseek-coder":    { targetModel: "deepseek-coder" },
  "deepseek-reasoner": { targetModel: "deepseek-reasoner" },
};

/** Models routed through the SiliconFlow API proxy */
const SILICONFLOW_MODELS: Record<string, { targetModel: string }> = {
  "glm-4-7-flash": { targetModel: "zai-org/GLM-4.7-Flash" },
};

/** Models routable through Kilo gateway */
const KILO_MODELS = new Set<string>(["kilo"]);

/**
 * Resolve which backend to use for a given model ID.
 * Accepts optional backendMode override (from process.env.BACKEND_MODE).
 */
export function resolveBackendRoute(
  model: string | null,
  backendMode?: string,
): BackendRoute {
  // BACKEND_MODE=kilo overrides everything
  if (backendMode === "kilo") {
    return { type: "kilo-gateway", cliModelAlias: model ?? undefined };
  }

  if (!model) {
    return { type: "claude-cli", cliModelAlias: "sonnet" };
  }

  // Vision model → Claude Sonnet (supports image input)
  if (model === "vision") {
    return { type: "claude-cli", cliModelAlias: "sonnet" };
  }

  // Anthropic models → Claude CLI directly
  if (ANTHROPIC_MODELS.has(model)) {
    return { type: "claude-cli", cliModelAlias: model };
  }

  // DeepSeek models → API proxy
  const dsConfig = DEEPSEEK_MODELS[model];
  if (dsConfig) {
    return {
      type: "api-proxy",
      cliModelAlias: "claude-sonnet-4-6",
      proxyConfig: {
        target: "https://api.deepseek.com/v1",
        apiKeyEnv: "DEEPSEEK_API_KEY",
        targetModel: dsConfig.targetModel,
        port: 9393,
      },
    };
  }

  // SiliconFlow models → API proxy
  const sfConfig = SILICONFLOW_MODELS[model];
  if (sfConfig) {
    return {
      type: "api-proxy",
      cliModelAlias: "claude-sonnet-4-6",
      proxyConfig: {
        target: "https://api.siliconflow.cn/v1",
        apiKeyEnv: "SILICONFLOW_API_KEY",
        targetModel: sfConfig.targetModel,
        port: 9393,
      },
    };
  }

  // Kilo gateway models
  if (KILO_MODELS.has(model)) {
    return { type: "kilo-gateway", cliModelAlias: model };
  }

  // Unknown model — fall back to Claude CLI with sonnet
  console.warn(`[backend-router] Unknown model "${model}", falling back to claude-cli/sonnet`);
  return { type: "claude-cli", cliModelAlias: "sonnet" };
}

export const backendRouter = {
  resolve(model: string | null, backendMode?: string): BackendRoute {
    return resolveBackendRoute(model, backendMode);
  },

  isAnthropic(model: string | null): boolean {
    return model !== null && ANTHROPIC_MODELS.has(model);
  },

  requiresProxy(model: string | null): boolean {
    if (!model) return false;
    return model in DEEPSEEK_MODELS || model in SILICONFLOW_MODELS;
  },

  listAllModels(): string[] {
    return [
      ...ANTHROPIC_MODELS,
      ...Object.keys(DEEPSEEK_MODELS),
      ...Object.keys(SILICONFLOW_MODELS),
      ...KILO_MODELS,
    ];
  },
};
