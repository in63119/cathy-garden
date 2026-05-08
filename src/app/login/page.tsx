import { redirect } from "next/navigation";

import { SectionCard } from "@/components/section-card";
import {
  isAuthConfigured,
  isAuthenticated,
  isKakaoAuthConfigured,
} from "@/lib/auth-server";
import { DEFAULT_REDIRECT_PATH, getSafeRedirectPath } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "invalid-password": "The private access code did not match.",
  "kakao-invalid-state": "The Kakao login session expired. Please try again.",
  "kakao-login-failed": "Kakao login could not be completed.",
  "kakao-not-configured": "Kakao login is not configured yet.",
  "kakao-user-not-allowed": "This Kakao account is not allowed for this archive.",
  "not-configured":
    "This site does not have a private password configured yet.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await isAuthenticated()) {
    redirect(DEFAULT_REDIRECT_PATH);
  }

  const params = searchParams ? await searchParams : undefined;
  const nextPath = getSafeRedirectPath(params?.next);
  const errorMessage = params?.error ? errorMessages[params.error] : undefined;
  const configured = isAuthConfigured();
  const kakaoConfigured = isKakaoAuthConfigured();

  return (
    <div className="content-shell" style={{ padding: "16px 0 48px" }}>
      <SectionCard
        eyebrow="Login"
        title="A private entrance for one quiet archive."
        description="Use the private access code to enter the library. The protected pages stay behind a server-side cookie gate."
      >
        <form
          action="/api/auth/login"
          method="post"
          style={{ display: "grid", gap: "16px" }}
        >
          <input type="hidden" name="redirectTo" value={nextPath} />

          <div style={{ display: "grid", gap: "10px" }}>
            <label htmlFor="password" style={{ fontWeight: 700 }}>
              Private access code
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input-field"
              autoComplete="current-password"
              placeholder={
                configured ? "Enter the shared private password" : "Not configured yet"
              }
              disabled={!configured}
              aria-invalid={errorMessage ? true : undefined}
            />
          </div>

          {errorMessage ? (
            <p role="alert" className="error-text">
              {errorMessage}
            </p>
          ) : null}

          {!configured ? (
            <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
              Set the <code>CATHY_GARDEN_PASSWORD</code> environment variable
              before using this login form.
            </p>
          ) : null}

          <button
            type="submit"
            className="button-link primary"
            disabled={!configured}
            style={{ width: "fit-content", border: "none", cursor: "pointer" }}
          >
            Enter the archive
          </button>
        </form>

        <div className="panel panel-dashed" style={{ display: "grid", gap: "12px" }}>
          <strong>Kakao login</strong>
          <span style={{ color: "var(--muted)", lineHeight: 1.7 }}>
            Use the one allowed Kakao account to enter without the private code.
          </span>
          <a
            href={`/api/auth/kakao/start?next=${encodeURIComponent(nextPath)}`}
            className={`button-link secondary${kakaoConfigured ? "" : " is-disabled"}`}
            aria-disabled={!kakaoConfigured}
            style={{
              width: "fit-content",
              pointerEvents: kakaoConfigured ? "auto" : "none",
              opacity: kakaoConfigured ? 1 : 0.58,
            }}
          >
            Continue with Kakao
          </a>
          {!kakaoConfigured ? (
            <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
              Set Kakao OAuth environment variables before using this option.
            </p>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
