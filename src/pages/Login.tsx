import React from "react";

// MUI css
import { Box } from "@mui/material";

// Images
import logo from "@images/cathy-garden.png";
import kakaoLogin from "@images/kakao/kakao_login_large_wide.png";

export default function Login() {
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
