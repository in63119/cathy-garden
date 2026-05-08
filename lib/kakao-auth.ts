export const KAKAO_AUTHORIZATION_URL =
  "https://kauth.kakao.com/oauth/authorize";
export const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
export const KAKAO_USER_ME_URL = "https://kapi.kakao.com/v2/user/me";

export const KAKAO_OAUTH_STATE_COOKIE_NAME = "cathy-garden-kakao-state";
export const KAKAO_OAUTH_NEXT_COOKIE_NAME = "cathy-garden-kakao-next";

export type KakaoOAuthConfig = {
  allowedUserId: string;
  clientSecret?: string;
  redirectUri: string;
  restApiKey: string;
};

export type KakaoTokenResponse = {
  access_token?: string;
  token_type?: string;
};

export type KakaoUserResponse = {
  id?: number | string;
};

export function getKakaoOAuthConfig(): KakaoOAuthConfig | null {
  const restApiKey = process.env.KAKAO_REST_API_KEY?.trim() ?? "";
  const redirectUri = process.env.KAKAO_REDIRECT_URI?.trim() ?? "";
  const allowedUserId = process.env.KAKAO_ALLOWED_USER_ID?.trim() ?? "";
  const clientSecret = process.env.KAKAO_CLIENT_SECRET?.trim() || undefined;

  if (!restApiKey || !redirectUri || !allowedUserId) {
    return null;
  }

  return {
    allowedUserId,
    clientSecret,
    redirectUri,
    restApiKey,
  };
}

export function buildKakaoAuthorizationUrl(params: {
  config: KakaoOAuthConfig;
  state: string;
}) {
  const searchParams = new URLSearchParams({
    client_id: params.config.restApiKey,
    redirect_uri: params.config.redirectUri,
    response_type: "code",
    state: params.state,
  });

  return `${KAKAO_AUTHORIZATION_URL}?${searchParams.toString()}`;
}

export async function requestKakaoAccessToken(params: {
  code: string;
  config: KakaoOAuthConfig;
}) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: params.config.restApiKey,
    redirect_uri: params.config.redirectUri,
    code: params.code,
  });

  if (params.config.clientSecret) {
    body.set("client_secret", params.config.clientSecret);
  }

  const response = await fetch(KAKAO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body,
  });
  const data = (await response.json()) as KakaoTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error("kakao-token-failed");
  }

  return data.access_token;
}

export async function requestKakaoUser(accessToken: string) {
  const response = await fetch(KAKAO_USER_ME_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = (await response.json()) as KakaoUserResponse;

  if (!response.ok || data.id === undefined || data.id === null) {
    throw new Error("kakao-user-failed");
  }

  return {
    id: String(data.id),
  };
}

export function isAllowedKakaoUser(params: {
  allowedUserId: string;
  userId: string;
}) {
  return params.userId === params.allowedUserId;
}
