import { redirect } from "next/navigation";

import { SectionCard } from "@/components/section-card";
import {
  isAuthConfigured,
  isAuthenticated,
  isKakaoAuthConfigured,
  isPasswordLoginEnabled,
} from "@/lib/auth-server";
import { DEFAULT_REDIRECT_PATH, getSafeRedirectPath } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "invalid-password": "비밀번호가 맞지 않습니다.",
  "kakao-invalid-state":
    "카카오 로그인 시간이 만료되었습니다. 다시 시도해 주세요.",
  "kakao-login-failed": "카카오 로그인을 완료하지 못했습니다.",
  "kakao-not-configured": "카카오 로그인이 아직 설정되지 않았습니다.",
  "kakao-user-not-allowed": "허용된 카카오 계정만 들어올 수 있습니다.",
  "not-configured": "아직 개인 비밀번호가 설정되지 않았습니다.",
  "password-login-disabled":
    "운영 환경에서는 카카오 로그인만 사용할 수 있습니다.",
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
  const passwordLoginEnabled = isPasswordLoginEnabled();

  return (
    <div className="content-shell" style={{ padding: "16px 0 48px" }}>
      <SectionCard
        eyebrow="로그인"
        title="Garden 들어가기"
        description={
          passwordLoginEnabled
            ? "비밀번호나 허용된 카카오 계정으로 보관함에 들어갈 수 있습니다."
            : "허용된 Cathy 카카오 계정으로만 보관함에 들어갈 수 있습니다."
        }
      >
        {passwordLoginEnabled ? (
          <form
            action="/api/auth/login"
            method="post"
            style={{ display: "grid", gap: "16px" }}
          >
            <input type="hidden" name="redirectTo" value={nextPath} />

            <div style={{ display: "grid", gap: "10px" }}>
              <label htmlFor="password" style={{ fontWeight: 700 }}>
                개인 비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="input-field"
                autoComplete="current-password"
                placeholder={
                  configured
                    ? "개인 비밀번호를 입력하세요"
                    : "아직 설정되지 않았습니다"
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
                로그인 폼을 사용하기 전에 <code>CATHY_GARDEN_PASSWORD</code>{" "}
                환경변수를 설정해 주세요.
              </p>
            ) : null}

            <button
              type="submit"
              className="button-link primary"
              disabled={!configured}
              style={{
                width: "fit-content",
                border: "none",
                cursor: "pointer",
              }}
            >
              Garden 들어가기
            </button>
          </form>
        ) : errorMessage ? (
          <p role="alert" className="error-text">
            {errorMessage}
          </p>
        ) : null}

        <div
          className="panel panel-dashed"
          style={{ display: "grid", gap: "12px" }}
        >
          <strong>카카오 로그인</strong>
          <span style={{ color: "var(--muted)", lineHeight: 1.7 }}>
            Cathy 카카오 계정으로만 들어갈 수 있습니다.
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
            카카오로 계속하기
          </a>
          {!kakaoConfigured ? (
            <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
              카카오 로그인 환경변수를 먼저 설정해 주세요.
            </p>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
