import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  AUTH_COOKIE_NAME,
  DEFAULT_REDIRECT_PATH,
  createSessionCookieValue,
  verifyPasswordAttempt,
  verifySessionCookieValue,
} from "@/lib/auth";

const PASSWORD_ENV_NAME = "CATHY_GARDEN_PASSWORD";
const SECRET_ENV_NAME = "CATHY_GARDEN_AUTH_SECRET";

function getConfiguredPassword() {
  return process.env[PASSWORD_ENV_NAME] ?? "";
}

function getConfiguredSecret() {
  return process.env[SECRET_ENV_NAME] ?? getConfiguredPassword();
}

export function isAuthConfigured() {
  return getConfiguredPassword().length > 0;
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const secret = getConfiguredSecret();

  if (!sessionCookie || !secret) {
    return false;
  }

  return verifySessionCookieValue(sessionCookie, secret);
}

export async function requireAuthenticatedSession() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/login");
  }
}

export async function establishAuthenticatedSession() {
  const cookieStore = await cookies();
  const secret = getConfiguredSecret();

  cookieStore.set({
    name: AUTH_COOKIE_NAME,
    value: createSessionCookieValue(secret),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthenticatedSession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export function validateLoginAttempt(password: string) {
  const expectedPassword = getConfiguredPassword();

  if (!expectedPassword) {
    return {
      ok: false,
      reason: "not-configured" as const,
    };
  }

  if (!verifyPasswordAttempt(password, expectedPassword)) {
    return {
      ok: false,
      reason: "invalid-password" as const,
    };
  }

  return {
    ok: true as const,
    redirectTo: DEFAULT_REDIRECT_PATH,
  };
}
