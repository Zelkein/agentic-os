/**
 * LLM Token Cost Calculator
 * Calculates USD cost based on provider, model, and token counts
 */

// Pricing per 1K tokens (prompt / completion)
// Source: Official pricing as of May 2026
const PRICING: Record<string, Record<string, { prompt: number; completion: number }>> = {
  claude: {
    "claude-opus-4": {
      prompt: 0.015,
      completion: 0.045,
    },
    "claude-3.5-sonnet": {
      prompt: 0.003,
      completion: 0.015,
    },
    "claude-3.5-haiku": {
      prompt: 0.00080,
      completion: 0.004,
    },
  },
  deepseek: {
    "deepseek-v3": {
      prompt: 0.0006,
      completion: 0.0024,
    },
    "deepseek-v4-flash": {
      prompt: 0.00014,
      completion: 0.00056,
    },
  },
  perplexity: {
    "sonar-pro": {
      prompt: 0.003,
      completion: 0.015,
    },
    "sonar": {
      prompt: 0.001,
      completion: 0.005,
    },
  },
  kimi: {
    "kimi-2025-01-21": {
      prompt: 0.001,
      completion: 0.005,
    },
  },
  minimax: {
    "gpt4-turbo": {
      prompt: 0.001,
      completion: 0.005,
    },
  },
  "z-ai": {
    "zephyr-7b": {
      prompt: 0.0005,
      completion: 0.0005,
    },
  },
  ollama: {
    // Local model - no cost
    default: {
      prompt: 0,
      completion: 0,
    },
  },
  vision: {
    // Vision model - may have different pricing
    default: {
      prompt: 0.01,
      completion: 0.03,
    },
  },
};

/**
 * Calculate USD cost for LLM API call
 * Returns 0 for unknown providers/models or local models
 */
export function calculateTokenCost(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const providerPricing = PRICING[provider];
  if (!providerPricing) {
    console.warn(`Unknown provider: ${provider}, assuming cost of $0`);
    return 0;
  }

  // Try exact model match first, then fall back to default
  let rates = providerPricing[model];
  if (!rates) {
    rates = providerPricing["default"];
    if (!rates) {
      console.warn(`Unknown model ${model} for provider ${provider}`);
      return 0;
    }
  }

  // Calculate cost: (tokens / 1000) * (rate per 1K tokens)
  const promptCost = (promptTokens / 1000) * rates.prompt;
  const completionCost = (completionTokens / 1000) * rates.completion;

  // Round to 4 decimal places
  return Math.round((promptCost + completionCost) * 10000) / 10000;
}

/**
 * Get pricing info for a model
 */
export function getPricingInfo(provider: string, model: string) {
  const providerPricing = PRICING[provider];
  if (!providerPricing) {
    return null;
  }

  const rates = providerPricing[model] || providerPricing["default"];
  if (!rates) {
    return null;
  }

  return {
    provider,
    model,
    promptCostPer1k: rates.prompt,
    completionCostPer1k: rates.completion,
  };
}

/**
 * Estimate cost for a prompt before making the call
 * Uses rough token estimation: 1 token ≈ 4 characters
 */
export function estimateCost(
  provider: string,
  model: string,
  promptText: string,
  estimatedResponseTokens: number = 500
): number {
  // Estimate prompt tokens: ~1 token per 4 characters
  const estimatedPromptTokens = Math.ceil(promptText.length / 4);

  return calculateTokenCost(
    provider,
    model,
    estimatedPromptTokens,
    estimatedResponseTokens
  );
}
