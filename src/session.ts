import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE = "jev_auth";

export function sessionToken(password: string): string {
  return createHmac("sha256", password).update("jev-authorship-session-v1").digest("hex");
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (key) out[key] = part.slice(eq + 1).trim();
  }
  return out;
}

export function hasValidSession(cookieHeader: string | undefined, submitPassword: string): boolean {
  const token = parseCookies(cookieHeader)[AUTH_COOKIE];
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(sessionToken(submitPassword));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function passwordMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
