import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "portfolio-admin-session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() ?? "";
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET?.trim() || getAdminPassword();
}

function createSignature(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function buildSessionToken(expiresAt: number) {
  const payload = `${expiresAt}`;
  return `${payload}.${createSignature(payload)}`;
}

function isValidSessionToken(token: string | undefined) {
  if (!token) {
    return false;
  }

  const [expiresAtValue, signature] = token.split(".");

  if (!expiresAtValue || !signature || !/^\d+$/.test(expiresAtValue)) {
    return false;
  }

  const expiresAt = Number(expiresAtValue);

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return false;
  }

  return safeEqual(signature, createSignature(expiresAtValue));
}

export function isAdminPasswordConfigured() {
  return Boolean(getAdminPassword());
}

export async function getAdminSessionState() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const configured = isAdminPasswordConfigured();

  return {
    configured,
    authenticated: configured && isValidSessionToken(token),
  };
}

export async function createAdminSession() {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + SESSION_TTL_MS;

  cookieStore.set(ADMIN_SESSION_COOKIE, buildSessionToken(expiresAt), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export function validateAdminPassword(candidate: string) {
  const password = getAdminPassword();

  if (!password) {
    return false;
  }

  return safeEqual(candidate.trim(), password);
}

export async function requireAdminSession() {
  const session = await getAdminSessionState();

  if (!session.configured) {
    return {
      ok: false as const,
      status: 503,
      message: "ADMIN_PASSWORD is not configured on the server.",
    };
  }

  if (!session.authenticated) {
    return {
      ok: false as const,
      status: 401,
      message: "Sign in with the admin password to continue.",
    };
  }

  return { ok: true as const };
}
