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
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import axios from "axios";
import TitleComponent from "../../components/title";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/authStore";
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
  const [searchMode, setSearchMode] = useState<"name" | "phone" | "unit">("name");
  const [searchQuery, setSearchQuery] = useState("");
  // Define a type for Customer
  type Customer = {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    category?: string;
    monthlyCharge?: number;
    closingBalance?: number;
    unit?: {
      unitNumber?: string;
      building?: { name?: string };
    };
  };

  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ description: "", amount: "", quantity: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Clean search query (strip parenthetical hints added by Autocomplete labels)
  const cleanSearchQuery = (query: string) => query.replace(/\s*\([^)]+\)/g, "").trim();

  // Unified search handler — uses /search-customers with name, phone, or unitNumber
  const handleSearch = async (query: string, mode: "name" | "phone" | "unit") => {
    const trimmed = cleanSearchQuery(query);
    if (!trimmed) { setSearchResults([]); return; }
    if (mode === "phone" && trimmed.length < 10) { setSearchResults([]); return; }

    setIsSearching(true);
    try {
      const params: Record<string, string> = {};
      if (mode === "name")  params.name       = trimmed;
      if (mode === "phone") params.phone      = trimmed;
      if (mode === "unit")  params.unitNumber = trimmed;

      const response = await axios.get(`${BASEURL}/search-customers`, { params, withCredentials: true });
      const results: Customer[] = response.data?.customers || [];

      setSearchResults(results);
      if (!results.length) {
        setSnackbar({ open: true, message: "No customers found", severity: "info" });
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setSnackbar({
        open: true,
        message:
          err.response?.status === 404
            ? "No customers found"
            : `Error searching customers: ${err.response?.data?.message || err.message}`,
        severity: "error",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: string, mode: "name" | "phone" | "unit") => handleSearch(query, mode), 500),
    []
  );

  // Handle input change for Autocomplete (name mode)
  const handleInputChange = (_e: any, value: string) => {
    setSearchQuery(value);
    setSelectedCustomer(null);
    debouncedSearch(value, searchMode);
  };

  // Handle customer selection
  const handleCustomerSelect = (_event: any, newValue: Customer | null) => {
    setSelectedCustomer(newValue);
    if (newValue) { setSearchQuery(""); setSearchResults([]); }
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

  // Render result list (used for phone and unit modes)
  const renderListResults = () =>
    searchResults.length > 0 ? (
      <Card sx={{ mt: 1, mb: 2 }}>
        <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
            Results ({searchResults.length})
          </Typography>
          {searchResults.map((customer) => (
            <Box
              key={customer.id}
              sx={{ p: 1, cursor: "pointer", borderRadius: 1, "&:hover": { backgroundColor: theme.palette.action.hover } }}
              onClick={() => { setSelectedCustomer(customer); setSearchResults([]); setSearchQuery(""); }}
            >
              <Typography variant="body2" fontWeight={600}>
                {customer.firstName} {customer.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {customer.phoneNumber || "N/A"} &nbsp;·&nbsp;
                Unit: {customer.unit?.unitNumber || "—"} &nbsp;·&nbsp;
                {customer.unit?.building?.name || "—"}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    ) : null;

  // Render selected customer card
  const renderSelectedCustomer = () =>
    selectedCustomer && (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6">Selected Customer</Typography>
          <Typography>Name: {`${selectedCustomer.firstName} ${selectedCustomer.lastName}`}</Typography>
          <Typography>Phone: {selectedCustomer.phoneNumber}</Typography>
          <Typography>Unit: {selectedCustomer.unit?.unitNumber || "—"} · {selectedCustomer.unit?.building?.name || "—"}</Typography>
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

        {/* ── Search Mode Toggle ───────────────────────────────────────── */}
        <ToggleButtonGroup
          value={searchMode}
          exclusive
          onChange={(_e, val) => {
            if (val) {
              setSearchMode(val);
              setSearchQuery("");
              setSearchResults([]);
              setSelectedCustomer(null);
            }
          }}
          size="small"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="name"  sx={{ gap: 0.5 }}><PersonIcon fontSize="small" /> Name</ToggleButton>
          <ToggleButton value="phone" sx={{ gap: 0.5 }}><PhoneIcon fontSize="small" /> Phone</ToggleButton>
          <ToggleButton value="unit"  sx={{ gap: 0.5 }}><MeetingRoomIcon fontSize="small" /> Unit</ToggleButton>
        </ToggleButtonGroup>

        {/* ── Search Input ─────────────────────────────────────────────── */}
        {searchMode === "name" ? (
          <Autocomplete
            options={searchResults}
            getOptionLabel={(option) => `${option?.firstName} ${option?.lastName} (${option?.phoneNumber})`}
            onInputChange={handleInputChange}
            onChange={handleCustomerSelect}
            loading={isSearching}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search by Name"
                variant="outlined"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" /></InputAdornment>,
                  endAdornment: isSearching ? <CircularProgress size={20} /> : params.InputProps.endAdornment,
                }}
              />
            )}
            sx={{ mb: 2 }}
          />
        ) : (
          <>
            <TextField
              label={searchMode === "phone" ? "Search by Phone" : "Search by Unit Number"}
              variant="outlined"
              value={searchQuery}
              onChange={(e) => {
                const v = e.target.value;
                setSearchQuery(v);
                setSelectedCustomer(null);
                debouncedSearch(v, searchMode);
              }}
              fullWidth
              disabled={isSearching}
              inputProps={{ maxLength: searchMode === "phone" ? 15 : 20 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {searchMode === "phone" ? <PhoneIcon fontSize="small" /> : <MeetingRoomIcon fontSize="small" />}
                  </InputAdornment>
                ),
                endAdornment: isSearching ? <CircularProgress size={20} /> : undefined,
              }}
              sx={{ mb: 1 }}
            />
            {renderListResults()}
          </>
        )}

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