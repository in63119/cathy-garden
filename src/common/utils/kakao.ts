import { get, post } from "@src/common/utils/axios";

const apiKey = process.env.REACT_APP_KAKAO_API_KEY;
const currentUrl = window.location.host;
const redirect_uri =
  currentUrl === "localhost:3000"
    ? process.env.REACT_APP_LOCAL_CALLBACK
    : process.env.REACT_APP_PROD_CALLBACK;
const kakaoUri = `https://kauth.kakao.com/oauth/authorize?client_id=${apiKey}&redirect_uri=${redirect_uri}&response_type=code`;
const kakaoBaseUrl = "https://kauth.kakao.com";

export const getAuthorize = async (code: string) => {
  try {
    const data = {
      grant_type: "authorization_code",
      client_id: apiKey,
      redirect_uri: redirect_uri,
      code: code,
    };

    const header = {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    };

    const res = await post(`${kakaoBaseUrl}/oauth/token`, data, {
      headers: header,
    });

    if (res?.status === 200) {
      const acceseToken = res.data.access_token;
      const userInfo = await getUserInfo(acceseToken);
      return userInfo;
    }
  } catch (error) {
    console.error("getAuthorize : ", error);
  }
};

export const kakaoLoginOpen = async () => {
  window.location.href = kakaoUri;
};

const getUserInfo = async (token: string) => {
  const header = {
    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    Authorization: `Bearer ${token}`,
  };
  const propertyKeys = {
    property_keys: ["kakao_account.email"],
  };

  try {
    const res = await get(`https://kapi.kakao.com/v2/user/me`, {
      headers: header,
      propertyKeys,
    });

    if (res?.status === 200) {
      return {
        email: res?.data.kakao_account.email,
        kakaoId: res?.data.id,
      };
    }
  } catch (error) {
    console.log(error);
  }
};
