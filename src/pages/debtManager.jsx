import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Button,
  TextField,
  Container,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import { getTheme } from "../store/theme";
import TitleComponent from "../components/title";

const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";


function DebtManager() {
  const [tabValue, setTabValue] = useState(0);
  const [message, setMessage] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const theme = getTheme();
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setMessage("");
    setBalanceAmount("");
  };

  // 1. Send SMS to All Customers with Arrears
  const handleSendSmsToAll = async () => {
    try {
      const response = await axios.post(`${BASEURL}/send-sms-unpaid`, { withCredentials: true });
      setMessage(response.data.message || "SMS sent to all customers with arrears");
    } catch (error) {
      setMessage(error.response?.data?.error || "Error sending SMS");
    }
  };

  // 2. Send SMS to Customers with High Balance
  const handleSendSmsHighBalance = async () => {
    try {
      const response = await axios.post(`${BASEURL}/send-sms-high-balance`, { withCredentials: true });
      setMessage(response.data.message || "SMS sent to customers with high balance");
    } catch (error) {
      setMessage(error.response?.data?.error || "Error sending SMS");
    }
  };

  // 3. Send SMS to Customers with Low Balance
  const handleSendSmsLowBalance = async () => {
    try {
      const response = await axios.post(`${BASEURL}/send-sms-low-balance`, { withCredentials: true });
      setMessage(response.data.message || "SMS sent to customers with low balance");
    } catch (error) {
      setMessage(error.response?.data?.error || "Error sending SMS");
    }
  };

  // 4. Send SMS to Customers Above Custom Balance
  const handleSendSmsCustomBalance = async () => {
    if (!balanceAmount || isNaN(balanceAmount) || Number(balanceAmount) <= 0) {
      setMessage("Please enter a valid balance amount");
      return;
    }
    try {
      const response = await axios.post(
        `${BASEURL}/send-sms-custom-balance`,
        { balance: Number(balanceAmount) },
        { withCredentials: true }
      );
      setMessage(response.data.message || `SMS sent to customers with balance above ${balanceAmount}`);
      setBalanceAmount("");
    } catch (error) {
      setMessage(error.response?.data?.error || "Error sending SMS");
    }
  };

  return (
    <Box sx={{  width: "100vw", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Container >
        <TitleComponent title="Debt Manager"  />
        <Paper elevation={3} sx={{  maxWidth:'60%' , bgcolor: theme.palette.background.paper, }}>
          <Box sx={{ borderBottom: 1, borderColor: theme.palette.grey[300], pt: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              centered
              sx={{
                mb: 3,
                "& .MuiTab-root": { color: theme.palette.primary.contrastText 
                  
                 },
                "& .Mui-selected": { color: theme.palette.primary.contrastText},
                "& .MuiTabs-indicator": { backgroundColor: theme.palette.greenAccent.main
                  
                 },
                "& .MuiTab-textColorPrimary": { color: theme.palette.primary.contrastText },
                "& .MuiTab-textColorInherit": { color: theme.palette.primary.contrastText },
                "& .MuiTab-root:hover": { color: theme.palette.greenAccent.main },
              }}
            >
              <Tab label="All with Arrears" />
              <Tab label="High Balance" />
              <Tab label="Low Balance" />
              <Tab label="Custom Balance" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {/* Tab 0: Send SMS to All with Arrears */}
            {tabValue === 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.grey[100] }}>
                  Send SMS to All Customers with Arrears
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleSendSmsToAll}
                  sx={{ mt: 2,  color: theme.palette.grey[100] }}
                >
                  Send SMS
                </Button>
              </>
            )}

            {/* Tab 1: Send SMS to Customers with High Balance */}
            {tabValue === 1 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.grey[100] }}>
                  Send SMS to Customers with High Balance
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleSendSmsHighBalance}
                  sx={{ mt: 2, bgcolor: theme.palette.greenAccent.main, color: theme.palette.grey[100] }}
                >
                  Send SMS
                </Button>
              </>
            )}

            {/* Tab 2: Send SMS to Customers with Low Balance */}
            {tabValue === 2 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.grey[100] }}>
                  Send SMS to Customers with Low Balance
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleSendSmsLowBalance}
                  sx={{ mt: 2, bgcolor: theme.palette.greenAccent.main, color: theme.palette.grey[100] }}
                >
                  Send SMS
                </Button>
              </>
            )}

            {/* Tab 3: Send SMS to Customers Above Custom Balance */}
            {tabValue === 3 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.grey[100] }}>
                  Send SMS to Customers Above Custom Balance
                </Typography>
                <TextField
                  label="Enter Balance Amount"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  type="number"
                  placeholder="e.g., 1000"
                  size="small"
                  sx={{
                    "& .MuiInputBase-root": { color: theme.palette.grey[100] },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.grey[300] },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.greenAccent.main },
                    "& .MuiInputLabel-root": { color: theme.palette.grey[500] },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSendSmsCustomBalance}
                  sx={{ mt: 2, bgcolor: theme.palette.greenAccent.main, color: theme.palette.grey[100] }}
                >
                  Send SMS
                </Button>
              </>
            )}

            {/* Response Message */}
            {message && (
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ color: message.includes("Error") ? "error.main" : "success.main" }}>
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
          <Alert onClose={() => setSnackbarOpen(false)} severity="error" sx={{ width: "100%" }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default DebtManager;