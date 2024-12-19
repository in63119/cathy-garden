import React, { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageUrls } from "@common/constants/page-urls";

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
  const [hasRun, setHasRun] = useState(false);

  const handleKakao = useCallback(async () => {
    if (!hasRun && codeFromUri.length > 0) {
      const auth = await getAuthorize(codeFromUri);

      if (auth) {
        setKakao((prev: TkakaoState) => ({
          ...prev,
          kakaoEmail: auth.email,
          kakaoId: auth.kakaoId,
          isLogin: true,
        }));
        setHasRun(true);
        navigate(PageUrls.INTRO);
      }
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
