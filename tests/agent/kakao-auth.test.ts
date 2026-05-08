import {
  KAKAO_AUTHORIZATION_URL,
  buildKakaoAuthorizationUrl,
  isAllowedKakaoUser,
} from "../../lib/kakao-auth";

describe("Kakao auth helpers", () => {
  test("builds a Kakao authorization URL with state", () => {
    const url = new URL(
      buildKakaoAuthorizationUrl({
        config: {
          allowedUserId: "12345",
          redirectUri: "http://localhost:3000/api/auth/kakao/callback",
          restApiKey: "rest-api-key",
        },
        state: "state-token",
      })
    );

    expect(`${url.origin}${url.pathname}`).toBe(KAKAO_AUTHORIZATION_URL);
    expect(url.searchParams.get("client_id")).toBe("rest-api-key");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/auth/kakao/callback"
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe("state-token");
  });

  test("allows only the configured Kakao user id", () => {
    expect(
      isAllowedKakaoUser({
        allowedUserId: "12345",
        userId: "12345",
      })
    ).toBe(true);
    expect(
      isAllowedKakaoUser({
        allowedUserId: "12345",
        userId: "67890",
      })
    ).toBe(false);
  });
});
