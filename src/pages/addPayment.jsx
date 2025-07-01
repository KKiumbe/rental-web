import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  MenuItem,
  Paper,
  Grid,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import TitleComponent from "../components/title";
import axios from "axios";
import { getTheme } from "../store/theme";
import debounce from "lodash/debounce";

const CreatePayment = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";
  const theme = getTheme();

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState({ totalAmount: "", modeOfPayment: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPhoneSearch, setIsPhoneSearch] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // Unified search handler
  const handleSearch = async (query) => {
    const trimmedQuery = (query || "").trim();
    if (!trimmedQuery) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const isPhoneNumber = /^\d+$/.test(trimmedQuery);

    try {
      const url = isPhoneNumber 
        ? `${BASEURL}/search-customer-by-phone` 
        : `${BASEURL}/search-customer-by-name`;
      const params = isPhoneNumber ? { phone: trimmedQuery } : { name: trimmedQuery };

      if (isPhoneNumber && trimmedQuery.length < 10) {
        setSearchResults([]);
        return;
      }

      const response = await axios.get(url, { params, withCredentials: true });
      const results = isPhoneNumber 
        ? response.data ? [response.data] : [] 
        : Array.isArray(response.data) ? response.data : [];
      
      setSearchResults(results);
      if (!results.length) {
        setSnackbar({
          open: true,
          message: isPhoneNumber ? "No customer found with that phone number" : "No customer found with that name",
          severity: "info",
        });
      }
    } catch (error) {
      console.error("Search error:", error.message);
      setSnackbar({
        open: true,
        message: error.code === "ERR_NETWORK" 
          ? "Server not reachable. Please check if the backend is running."
          : error.response?.status === 404 
            ? (isPhoneNumber ? "No customer found with that phone number" : "No customer found with that name")
            : "Error searching customers: " + (error.response?.data?.message || error.message),
        severity: "error",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced phone search
  const debouncedPhoneSearch = useCallback(
    debounce((query) => handleSearch(query), 500),
    []
  );

  // Handle input change
  const handleInputChange = (e, value) => {
    const newValue = e?.target?.value ?? value ?? "";
    setSearchQuery(newValue);
    setIsPhoneSearch(/^\d+$/.test(newValue));
    setSelectedCustomer(null);

    if (isPhoneSearch) {
      debouncedPhoneSearch(newValue);
    } else {
      handleSearch(newValue);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (event, newValue) => {
    setSelectedCustomer(newValue);
    if (newValue) {
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  // Handle form field changes
  const handleFormChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Submit payment
  const handlePaymentSubmit = async () => {
    const { totalAmount, modeOfPayment } = formData;
    if (!selectedCustomer || !totalAmount || !modeOfPayment) {
      setSnackbar({ open: true, message: "Please fill all payment details", severity: "error" });
      return;
    }

    const payload = {
      customerId: selectedCustomer.id,
      totalAmount: parseFloat(totalAmount),
      modeOfPayment,
      paidBy: selectedCustomer.firstName,
    };

    setIsProcessing(true);
    try {
      await axios.post(`${BASEURL}/manual-cash-payment`, payload, { withCredentials: true });
      setSnackbar({ open: true, message: "Payment created successfully", severity: "success" });
      setSelectedCustomer(null);
      setFormData({ totalAmount: "", modeOfPayment: "" });
      setTimeout(() => navigate("/payments"), 2000);
    } catch (error) {
      console.error("Payment error:", error);
      setSnackbar({
        open: true,
        message: "Error creating payment: " + (error.response?.data?.message || error.message),
        severity: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Render phone search results
  const renderPhoneSearchResults = () => (
    searchResults.length > 0 && (
      <Box sx={{ mt: 2 }}>
        {searchResults.map((customer) => (
          <Box
            key={customer.id}
            sx={{ p: 1, cursor: "pointer", "&:hover": { bgcolor: theme.palette.grey[800] } }}
            onClick={() => handleCustomerSelect(null, customer)}
          >
            <Typography sx={{ color: theme.palette.grey[100] }}>
              {`${customer.firstName || "Unknown"} ${customer.lastName || ""} (${customer.phoneNumber || "N/A"})`}
            </Typography>
          </Box>
        ))}
      </Box>
    )
  );

  return (
    <Box sx={{  p: 3, justifyContent: "left", alignItems: "center", width: "100vw", margin: 0, boxSizing: "border-box" }}>
      <TitleComponent title="Create Payment" />
      <Paper sx={{ maxWidth:600, ml:30}}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2, color: theme.palette.grey[100], justifyContent: "center", alignItems: "center" , ml:20 }}>
          Search Customer
        </Typography>
        
        {isPhoneSearch ? (
          <TextField
            label="Search by Phone"
            variant="outlined"
            value={searchQuery}
            onChange={handleInputChange}
            fullWidth
            disabled={isSearching}
            inputProps={{ maxLength: 15 }}
            sx={{
              maxWidth: "300px",
              justifyContent: "center",
              ml:20,
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: theme.palette.grey[300] },
                "&:hover fieldset": { borderColor: theme.palette.greenAccent.main },
                "&.Mui-focused fieldset": { borderColor: theme.palette.greenAccent.main },
              },
              "& .MuiInputLabel-root": { color: theme.palette.grey[100] },
              "& .MuiInputBase-input": { color: theme.palette.grey[100] },
              mb: 2,
            }}
          />
        ) : (
          <Autocomplete
            freeSolo
            options={searchResults}
            getOptionLabel={(option) => `${option.firstName || "Unknown"} ${option.lastName || ""} (${option.phoneNumber || "N/A"})`}
            onChange={handleCustomerSelect}
            onInputChange={handleInputChange}
            loading={isSearching}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search by Name"
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: isSearching ? <CircularProgress size={20} /> : params.InputProps.endAdornment,
                }}
                sx={{
                  maxWidth: "300px",
                  justifyContent: "center",
                  ml:20,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: theme.palette.grey[300] },
                    "&:hover fieldset": { borderColor: theme.palette.greenAccent.main },
                    "&.Mui-focused fieldset": { borderColor: theme.palette.greenAccent.main },
                  },
                  "& .MuiInputLabel-root": { color: theme.palette.grey[100] },
                  "& .MuiInputBase-input": { color: theme.palette.grey[100] },
                  mb: 2,
                }}
              />
            )}
          />
        )}

        {isPhoneSearch && renderPhoneSearchResults()}

        {selectedCustomer && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: theme.palette.grey[100] }}>
              Payment Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ color: theme.palette.grey[100] }}>
                  Customer: {selectedCustomer.firstName} {selectedCustomer.lastName} ({selectedCustomer.phoneNumber})
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Amount (KES)"
                  variant="outlined"
                  type="number"
                  value={formData.totalAmount}
                  onChange={handleFormChange("totalAmount")}
                  fullWidth
                  sx={{ "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: theme.palette.grey[300] }, "&:hover fieldset": { borderColor: theme.palette.greenAccent.main }, "&.Mui-focused fieldset": { borderColor: theme.palette.greenAccent.main } }, "& .MuiInputLabel-root": { color: theme.palette.grey[100] }, "& .MuiInputBase-input": { color: theme.palette.grey[100] } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Mode of Payment"
                  variant="outlined"
                  value={formData.modeOfPayment}
                  onChange={handleFormChange("modeOfPayment")}
                  fullWidth
                  sx={{ "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: theme.palette.grey[300] }, "&:hover fieldset": { borderColor: theme.palette.greenAccent.main }, "&.Mui-focused fieldset": { borderColor: theme.palette.greenAccent.main } }, "& .MuiInputLabel-root": { color: theme.palette.grey[100] }, "& .MuiInputBase-input": { color: theme.palette.grey[100] } }}
                >
                  {["CASH", "MPESA", "BANK_TRANSFER", "CREDIT_CARD", "DEBIT_CARD"].map((option) => (
                    <MenuItem key={option} value={option} sx={{ color: theme.palette.grey[100] }}>{option}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handlePaymentSubmit}
                  disabled={isProcessing}
                  fullWidth
                  sx={{ bgcolor: theme.palette.greenAccent.main, color: "#fff", "&:hover": { bgcolor: theme.palette.greenAccent.main, opacity: 0.9 }, "&:disabled": { bgcolor: theme.palette.grey[300] }, borderRadius: 20, py: 1.5 }}
                >
                  {isProcessing ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Submit Payment"}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity={snackbar.severity} sx={{ width: "100%", bgcolor: theme.palette.grey[300], color: theme.palette.grey[100] }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Box>
  );
};

export default CreatePayment;