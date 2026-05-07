import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageUrls } from "@common/constants/page-urls";

// MUI css
import { Box } from "@mui/material";

// Images
import logo from "@images/cathy-garden.png";

// Components
import TabSelector from "@components/TabSelector";

// Recoil
import { useRecoilValue } from "recoil";
import { kakaoState } from "@recoil/kakao";

export default function Garden() {
  const kakao = useRecoilValue(kakaoState);
  const navigate = useNavigate();

  useEffect(() => {
    if (!kakao.isLogin) {
      navigate(PageUrls.INTRO);
    }
  }, [kakao.isLogin, navigate]);

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
      >
        <TabSelector />
      </Box>
    </>
  );
}
