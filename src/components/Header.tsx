import React from "react";

// MUI css
import { Box, Typography } from "@mui/material";

export default function Header() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        m: "1%",
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        <Box
          sx={{ display: "flex", justifyContent: "center", cursor: "pointer" }}
        >
          <Typography variant="h4" ml="10px">
            Cathy Garden
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
