import { getDb } from "./db";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Simple LRU cache for agent system prompts
 * TTL: 1 hour
 * Max size: 100 agents
 */
class AgentCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = 100;
  private ttlMs: number = 60 * 60 * 1000; // 1 hour

  /**
   * Get agent system prompt from cache or database
   */
  getAgentPrompt(agentId: string): string | null {
    const cached = this.cache.get(agentId);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    // Cache miss or expired, remove from cache
    if (cached) {
      this.cache.delete(agentId);
    }

    // Fetch from database
    const db = getDb();
    const agent = db
      .prepare("SELECT system_prompt FROM agents WHERE id = ?")
      .get(agentId) as { system_prompt: string | null } | undefined;

    if (!agent || !agent.system_prompt) {
      return null;
    }

    // Store in cache
    this.set(agentId, agent.system_prompt);
    return agent.system_prompt;
  }

  /**
   * Set cache entry
   */
  private set(key: string, value: any): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  /**
   * Invalidate cache entry for an agent
   */
  invalidate(agentId: string): void {
    this.cache.delete(agentId);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; maxSize: number } {
    return { size: this.cache.size, maxSize: this.maxSize };
  }
}

// Singleton instance
export const agentCache = new AgentCache();

/**
 * Get agent system prompt with caching
 */
export function getAgentSystemPrompt(agentId: string): string | null {
  return agentCache.getAgentPrompt(agentId);
}

/**
 * Invalidate cache when agent is updated
 */
export function invalidateAgentCache(agentId: string): void {
  agentCache.invalidate(agentId);
}

/**
 * Clear all agent caches
 */
export function clearAgentCache(): void {
  agentCache.clear();
}
