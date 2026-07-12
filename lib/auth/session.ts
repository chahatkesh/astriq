import { createHmac, timingSafeEqual } from "node:crypto";
import { getAuthSessionSecret } from "@/lib/env";

export const AUTH_SESSION_COOKIE_NAME = "birth_chart_session";
export const AUTH_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type SessionPayload = {
  userId: string;
  expiresAt: number;
};

export function createSessionToken(
  userId: string,
  options?: { nowMs?: number; ttlSeconds?: number },
) {
  const nowMs = options?.nowMs ?? Date.now();
  const ttlSeconds = options?.ttlSeconds ?? AUTH_SESSION_TTL_SECONDS;
  const expiresAt = nowMs + ttlSeconds * 1000;
  const payload = `${userId}.${expiresAt.toString()}`;
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

export function readSessionToken(
  token: string | undefined | null,
): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [userId, expiresAtRaw, signature] = token.split(".");
  if (!userId || !expiresAtRaw || !signature) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return null;
  }

  const payload = `${userId}.${expiresAtRaw}`;
  const expected = signPayload(payload);

  if (!safeEqual(expected, signature)) {
    return null;
  }

  return { userId, expiresAt };
}

export function getSessionUserIdFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return null;
  }

  const escapedName = AUTH_SESSION_COOKIE_NAME.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
  const matcher = new RegExp(`(?:^|; )${escapedName}=([^;]+)`);
  const match = matcher.exec(cookieHeader);

  if (!match?.[1]) {
    return null;
  }

  const decoded = decodeURIComponent(match[1]);
  return readSessionToken(decoded)?.userId ?? null;
}

function signPayload(payload: string) {
  return createHmac("sha256", getAuthSessionSecret())
    .update(payload)
    .digest("base64url");
}

function safeEqual(a: string, b: string) {
  const first = Buffer.from(a);
  const second = Buffer.from(b);

  if (first.length !== second.length) {
    return false;
  }

  return timingSafeEqual(first, second);
}
