import { Request, Response, NextFunction } from 'express'; // or Next.js equivalent
import { db } from './db';

export interface UserContext {
  email: string;
  role: 'admin' | 'engineer' | 'lead';
  team_id?: string;
}

/**
 * Extract user context from request.
 * Try in order: x-user-email header → session cookie → OAuth token
 */
export async function extractUserContext(req: Request): Promise<UserContext> {
  // 1. Try header (set by client or proxy)
  let email = req.headers.get('x-user-email');

  // 2. Try session cookie
  if (!email && req.cookies) {
    const sessionId = req.cookies.get('session-id')?.value;
    if (sessionId) {
      const session = await db.query(
        'SELECT user_email FROM sessions WHERE id = ? AND expires_at > ?',
        [sessionId, new Date()]
      );
      email = session?.user_email;
    }
  }

  // 3. Try OAuth token (if implemented)
  if (!email && req.headers.authorization) {
    const token = req.headers.authorization.replace('Bearer ', '');
    // Validate token, extract email
    // (implementation depends on auth provider)
  }

  // 4. Fail if no user found
  if (!email) {
    throw new Error('401: User context not found. Set x-user-email header or establish session.');
  }

  // 5. Load user from database
  const user = await db.query(
    'SELECT email, role, team_id FROM users WHERE email = ?',
    [email]
  );

  if (!user) {
    // Auto-create user on first access (engineer role)
    await db.query(
      'INSERT INTO users (email, role, created_at) VALUES (?, ?, ?)',
      [email, 'engineer', new Date().toISOString()]
    );
    return { email, role: 'engineer' };
  }

  return {
    email: user.email,
    role: user.role,
    team_id: user.team_id
  };
}

/**
 * Middleware to extract and attach user to request
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    req.user = await extractUserContext(req);
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

/**
 * Type extension for express Request
 */
declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
    }
  }
}
