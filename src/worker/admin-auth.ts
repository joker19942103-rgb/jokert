import { getCookie } from "hono/cookie";

const ADMIN_CREDENTIALS = {
  email: "admin@kstv.com",
  password: "ks2025"
};

const ADMIN_SESSION_COOKIE = "admin_session_token";

export function generateSessionToken(): string {
  return crypto.randomUUID();
}

export async function createAdminSession(db: D1Database, email: string): Promise<string> {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.prepare(`
    INSERT INTO admin_sessions (admin_email, session_token, expires_at)
    VALUES (?, ?, ?)
  `).bind(email, sessionToken, expiresAt.toISOString()).run();

  return sessionToken;
}

export async function validateAdminSession(db: D1Database, sessionToken: string): Promise<boolean> {
  const session = await db.prepare(`
    SELECT * FROM admin_sessions 
    WHERE session_token = ? AND expires_at > datetime('now')
  `).bind(sessionToken).first();

  return !!session;
}

export async function deleteAdminSession(db: D1Database, sessionToken: string): Promise<void> {
  await db.prepare(`
    DELETE FROM admin_sessions WHERE session_token = ?
  `).bind(sessionToken).run();
}

export async function cleanExpiredSessions(db: D1Database): Promise<void> {
  await db.prepare(`
    DELETE FROM admin_sessions WHERE expires_at <= datetime('now')
  `).run();
}

export function validateAdminCredentials(email: string, password: string): boolean {
  return email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;
}

export async function adminAuthMiddleware(c: any, next: any) {
  const sessionToken = getCookie(c, ADMIN_SESSION_COOKIE);
  
  if (!sessionToken) {
    return c.json({ success: false, message: "Не авторизований" }, 401);
  }

  const isValid = await validateAdminSession(c.env.DB, sessionToken);
  
  if (!isValid) {
    return c.json({ success: false, message: "Сесія закінчилася" }, 401);
  }

  await next();
}
