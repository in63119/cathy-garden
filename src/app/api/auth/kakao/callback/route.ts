import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_REDIRECT_PATH, getSafeRedirectPath } from "@/lib/auth";
import { establishAuthenticatedSession } from "@/lib/auth-server";
import {
  KAKAO_OAUTH_NEXT_COOKIE_NAME,
  KAKAO_OAUTH_STATE_COOKIE_NAME,
  getKakaoOAuthConfig,
  isAllowedKakaoUser,
  requestKakaoAccessToken,
  requestKakaoUser,
} from "@/lib/kakao-auth";

export async function GET(request: NextRequest) {
  const config = getKakaoOAuthConfig();

  if (!config) {
    return redirectToLogin(request, "kakao-not-configured");
  }

  const code = request.nextUrl.searchParams.get("code")?.trim() ?? "";
  const state = request.nextUrl.searchParams.get("state")?.trim() ?? "";
  const cookieStore = await cookies();
  const expectedState =
    cookieStore.get(KAKAO_OAUTH_STATE_COOKIE_NAME)?.value ?? "";
  const nextPath = getSafeRedirectPath(
    cookieStore.get(KAKAO_OAUTH_NEXT_COOKIE_NAME)?.value
  );

  if (!code || !state || state !== expectedState) {
    return redirectToLogin(request, "kakao-invalid-state");
  }

  try {
    const accessToken = await requestKakaoAccessToken({ code, config });
    const user = await requestKakaoUser(accessToken);

    if (
      !isAllowedKakaoUser({
        allowedUserId: config.allowedUserId,
        userId: user.id,
      })
    ) {
      return redirectToLogin(request, "kakao-user-not-allowed");
    }

    await establishAuthenticatedSession();
    const response = NextResponse.redirect(new URL(nextPath, request.url));

    response.cookies.delete(KAKAO_OAUTH_STATE_COOKIE_NAME);
    response.cookies.delete(KAKAO_OAUTH_NEXT_COOKIE_NAME);

    return response;
  } catch (error) {
    console.error("Kakao OAuth login failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    return redirectToLogin(request, "kakao-login-failed");
  }
}

function redirectToLogin(request: NextRequest, reason: string) {
  return NextResponse.redirect(
    new URL(
      `/login?error=${encodeURIComponent(reason)}&next=${encodeURIComponent(
        DEFAULT_REDIRECT_PATH
      )}`,
      request.url
    )
  );
}
