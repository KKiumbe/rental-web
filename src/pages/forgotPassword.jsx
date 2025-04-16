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
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getTheme } from "../store/theme";

const ForgotPasswordScreen = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ phoneNumber: "" });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";
 const theme = getTheme();
  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleRequestOtp = async () => {
    const { phoneNumber } = formData;

    if (!phoneNumber) {
      setSnackbar({ open: true, message: "Phone number is required", severity: "error" });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BASEURL}/request-otp`, { phoneNumber });
      setSnackbar({ open: true, message: "OTP sent to your phone", severity: "success" });
      // Navigate to Verify OTP screen with phoneNumber
      navigate("/verify-otp", { state: { phoneNumber } });
    } catch (error) {
      console.error("Error sending OTP:", error.response?.data || error.message);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Error sending OTP: " + error.message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container sx={{ maxWidth: 600 }}>
      <Paper elevation={3} sx={{ p: 4, mt: 8, ml: 60 }}>
        <Typography variant="h4" gutterBottom>
          Forgot Password?
        </Typography>

        <Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Enter your phone number to receive an OTP(one time password).
          </Typography>
          <TextField
            label="Phone Number, start with 0, like 0722230603"
            value={formData.phoneNumber}
            onChange={handleInputChange("phoneNumber")}
            fullWidth
            margin="normal"
            disabled={loading}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleRequestOtp}
            fullWidth
            disabled={loading}
            sx={{ mt: 2, backgroundColor:theme.palette.greenAccent.main, borderRadius:1}}
          >
            {loading ? <CircularProgress size={24} /> : "Send OTP"}
          </Button>
          <Button
            variant="text"
            color="primary"
            onClick={() => navigate("/login")}
            fullWidth
            sx={{ mt: 2, color:theme.palette.primary.contrastText }}
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

export default ForgotPasswordScreen;