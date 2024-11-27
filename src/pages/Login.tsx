import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// MUI css
import { Box } from "@mui/material";

// Images
import logo from "@images/cathy-garden.png";
import kakaoLogin from "@images/kakao/kakao_login_large_wide.png";

// Utils
import { getAuthorize, kakaoLoginOpen } from "@src/common/utils/kakao";

// Recoil
import { useRecoilValue } from "recoil";
import { kakaoState } from "@recoil/kakao";

export default function Login() {
  const { isLogin } = useRecoilValue(kakaoState);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLogin) {
      navigate("/garden");
    }
  }, [isLogin, navigate]);

  const handleClick = () => {
    if (!isLogin) {
      kakaoLoginOpen();
    }
  };

  return (
    <>
      <Box
        sx={{
          width: "100vw",
          height: "80vh",
          backgroundImage: `url(${logo})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></Box>
      <Box
        onClick={handleClick}
        sx={{
          width: "100vw",
          height: "12vh",
          backgroundImage: `url(${kakaoLogin})`,
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></Box>
    </>
  );
}
