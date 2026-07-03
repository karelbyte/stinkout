import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { dbRun, dbGet } from "./db";

const SESSION_COOKIE = "stinkout_session";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const computed = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(hash), Buffer.from(computed));
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: number): Promise<string> {
  const token = generateToken();
  await dbRun("INSERT INTO sessions (user_id, token) VALUES (?, ?)", userId, token);
  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await dbRun("DELETE FROM sessions WHERE token = ?", token);
}

export async function getCurrentUser(): Promise<{ id: number; name: string; email: string; role: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const session = await dbGet<{ id: number; name: string; email: string; role: string }>(
    `SELECT u.id, u.name, u.email, u.role
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token = ?`,
    token
  );

  return session || null;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "admin";
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
