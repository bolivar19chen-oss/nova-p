import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// In production set a real secret via the JWT_SECRET env var. This
// fallback is fine for local/demo use but you MUST change it before
// handling real user data publicly.
const DEV_FALLBACK_SECRET = "pet-nova-dev-secret-change-me";
const envSecret = process.env.JWT_SECRET;

if (process.env.NODE_ENV === "production") {
  if (!envSecret || envSecret === DEV_FALLBACK_SECRET) {
    throw new Error(
      "JWT_SECRET no está definido (o usa el valor de ejemplo del repo). " +
        "Configurá una variable de entorno JWT_SECRET real antes de arrancar en producción."
    );
  }
} else if (!envSecret) {
  console.warn(
    "[auth] JWT_SECRET no definido - usando secreto de desarrollo. No uses esto en producción."
  );
}

const JWT_SECRET = envSecret || DEV_FALLBACK_SECRET;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && EMAIL_REGEX.test(email);
}

// Minimum password length for new registrations. 8 chars balances
// usability with brute-force resistance (NIST SP 800-63B baseline).
export const MIN_PASSWORD_LENGTH = 8;

// In-memory login rate limiting, keyed by normalized email. Simple and
// dependency-free; resets on server restart, which is fine for a
// small/single-process app. Keyed by email (not IP) because the goal is
// to slow down credential-stuffing against one account regardless of
// how many IPs the attacker rotates through.
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const loginAttempts = new Map<string, { count: number; firstAttempt: number; lockedUntil: number | null }>();

export function isLoginLocked(key: string): boolean {
  const rec = loginAttempts.get(key);
  if (!rec || !rec.lockedUntil) return false;
  if (Date.now() >= rec.lockedUntil) {
    loginAttempts.delete(key);
    return false;
  }
  return true;
}

export function recordFailedLogin(key: string) {
  const now = Date.now();
  const rec = loginAttempts.get(key);
  if (!rec || now - rec.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now, lockedUntil: null });
    return;
  }
  rec.count++;
  if (rec.count >= MAX_LOGIN_ATTEMPTS) {
    rec.lockedUntil = now + LOGIN_WINDOW_MS;
  }
}

export function clearLoginAttempts(key: string) {
  loginAttempts.delete(key);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

export interface AuthedRequest extends Request {
  userId?: string;
}

// Optional auth: if a valid token is present, attaches req.userId.
// Does NOT block the request if missing/invalid — most endpoints in
// this demo stay open so the app keeps working without login. Add
// `requireAuth` instead on any route you want to lock down.
export function attachUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET) as { userId: string };
      req.userId = payload.userId;
    } catch {
      /* invalid/expired token — treat as anonymous */
    }
  }
  next();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.userId) return res.status(401).json({ error: "Debes iniciar sesión" });
  next();
}
