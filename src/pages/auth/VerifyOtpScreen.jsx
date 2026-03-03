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

const VerifyOtpScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { phoneNumber } = location.state || {};

  const [formData, setFormData] = useState({
    phoneNumber: phoneNumber || "",
    otp: "",
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";
  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleVerifyOtp = async () => {
    const { phoneNumber, otp } = formData;

    if (!phoneNumber || !otp) {
      setSnackbar({ open: true, message: "Phone number and OTP are required", severity: "error" });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BASEURL}/verify-otp`, { phoneNumber, otp });
      setSnackbar({ open: true, message: "OTP verified successfully", severity: "success" });
      navigate("/change-password", { state: { phoneNumber } });
    } catch (error) {
      console.error("Error verifying OTP:", error.response?.data || error.message);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Error verifying OTP: " + error.message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Redirect to forgot-password if phoneNumber is missing
  if (!phoneNumber) {
    navigate("/forgot-password");
    return null;
  }

  return (
    <Container sx={{ maxWidth: 600 }}>
      <Paper elevation={3} sx={{ p: 4, mt: 8, ml: 60 }}>
        <Typography variant="h4" gutterBottom>
          Verify OTP
        </Typography>

        <Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Enter the OTP sent to {phoneNumber}.
          </Typography>
          <TextField
            label="OTP"
            value={formData.otp}
            onChange={handleInputChange("otp")}
            fullWidth
            margin="normal"
            disabled={loading}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleVerifyOtp}
            fullWidth
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : "Verify OTP"}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate("/forgot-password")}
            fullWidth
            sx={{ mt: 1 }}
          >
            Back
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

export default VerifyOtpScreen;