import React, { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { getTheme } from "../store/theme";

const ChangePasswordScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { phoneNumber } = location.state || {}; // Get phoneNumber from previous screen

  const [formData, setFormData] = useState({
    phoneNumber: phoneNumber || "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";
   const theme = getTheme();
  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleResetPassword = async () => {
    const { phoneNumber, newPassword, confirmNewPassword } = formData;

    if (!phoneNumber || !newPassword || !confirmNewPassword) {
      setSnackbar({ open: true, message: "All fields are required", severity: "error" });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setSnackbar({ open: true, message: "Passwords do not match", severity: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setSnackbar({ open: true, message: "Password must be at least 6 characters", severity: "error" });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BASEURL}/reset-password`, { phoneNumber, newPassword });
      setSnackbar({ open: true, message: "Password reset successfully", severity: "success" });
      setTimeout(() => navigate("/login"), 2000); // Redirect to login after 2 seconds
    } catch (error) {
      console.error("Error resetting password:", error.response?.data || error.message);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Error resetting password: " + error.message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Redirect to forgot-password if phoneNumber is missing (direct access prevention)
  if (!phoneNumber) {
    navigate("/forgot-password");
    return null;
  }

  return (
    <Container sx={{ }}>
      <Paper elevation={3} sx={{ p: 4, mt: 8, ml: 55,maxWidth:600,minWidth:300}}>
        <Typography variant="h4" gutterBottom sx={{ml:13}}>
          Change Password
        </Typography>

        <Box>
          <Typography variant="body1" sx={{ mb: 2 ,ml:20}}>
            Enter your new password
          </Typography>
          <TextField
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={handleInputChange("newPassword")}
            fullWidth
            margin="normal"
            disabled={loading}
          />
          <TextField
            label="Confirm New Password"
            type="password"
            value={formData.confirmNewPassword}
            onChange={handleInputChange("confirmNewPassword")}
            fullWidth
            margin="normal"
            disabled={loading}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleResetPassword}
            fullWidth
            disabled={loading}
            sx={{ mt: 2, backgroundColor:theme.palette.greenAccent.main}}
          >
            {loading ? <CircularProgress size={24} /> : "Reset Password"}
          </Button>
          <Button
            variant="text"
            color="primary"
            onClick={() => navigate("/login")}
            fullWidth
            sx={{ mt: 2, color:theme.palette.primary.contrastText}}
          >
            Back to Login
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ChangePasswordScreen;