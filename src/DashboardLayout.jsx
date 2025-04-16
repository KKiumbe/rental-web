import { AppBar, Toolbar, IconButton, Typography } from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import {useThemeStore} from "./store/authStore";



const DashboardLayout = () => {
   const darkMode = useThemeStore((state) => state.darkMode);

   const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Billing System
        </Typography>
        <IconButton color="inherit" onClick={toggleTheme}>
          {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default DashboardLayout;
