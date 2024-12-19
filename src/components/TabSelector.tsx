import React from "react";
import { useNavigate } from "react-router-dom";

// recoil
import { useRecoilState, useResetRecoilState } from "recoil";
import { tabSelectState } from "@common/recoil/tabSelect";

// MUI css
import { Box, Tabs, Tab } from "@mui/material";

export default function TabSelector() {
  const [tabValueState, setTabValue] = useRecoilState(tabSelectState);
  const navigate = useNavigate();

  const handleTab = (event: any, newValue: string) => {
    setTabValue({ tabSelect: newValue });

    navigate(`/${newValue}`);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Tabs
        onChange={handleTab}
        value={tabValueState.tabSelect}
        textColor="secondary"
        indicatorColor="secondary"
        aria-label="secondary tabs example"
      >
        <Tab label="NFT" value="NFT" />
        <Tab label="Mint" value="Mint" />
        <Tab label="Market" value="Market" />
      </Tabs>
    </Box>
  );
}
