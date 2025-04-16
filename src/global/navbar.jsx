import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import { HelpOutline, AccountCircle, Menu as MenuIcon, Edit } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useThemeStore } from "../store/authStore";
import axios from "axios";
import { getTheme } from "../store/theme";

const Navbar = () => {
  const { darkMode, toggleTheme } = useThemeStore();
  const { currentUser, logout} = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sms, setSMS] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [userDetails, setUserDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  
    currentPassword: "", // For verification if password change is attempted
    password: "",        // New password field aligned with backend
    confirmPassword: "", // For frontend validation
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";
  const theme = getTheme(darkMode ? "dark" : "light");
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileToggle = () => {
    if (!profileOpen && currentUser) {
      setUserDetails({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
        phoneNumber: currentUser.phoneNumber || "",
      
        currentPassword: "",
        password: "",
        confirmPassword: "",
      });
    }
    setEditMode(false);
    setProfileOpen(!profileOpen);
  };

  const fetchSMSBalance = async () => {
    try {
      const response = await axios.get(`${BASEURL}/get-sms-balance`, { withCredentials: true });
      setSMS(response.data.credit);
    } catch (error) {
      console.error("Error fetching SMS balance:", error);
      setSMS("N/A");
    }
  };

  useEffect(() => {
    fetchSMSBalance();
  }, []);

  const handleEditToggle = () => {
    setEditMode(!editMode);
    if (editMode) {
      setUserDetails((prev) => ({
        ...prev,
        currentPassword: "",
        password: "",
        confirmPassword: "",
      }));
    }
  };

  const handleInputChange = (field) => (e) => {
    setUserDetails((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleUpdateUser = async () => {
    const { firstName, email, phoneNumber, currentPassword, password, confirmPassword } = userDetails;

    // Validation
    if (!firstName || !email) {
      setSnackbar({ open: true, message: "First name and email are required", severity: "error" });
      return;
    }
    if ((currentPassword || password || confirmPassword) && (!currentPassword || !password)) {
      setSnackbar({ open: true, message: "Current and new passwords are required to change password", severity: "error" });
      return;
    }
    if (password && password !== confirmPassword) {
      setSnackbar({ open: true, message: "New passwords do not match", severity: "error" });
      return;
    }
    if (password && password.length < 6) {
      setSnackbar({ open: true, message: "New password must be at least 6 characters", severity: "error" });
      return;
    }

    // Prepare payload
    const payload = {};
    if (firstName) payload.firstName = firstName;
    if (userDetails.lastName) payload.lastName = userDetails.lastName;
    if (email) payload.email = email;
    if (phoneNumber) payload.phoneNumber = phoneNumber;
  
    if (currentPassword && password) {
      payload.currentPassword = currentPassword; // Include current password for backend verification
      payload.password = password;               // New password to be hashed by backend
    }

    try {
      const response = await axios.put(`${BASEURL}/update-user`, payload, { withCredentials: true });
      console.log("Profile update payload:", payload); // Check if the payload is correct
      if(response){
        navigate("/login");

      }
    // Update store with new user data
      setSnackbar({ open: true, message: "Profile updated successfully", severity: "success" });
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setSnackbar({
        open: true,
        message: "Error updating profile: " + (error.response?.data?.message || error.message),
        severity: "error",
      });
    }
  };

  const profileDrawer = (
    <Box sx={{ width: 300, }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">Profile</Typography>
        <IconButton
          onClick={handleEditToggle}
          sx={{ color: darkMode ? theme.palette.greenAccent.main : "#000" }}
          title={editMode ? "Cancel Edit" : "Edit Profile"}
        >
          <Edit />
        </IconButton>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {currentUser ? (
        <List>
          {editMode ? (
            <>
              <ListItem>
                <TextField
                  label="First Name"
                  value={userDetails.firstName}
                  onChange={handleInputChange("firstName")}
                  fullWidth
                  size="small"
                  required
                  sx={{ input: { color: darkMode ? "#fff" : "#000" } }}
                />
              </ListItem>
              <ListItem>
                <TextField
                  label="Last Name"
                  value={userDetails.lastName}
                  onChange={handleInputChange("lastName")}
                  fullWidth
                  size="small"
                  sx={{ input: { color: darkMode ? "#fff" : "#000" } }}
                />
              </ListItem>
              <ListItem>
                <TextField
                  label="Email"
                  value={userDetails.email}
                  onChange={handleInputChange("email")}
                  fullWidth
                  size="small"
                  type="email"
                  required
                  sx={{ input: { color: darkMode ? "#fff" : "#000" } }}
                />
              </ListItem>
              <ListItem>
                <TextField
                  label="Phone Number"
                  value={userDetails.phoneNumber}
                  onChange={handleInputChange("phoneNumber")}
                  fullWidth
                  size="small"
                  sx={{ input: { color: darkMode ? "#fff" : "#000" } }}
                />
              </ListItem>
             
           
              <ListItem>
                <TextField
                  label="Current Password"
                  value={userDetails.currentPassword}
                  onChange={handleInputChange("currentPassword")}
                  fullWidth
                  size="small"
                  type="password"
                  sx={{ input: { color: darkMode ? "#fff" : "#000" } }}
                />
              </ListItem>
              <ListItem>
                <TextField
                  label="New Password"
                  value={userDetails.password}
                  onChange={handleInputChange("password")}
                  fullWidth
                  size="small"
                  type="password"
                  sx={{ input: { color: darkMode ? "#fff" : "#000" } }}
                />
              </ListItem>
              <ListItem>
                <TextField
                  label="Confirm New Password"
                  value={userDetails.confirmPassword}
                  onChange={handleInputChange("confirmPassword")}
                  fullWidth
                  size="small"
                  type="password"
                  sx={{ input: { color: darkMode ? "#fff" : "#000" } }}
                />
              </ListItem>
              <ListItem>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpdateUser}
                  fullWidth
                  sx={{ mb: 1,  color: darkMode ? theme.palette.greenAccent.main : "#000"}}
                >
                  Save Changes
                </Button>
              </ListItem>
              <ListItem>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleEditToggle}
                  fullWidth
                >
                  Cancel
                </Button>
              </ListItem>
            </>
          ) : (
            <>
              <ListItem>
              <ListItemText
                 
                  primary={`${currentUser.tenant?.name || "Unknown"} `}
                />
              </ListItem>
                <ListItemText
                  primary="Name"
                  secondary={`${currentUser.firstName || "Unknown"} ${currentUser.lastName || ""}`}
                />
            
              <ListItem>
                <ListItemText primary="Email" secondary={currentUser.email || "N/A"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Phone" secondary={currentUser.phoneNumber || "N/A"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Gender" secondary={currentUser.gender || "N/A"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="County" secondary={currentUser.county || "N/A"} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Town" secondary={currentUser.town || "N/A"} />
              </ListItem>
              <ListItem button onClick={handleLogout}>
                <ListItemText primary="Logout" />
              </ListItem>
            </>
          )}
        </List>
      ) : (
        <Typography>No user data available</Typography>
      )}
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" sx={{ width: "100%", zIndex: 1100 }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              edge="start"
              sx={{ display: { xs: "block", md: "none" } }}
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: { xs: 1, md: 2 } }} paddingLeft={10}>
              TAQA
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography>SMS Balance: KSH.{sms !== null ? sms : "Loading..."}</Typography>

            <IconButton color="inherit" onClick={toggleTheme}>
              {darkMode ? "🌙" : "☀️"}
            </IconButton>

         

            <IconButton color="inherit" onClick={handleProfileToggle}>
              <AccountCircle />
            </IconButton>

            <Button color="inherit" onClick={handleLogout} sx={{ ml: 1 }}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: "250px" } }}
      >
        <List>
          <ListItem button onClick={toggleTheme}>
            <ListItemText primary={darkMode ? "Dark Mode" : "Light Mode"} />
          </ListItem>
          <ListItem button onClick={handleLogout}>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Drawer>

      <Drawer
        anchor="right"
        open={profileOpen}
        onClose={handleProfileToggle}
        sx={{
          "& .MuiDrawer-paper": { width: "300px", bgcolor: darkMode ? "#333" : "#fff", color: darkMode ? "#fff" : "#000" },
        }}
      >
        {profileDrawer}
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ height: "64px" }} />
    </>
  );
};

export default Navbar;