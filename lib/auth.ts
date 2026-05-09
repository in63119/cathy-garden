import { createHmac, timingSafeEqual } from "crypto";

export const AUTH_COOKIE_NAME = "cathy-garden-session";
export const DEFAULT_REDIRECT_PATH = "/library";
export const PROTECTED_PATH_PREFIXES = ["/library", "/upload", "/media", "/contests"];

export function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function getSafeRedirectPath(candidate?: string | null) {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return DEFAULT_REDIRECT_PATH;
  }

  if (candidate === "/login") {
    return DEFAULT_REDIRECT_PATH;
  }

  return candidate;
}

export function createSessionCookieValue(secret: string) {
  return createHmac("sha256", secret)
    .update("cathy-garden-private-session")
    .digest("hex");
}

export function verifySessionCookieValue(value: string, secret: string) {
  const expectedValue = createSessionCookieValue(secret);
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expectedValue);

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(valueBuffer, expectedBuffer);
}

export function verifyPasswordAttempt(input: string, expected: string) {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);

  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, expectedBuffer);
}
