import React from "react";

// MUI css
import { Box } from "@mui/material";

// Images
import logo from "@images/cathy-garden.png";

// Utils

// Recoil
import { useRecoilValue } from "recoil";
import { kakaoState } from "@recoil/kakao";

export default function Garden() {
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
    </>
  );
}
