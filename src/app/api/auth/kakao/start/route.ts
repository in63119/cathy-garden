import { randomBytes } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { getSafeRedirectPath } from "@/lib/auth";
import {
  KAKAO_OAUTH_NEXT_COOKIE_NAME,
  KAKAO_OAUTH_STATE_COOKIE_NAME,
  buildKakaoAuthorizationUrl,
  getKakaoOAuthConfig,
} from "@/lib/kakao-auth";

export async function GET(request: NextRequest) {
  const config = getKakaoOAuthConfig();

  if (!config) {
    return NextResponse.redirect(
      new URL("/login?error=kakao-not-configured", request.url)
    );
  }

  const nextPath = getSafeRedirectPath(
    request.nextUrl.searchParams.get("next")
  );
  const state = randomBytes(24).toString("hex");
  const response = NextResponse.redirect(
    buildKakaoAuthorizationUrl({ config, state })
  );
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  };

  response.cookies.set(KAKAO_OAUTH_STATE_COOKIE_NAME, state, cookieOptions);
  response.cookies.set(KAKAO_OAUTH_NEXT_COOKIE_NAME, nextPath, cookieOptions);

  return response;
}
