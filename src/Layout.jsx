import React from "react";
import { Box } from "@mui/material";

import { Outlet } from "react-router-dom";
import SidebarAction from "./global/sidebar";

const Layout = () => {
  return (
    <Box display="flex" height="100vh">
      {/* Sidebar */}
      <SidebarAction />

      {/* Main Content */}
      <Box flex={1} p={3} sx={{ overflowY: "auto", width: "100%" }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
