import React, { useEffect, useState, useCallback } from "react";
import {
  TextField,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Typography,
  Autocomplete,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
  Box,
} from "@mui/material";
import axios from "axios";
import TitleComponent from "../components/title";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/authStore";
import debounce from "lodash/debounce";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const CreateInvoice = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const darkMode = useThemeStore((state) => state.darkMode);
  const currentUser = useAuthStore((state) => state.currentUser);

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({ description: "", amount: "", quantity: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPhoneSearch, setIsPhoneSearch] = useState(false);
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null); // New state for month-year picker

  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";

  // Debug theme
  useEffect(() => {
    //console.log("Theme Mode:", theme.palette.mode);
    //console.log("background.default:", theme.palette.background.default);
    //console.log("background.paper:", theme.palette.background.paper);
  }, [theme, darkMode]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // Clean search query
  const cleanSearchQuery = (query) => query.replace(/\s*\([^)]+\)/g, "").trim();

  // Unified search handler
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const isPhoneNumber = /^\d+$/.test(query);

    try {
      const url = isPhoneNumber
        ? `${BASEURL}/search-customer-by-phone`
        : `${BASEURL}/search-customer-by-name`;
      const params = isPhoneNumber ? { phone: query } : { name: cleanSearchQuery(query) };

      if (isPhoneNumber && query.length < 10) {
        setSearchResults([]);
        return;
      }

      const response = await axios.get(url, { params, withCredentials: true });
      const results = isPhoneNumber
        ? [response.data]
        : Array.isArray(response.data) ? response.data : [];

      setSearchResults(results.length ? results : []);
      if (!results.length) {
        setSnackbar({
          open: true,
          message: isPhoneNumber ? "No customer found with that phone number" : "No customer found with that name",
          severity: "info",
        });
      }
    } catch (error) {
      console.error("Search error:", error.response || error);
      setSnackbar({
        open: true,
        message: error.response?.status === 404
          ? isPhoneNumber
            ? "No customer found with that phone number"
            : "No customer found with that name"
          : `Error searching customers: ${error.response?.data?.message || error.message}`,
        severity: "error",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced phone search
  const debouncedPhoneSearch = useCallback(
    debounce((query) => {
      if (isPhoneSearch) handleSearch(query);
    }, 500),
    [isPhoneSearch]
  );

  // Handle input change for search
  const handleInputChange = (e, value) => {
    const newValue = e ? e.target.value : value;
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
    if (!isPhoneSearch && newValue) {
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  // Handle form field changes
  const handleFormChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Create invoice for a single customer
  const handleCreateInvoice = async () => {
    const { description, amount, quantity } = formData;
    if (!description || !amount || !quantity || !selectedCustomer) {
      setSnackbar({ open: true, message: "Please fill in all fields and select a customer", severity: "error" });
      return;
    }

    const invoiceData = {
      customerId: selectedCustomer.id,
      invoiceItemsData: [{ description, amount: parseFloat(amount), quantity: parseInt(quantity) }],
    };

    setLoading(true);
    try {
      const response = await axios.post(`${BASEURL}/create-invoice`, invoiceData, { withCredentials: true });
      setSnackbar({ open: true, message: "Invoice created successfully!", severity: "success" });
      navigate(`/get-invoice/${response.data.newInvoice.id}`);
    } catch (error) {
      console.error("Error creating invoice:", error);
      setSnackbar({ open: true, message: "Failed to create invoice. Please try again.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Open the generate invoices dialog
  const handleGenerateAllClick = () => {
    setOpenGenerateDialog(true);
  };

  // Format the selected period to YYYY-MM
  const formatPeriod = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    return `${year}-${month}`;
  };

  // Generate invoices for all active customers
  const handleGenerateAllConfirm = async () => {
    if (!selectedPeriod) {
      setSnackbar({ open: true, message: "Please select a billing period", severity: "error" });
      return;
    }

    const period = formatPeriod(selectedPeriod);
    setLoading(true);
    setOpenGenerateDialog(false);
    try {
      await axios.post(
        `${BASEURL}/generate-invoices-for-all`,
        { period },
        { withCredentials: true }
      );
      setSnackbar({
        open: true,
        message: `Invoices generated successfully for all active customers for ${period}!`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error generating invoices for all:", error);
      setSnackbar({
        open: true,
        message: `Failed to generate invoices for ${period}. Please try again.`,
        severity: "error",
      });
    } finally {
      setLoading(false);
      setSelectedPeriod(null); // Reset the period after submission
    }
  };

  // Render search results for phone search
  const renderPhoneSearchResults = () =>
    searchResults.length > 0 ? (
      <Card sx={{ mt: 2, mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Search Results</Typography>
          {searchResults.map((customer) => (
            <Box
              key={customer.id}
              sx={{ p: 1, cursor: "pointer", "&:hover": { backgroundColor: theme.palette.grey[100] } }}
              onClick={() => setSelectedCustomer(customer)}
            >
              <Typography>{`${customer.firstName} ${customer.lastName} (${customer.phoneNumber})`}</Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    ) : (
      !isSearching &&
      searchQuery &&
      searchQuery.length >= 10 && (
        <Card sx={{ mt: 2, mb: 2 }}>
          <CardContent>
            <Typography variant="h6">Search Results</Typography>
            <Typography>No customer found with phone number: {searchQuery}</Typography>
          </CardContent>
        </Card>
      )
    );

  // Render selected customer
  const renderSelectedCustomer = () =>
    selectedCustomer && (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6">Selected Customer</Typography>
          <Typography>Name: {`${selectedCustomer.firstName} ${selectedCustomer.lastName}`}</Typography>
          <Typography>Phone: {selectedCustomer.phoneNumber}</Typography>
          <Typography>Category: {selectedCustomer.category}</Typography>
          <Typography>Monthly Charge: {selectedCustomer.monthlyCharge}</Typography>
          <Typography>Closing Balance: {selectedCustomer.closingBalance}</Typography>
        </CardContent>
      </Card>
    );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        bgcolor: theme.palette.background.paper,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 0,
      }}
    >
      {/* Generate Invoices for All Button */}
      <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end", ml: 100 }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleGenerateAllClick}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Generate Invoices for All Customers"}
        </Button>
      </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: 600, width: "100%" }}>
        <TitleComponent title="Create an Invoice" />

        {/* Search Input */}
        {isPhoneSearch ? (
          <TextField
            label="Search Customer by Phone"
            variant="outlined"
            value={searchQuery}
            onChange={handleInputChange}
            fullWidth
            disabled={isSearching}
            inputProps={{ maxLength: 15 }}
            sx={{ mb: 2 }}
          />
        ) : (
          <Autocomplete
            options={searchResults}
            getOptionLabel={(option) => `${option?.firstName} ${option?.lastName} (${option?.phoneNumber})`}
            onInputChange={handleInputChange}
            onChange={handleCustomerSelect}
            loading={isSearching}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Customer by Name"
                variant="outlined"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: isSearching ? <CircularProgress size={20} /> : params.InputProps.endAdornment,
                }}
              />
            )}
            sx={{ mb: 2 }}
          />
        )}

        {/* Phone Search Results */}
        {isPhoneSearch && renderPhoneSearchResults()}

        {/* Selected Customer */}
        {renderSelectedCustomer()}

        {/* Invoice Form */}
        <TextField
          label="Description"
          value={formData.description}
          onChange={handleFormChange("description")}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Amount"
          value={formData.amount}
          onChange={handleFormChange("amount")}
          fullWidth
          margin="normal"
          type="number"
        />
        <TextField
          label="Quantity"
          value={formData.quantity}
          onChange={handleFormChange("quantity")}
          fullWidth
          margin="normal"
          type="number"
          inputProps={{ min: 0, step: 1 }}
        />

        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateInvoice}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Create Invoice"}
          </Button>
        </Box>
      </Box>

      {/* Generate Invoices for All Confirmation Dialog */}
      <Dialog
        open={openGenerateDialog}
        onClose={() => {
          setOpenGenerateDialog(false);
          setSelectedPeriod(null); // Reset period on close
        }}
        aria-labelledby="generate-dialog-title"
        aria-describedby="generate-dialog-description"
      >
        <DialogTitle id="generate-dialog-title">Confirm Generate Invoices</DialogTitle>
        <DialogContent>
          <DialogContentText id="generate-dialog-description">
            This action will create invoices for all active customers and update their balances for the selected period. This cannot be undone. Are you sure you want to proceed?
          </DialogContentText>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              views={["year", "month"]}
              label="Select Billing Period (Year-Month)"
              value={selectedPeriod}
              onChange={(newValue) => setSelectedPeriod(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  margin="normal"
                  helperText="Format: YYYY-MM (e.g., 2025-04)"
                />
              )}
              maxDate={new Date()} // Prevent future dates
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenGenerateDialog(false);
              setSelectedPeriod(null);
            }}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerateAllConfirm}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateInvoice;