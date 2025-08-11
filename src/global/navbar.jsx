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
  Badge,
} from "@mui/material";
import { AccountCircle, Menu as MenuIcon, Edit, Notifications } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useThemeStore } from "../store/authStore";
import axios from "axios";
import { getTheme } from "../store/theme";

// CSS for blinking animation
const blinkKeyframes = `
  @keyframes blink {
    50% {
      opacity: 0.5;
    }
  }
`;

export default function Navbar() {
  const { darkMode, toggleTheme } = useThemeStore();
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [sms, setSMS] = useState(null);
  const [smsLoading, setSmsLoading] = useState(false); // New loading state
  const [smsError, setSmsError] = useState(false); // Track if SMS fetch failed
  const [editMode, setEditMode] = useState(false);
  const [userDetails, setUserDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const BASEURL = import.meta.env.VITE_BASE_URL;
  const theme = getTheme(darkMode ? "dark" : "light");

  // Mock notifications (replace with API call when ready)
  useEffect(() => {
    const mockNotifications = [];
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter((n) => !n.read).length);
  }, []);

  // Fetch SMS balance with retry mechanism
  const fetchSMSBalance = async (retries = 2, delay = 1000) => {
    setSmsLoading(true);
    setSmsError(false);

    const attemptFetch = async (attempt) => {
      try {
        const response = await axios.get(`${BASEURL}/get-sms-balance`, { withCredentials: true });
        setSMS(response.data.credit);
        setSmsLoading(false);
        return true;
      } catch (error) {
        console.error(`SMS balance fetch attempt ${attempt}:`, error);
        if (attempt < retries && error.response?.status !== 401) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          return attemptFetch(attempt + 1);
        }
        const errorMessage =
          error.response?.status === 401
            ? "Session expired. Please log in again."
            : error.response?.status === 500
            ? "Server error. SMS balance unavailable."
            : error.response?.data?.message || "Failed to fetch SMS balance.";
        setSnackbar({ open: true, message: errorMessage, severity: "error" });
        setSMS(null); // Set to null to hide the SMS balance section
        setSmsLoading(false);
        setSmsError(true);
        if (error.response?.status === 401) {
          logout();
          navigate("/login");
        }
        return false;
      }
    };

    await attemptFetch(1);
  };

  useEffect(() => {
    if (currentUser) {
      fetchSMSBalance();
    }
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNotificationToggle = () => {
    setNotificationOpen(!notificationOpen);
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

    if (!firstName || !email) {
      setSnackbar({ open: true, message: "First name and email are required", severity: "error" });
      return;
    }
    if ((currentPassword || password || confirmPassword) && (!currentPassword || !password)) {
      setSnackbar({
        open: true,
        message: "Current and new passwords are required to change password",
        severity: "error",
      });
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

    const payload = {};
    if (firstName) payload.firstName = firstName;
    if (userDetails.lastName) payload.lastName = userDetails.lastName;
    if (email) payload.email = email;
    if (phoneNumber) payload.phoneNumber = phoneNumber;
    if (currentPassword && password) {
      payload.currentPassword = currentPassword;
      payload.password = password;
    }

    try {
      const response = await axios.put(`${BASEURL}/update-user`, payload, { withCredentials: true });
      setSnackbar({ open: true, message: "Profile updated successfully", severity: "success" });
      setEditMode(false);
      if (response) {
        navigate("/login");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setSnackbar({
        open: true,
        message: "Error updating profile: " + (error.response?.data?.message || error.message),
        severity: "error",
      });
    }
  };

  const notificationDrawer = (
    <Box sx={{ width: 300, bgcolor: darkMode ? "#333" : "#fff", color: darkMode ? "#fff" : "#000", p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Notifications
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {notifications.length === 0 ? (
        <Typography>No notifications</Typography>
      ) : (
        <List>
          {notifications.map((notification) => (
            <ListItem key={notification.id}>
              <ListItemText
                primary={notification.message}
                secondary={new Date(notification.createdAt).toLocaleString()}
                sx={{ color: notification.read ? theme.palette.grey[500] : theme.palette.grey[100] }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );

  const profileDrawer = (
    <Box sx={{ width: 300, bgcolor: darkMode ? "#333" : "#fff", color: darkMode ? "#fff" : "#000", p: 2 }}>
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
                  onClick={handleUpdateUser}
                  fullWidth
                  sx={{ mb: 1, bgcolor: theme.palette.greenAccent.main, color: "#fff" }}
                >
                  Save Changes
                </Button>
              </ListItem>
              <ListItem>
                <Button
                  variant="outlined"
                  onClick={handleEditToggle}
                  fullWidth
                  sx={{ color: theme.palette.grey[300], borderColor: theme.palette.grey[300] }}
                >
                  Cancel
                </Button>
              </ListItem>
            </>
          ) : (
            <>
              <ListItem>
                <ListItemText primary="Tenant" secondary={currentUser.tenant?.name || "Unknown"} />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Name"
                  secondary={`${currentUser.firstName || "Unknown"} ${currentUser.lastName || ""}`}
                />
              </ListItem>
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

  const mobileDrawer = (
    <Box sx={{ width: 250, bgcolor: darkMode ? "#333" : "#fff", color: darkMode ? "#fff" : "#000", p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Menu
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <List>
        <ListItem button onClick={toggleTheme}>
          <ListItemText primary={darkMode ? "Dark Mode" : "Light Mode"} />
        </ListItem>
        <ListItem button onClick={handleLogout}>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <style>{blinkKeyframes}</style>
      <AppBar position="fixed" sx={{ width: "100%", zIndex: 1100, bgcolor: theme.palette.primary.main }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              edge="start"
              sx={{ display: { xs: "block", md: "none" } }}
              onClick={handleDrawerToggle}
              aria-label="Open mobile menu"
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: { xs: 1, md: 2 }, color: theme.palette.grey[100] }} paddingLeft={10}>
              TAQA
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Conditionally render SMS balance only if successfully fetched */}
            {sms !== null && !smsError && (
              <Typography sx={{ color: theme.palette.grey[100] }}>
                SMS Balance: KSH.{smsLoading ? "Loading..." : sms}
              </Typography>
            )}

            <IconButton
              color="inherit"
              onClick={toggleTheme}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? "🌙" : "☀️"}
            </IconButton>

            <IconButton
              color="inherit"
              onClick={handleNotificationToggle}
              sx={{ position: "relative" }}
              aria-label={`Notifications (${unreadCount} unread)`}
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{
                  "& .MuiBadge-badge": {
                    animation: unreadCount > 0 ? "blink 1s infinite" : "none",
                    fontSize: "0.75rem",
                    height: "18px",
                    minWidth: "18px",
                    padding: "0 4px",
                  },
                }}
              >
                <Notifications />
              </Badge>
            </IconButton>

            <IconButton color="inherit" onClick={handleProfileToggle} aria-label="Open profile">
              <AccountCircle />
            </IconButton>

            <Button
              color="inherit"
              onClick={handleLogout}
              sx={{ ml: 1, color: theme.palette.grey[100] }}
              aria-label="Logout"
            >
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
        ModalProps={{
          keepMounted: true,
          'aria-hidden': false,
        }}
        aria-label="Mobile menu drawer"
      >
        {mobileDrawer}
      </Drawer>

      <Drawer
        anchor="right"
        open={notificationOpen}
        onClose={handleNotificationToggle}
        sx={{
          "& .MuiDrawer-paper": { width: "300px", bgcolor: darkMode ? "#333" : "#fff", color: darkMode ? "#fff" : "#000" },
        }}
        ModalProps={{
          keepMounted: true,
          'aria-hidden': false,
        }}
        aria-label="Notifications drawer"
      >
        {notificationDrawer}
      </Drawer>

      <Drawer
        anchor="right"
        open={profileOpen}
        onClose={handleProfileToggle}
        sx={{
          "& .MuiDrawer-paper": { width: "300px", bgcolor: darkMode ? "#333" : "#fff", color: darkMode ? "#fff" : "#000" },
        }}
        ModalProps={{
          keepMounted: true,
          'aria-hidden': false,
        }}
        aria-label="Profile drawer"
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
}