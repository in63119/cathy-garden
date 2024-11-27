import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// recoil
import { useRecoilState } from "recoil";
import { kakaoState } from "@src/common/recoil/kakao";

// type
import { TkakaoState } from "@src/common/types/kakao";

// utils
import { getAuthorize } from "@utils/kakao";

const Callback = () => {
  const navigate = useNavigate();
  const codeFromUri =
    new URL(window.location.href).searchParams.get("code") ?? "";
  const [kakao, setKakao] = useRecoilState(kakaoState);

  console.log(codeFromUri);

  const handleKakao = useCallback(async () => {
    setKakao((prev) => ({
      // TODO: TkakaoState 제거
      ...prev,
      isLogin: true,
    }));

    if (kakao.isLogin) {
      const auth = await getAuthorize(codeFromUri);

      if (auth) {
        navigate("/garden");
      }
      //   const result = await postCodeToServer(codeFromUri);
      //   setKakaoCode((prev: TkakaoState) => ({
      //     ...prev,
      //     kakaoEmail: result.email,
      //     kakaoId: result.kakaoId,
      //   }));
      //   navigate(PageUrls.INTRO);
    }
  }, [codeFromUri, kakao.isLogin, navigate, setKakao]);

  useEffect(() => {
    handleKakao();
  }, [handleKakao]);

  return (
    <div>
      <div>로딩 중...</div>
    </div>
  );
};

export default Callback;
