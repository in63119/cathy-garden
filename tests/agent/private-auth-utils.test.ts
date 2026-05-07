import {
  AUTH_COOKIE_NAME,
  DEFAULT_REDIRECT_PATH,
  createSessionCookieValue,
  getSafeRedirectPath,
  isProtectedPath,
  verifyPasswordAttempt,
  verifySessionCookieValue,
} from "../../lib/auth";

describe("private auth helpers", () => {
  test("marks the protected archive routes correctly", () => {
    expect(isProtectedPath("/library")).toBe(true);
    expect(isProtectedPath("/library/spring")).toBe(true);
    expect(isProtectedPath("/upload")).toBe(true);
    expect(isProtectedPath("/media/sample")).toBe(true);
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
  });

  test("keeps redirects on safe internal paths only", () => {
    expect(getSafeRedirectPath("/upload")).toBe("/upload");
    expect(getSafeRedirectPath("/media/sample")).toBe("/media/sample");
    expect(getSafeRedirectPath("/login")).toBe(DEFAULT_REDIRECT_PATH);
    expect(getSafeRedirectPath("https://example.com")).toBe(
      DEFAULT_REDIRECT_PATH
    );
    expect(getSafeRedirectPath("//evil.test")).toBe(DEFAULT_REDIRECT_PATH);
    expect(getSafeRedirectPath()).toBe(DEFAULT_REDIRECT_PATH);
  });

  test("creates and verifies a deterministic session cookie value", () => {
    const secret = "garden-secret";
    const cookieValue = createSessionCookieValue(secret);

    expect(cookieValue).toHaveLength(64);
    expect(verifySessionCookieValue(cookieValue, secret)).toBe(true);
    expect(verifySessionCookieValue(cookieValue, "different-secret")).toBe(
      false
    );
    expect(AUTH_COOKIE_NAME).toBe("cathy-garden-session");
  });

  test("uses constant-time password comparison helpers", () => {
    expect(verifyPasswordAttempt("rose-bush", "rose-bush")).toBe(true);
    expect(verifyPasswordAttempt("rose-bush", "rose-bush-2")).toBe(false);
    expect(verifyPasswordAttempt("short", "longer")).toBe(false);
  });
});
