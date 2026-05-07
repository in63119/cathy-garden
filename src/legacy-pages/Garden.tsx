import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageUrls } from "@common/constants/page-urls";

// MUI css
import { Box } from "@mui/material";

// Images
import logo from "@images/cathy-garden.png";

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
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            p: 3,
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: "999px",
              backgroundColor: "rgba(255,255,255,0.78)",
              color: "#243126",
              fontWeight: 700,
            }}
          >
            Cathy Garden Archive
          </Box>
        </Box>
      </Box>
    </>
  );
}
