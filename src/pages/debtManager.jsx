import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  TextField,
  Container,
  Paper,
  Snackbar,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import { getTheme } from "../store/theme";
import TitleComponent from "../components/title";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";

function DebtManager() {
  const [message, setMessage] = useState("");
  const [balanceThreshold, setBalanceThreshold] = useState("");
  const [customBalanceThreshold, setCustomBalanceThreshold] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [activeTab, setActiveTab] = useState(0); // State for active tab
  const theme = getTheme();
  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setMessage(""); // Clear message when switching tabs
  };

  // 1. Send SMS to All Customers with Arrears
  const handleSendSmsToAll = async () => {
    try {
      const response = await axios.post(
        `${BASEURL}/send-sms-unpaid`,
        {},
        { withCredentials: true }
      );
      setMessage(
        response.data.message || "SMS sent to all customers with arrears"
      );
      setSnackbarOpen(false);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Error sending SMS";
      setMessage("");
      setSnackbarMessage(errorMsg);
      setSnackbarOpen(true);
    }
  };

  // 2. Send SMS to Customers Above Selected Balance
  const handleSendSmsAboveBalance = async () => {
    const balance = Number(balanceThreshold);
    if (!balanceThreshold || isNaN(balance) || balance < 0) {
      setSnackbarMessage("Please enter a valid, non-negative balance threshold");
      setSnackbarOpen(true);
      return;
    }

   
    try {
      const response = await axios.post(
        `${BASEURL}/send-sms-custom-balance`,
        { balance },
        { withCredentials: true }
      );
      setMessage(
        response.data.message ||
          `SMS sent to customers with balance above ${balance}`
      );
      setBalanceThreshold("");
      setSnackbarOpen(false);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Error sending SMS";
      setMessage("");
      setSnackbarMessage(errorMsg);
      setSnackbarOpen(true);
    }
  };

  // 3. Send Custom SMS to Customers Above Selected Balance
  const handleSendCustomSms = async () => {
    const balance = Number(customBalanceThreshold);
    if (!customBalanceThreshold || isNaN(balance) || balance < 0) {
      setSnackbarMessage("Please enter a valid, non-negative balance threshold");
      setSnackbarOpen(true);
      return;
    }
    if (!customMessage.trim()) {
      setSnackbarMessage("Please enter a custom message");
      setSnackbarOpen(true);
      return;
    }
    try {
      const response = await axios.post(
        `${BASEURL}/send-custom-sms-above-balance`,
        { balance, message: customMessage },
        { withCredentials: true }
      );
      setMessage(
        response.data.message ||
          `Custom SMS sent to customers with balance above ${balance}`
      );
      setCustomBalanceThreshold("");
      setCustomMessage("");
      setSnackbarOpen(false);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Error sending custom SMS";
      setMessage("");
      setSnackbarMessage(errorMsg);
      setSnackbarOpen(true);
    }
  };

  return (
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Container>
        <TitleComponent title="Debt Manager" />
        <Paper
          elevation={3}
          sx={{ maxWidth: "60%", bgcolor: theme.palette.background.paper }}
        >
          <Box sx={{ p: 3 }}>
            {/* Tabs Navigation */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              centered
               variant="scrollable"
              scrollButtons="auto"
              sx={{
                mb: 3,
                "& .MuiTab-root": { color: theme.palette.grey[100] },
                "& .Mui-selected": { color: theme.palette.greenAccent.main },
                "& .MuiTabs-indicator": {
                  backgroundColor: theme.palette.greenAccent.main,
                },
              }}
            >
              <Tab label="All with Arrears" />
              <Tab label="Above Threshold" />
              <Tab label="Custom SMS" />
            </Tabs>

            {/* Tab Panels */}
            {/* Tab 1: Send SMS to All with Arrears */}
            {activeTab === 0 && (
              <Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: theme.palette.grey[100] }}
                >
                  Send SMS to All Customers with Arrears
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleSendSmsToAll}
                  sx={{
                    mt: 2,
                    bgcolor: theme.palette.greenAccent.main,
                    color: theme.palette.grey[100],
                  }}
                >
                  Send SMS
                </Button>
              </Box>
            )}

            {/* Tab 2: Send SMS to Customers Above Selected Balance */}
            {activeTab === 1 && (
              <Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: theme.palette.grey[100] }}
                >
                  Send SMS to Customers Above a Balance Threshold
                </Typography>
                <TextField
                  label="Balance Threshold (KES)"
                  value={balanceThreshold}
                  onChange={(e) => setBalanceThreshold(e.target.value)}
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  type="number"
                  placeholder="e.g., 500"
                  size="small"
                  sx={{
                    "& .MuiInputBase-root": { color: theme.palette.grey[100] },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.grey[300],
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.greenAccent.main,
                    },
                    "& .MuiInputLabel-root": { color: theme.palette.grey[500] },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSendSmsAboveBalance}
                  sx={{
                    mt: 2,
                    bgcolor: theme.palette.greenAccent.main,
                    color: theme.palette.grey[100],
                  }}
                >
                  Send SMS
                </Button>
              </Box>
            )}

            {/* Tab 3: Send Custom SMS to Customers Above Selected Balance */}
            {activeTab === 2 && (
              <Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: theme.palette.grey[100] }}
                >
                  Send Custom SMS to Customers Above a Balance Threshold
                </Typography>
                <TextField
                  label="Balance Threshold (KES)"
                  value={customBalanceThreshold}
                  onChange={(e) => setCustomBalanceThreshold(e.target.value)}
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  type="number"
                  placeholder="e.g., 1000"
                  size="small"
                  sx={{
                    "& .MuiInputBase-root": { color: theme.palette.grey[100] },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.grey[300],
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.greenAccent.main,
                    },
                    "& .MuiInputLabel-root": { color: theme.palette.grey[500] },
                  }}
                />
                <TextField
                  label="Custom Message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  placeholder="e.g., Please settle your outstanding balance"
                  size="small"
                  sx={{
                    "& .MuiInputBase-root": { color: theme.palette.grey[100] },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.grey[300],
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.greenAccent.main,
                    },
                    "& .MuiInputLabel-root": { color: theme.palette.grey[500] },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSendCustomSms}
                  sx={{
                    mt: 2,
                    bgcolor: theme.palette.greenAccent.main,
                    color: theme.palette.grey[100],
                  }}
                >
                  Send Custom SMS
                </Button>
              </Box>
            )}

            {/* Response Message */}
            {message && (
              <Box sx={{ mt: 2 }}>
                <Typography
                  sx={{
                    color: message.includes("Error")
                      ? "error.main"
                      : "success.main",
                  }}
                >
                  {message}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Snackbar for errors */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity="error"
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default DebtManager;