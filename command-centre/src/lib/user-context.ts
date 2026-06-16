import { NextRequest } from "next/server";

export interface UserContext {
  email: string;
  role: "admin" | "engineer";
}

/**
 * Extract user context from request headers or environment
 *
 * Priority:
 * 1. x-user-email header
 * 2. CLAUDE_USER_EMAIL environment variable
 * 3. Default to process.env.USER or error
 *
 * Defaults role to 'engineer' unless explicitly set in headers
 */
export function getUserContext(request: NextRequest): UserContext {
  // Try header first
  const headerEmail = request.headers.get("x-user-email");
  if (headerEmail) {
    const role = (request.headers.get("x-user-role") as "admin" | "engineer") || "engineer";
    return { email: headerEmail, role };
  }

  // Fall back to environment variable
  const envEmail = process.env.CLAUDE_USER_EMAIL;
  if (envEmail) {
    return { email: envEmail, role: "engineer" };
  }

  // Last resort: extract from USER env (Windows format: DOMAIN\user)
  const userEnv = process.env.USER || process.env.USERNAME || "";
  if (userEnv) {
    const email = userEnv.includes("\\") ? userEnv.split("\\")[1] : userEnv;
    return { email: `${email}@groupecmi.com`, role: "engineer" };
  }

  // If all else fails, throw error (should never happen in production)
  throw new Error("Unable to determine user context. Set x-user-email header or CLAUDE_USER_EMAIL env var.");
}

/**
 * Extract user context synchronously (for server-side code that doesn't have NextRequest)
 * Falls back to environment variables only
 */
export function getUserContextSync(): UserContext {
  const email = process.env.CLAUDE_USER_EMAIL;
  if (!email) {
    throw new Error("CLAUDE_USER_EMAIL environment variable not set");
  }

  return { email, role: "engineer" };
}

/**
 * Verify user context is valid (email format check)
 */
export function isValidUserContext(context: UserContext): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(context.email) && ["admin", "engineer"].includes(context.role);
}
