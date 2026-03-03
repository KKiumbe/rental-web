import { useState, useEffect, useCallback } from "react";
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
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  MeetingRoom as UnitIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import TitleComponent from "../../components/title";
import axios from "axios";
import debounce from "lodash/debounce";

const CreatePayment = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const currentUser = useAuthStore((state) => state.currentUser);
  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";

  // State management
  const [searchMode,      setSearchMode]      = useState("name");   // "name" | "phone" | "unit"
  const [searchQuery,     setSearchQuery]     = useState("");
  const [searchResults,   setSearchResults]   = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSearching,     setIsSearching]     = useState(false);
  const [formData,        setFormData]        = useState({ totalAmount: "", modeOfPayment: "" });
  const [snackbar,        setSnackbar]        = useState({ open: false, message: "", severity: "info" });
  const [isProcessing,    setIsProcessing]    = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // Unified search handler — uses /search-customers endpoint
  const handleSearch = async (query, mode) => {
    const trimmedQuery = (query || "").trim();
    if (!trimmedQuery) {
      setSearchResults([]);
      return;
    }

    // Phone needs at least 10 digits
    if (mode === "phone" && trimmedQuery.length < 10) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const params = {};
      if (mode === "name")  params.name       = trimmedQuery;
      if (mode === "phone") params.phone      = trimmedQuery;
      if (mode === "unit")  params.unitNumber = trimmedQuery;

      const response = await axios.get(`${BASEURL}/search-customers`, {
        params,
        withCredentials: true,
      });
      const results = response.data?.customers || [];

      setSearchResults(results);
      if (!results.length) {
        setSnackbar({ open: true, message: "No customers found", severity: "info" });
      }
    } catch (error) {
      console.error("Search error:", error.message);
      setSnackbar({
        open: true,
        message:
          error.code === "ERR_NETWORK"
            ? "Server not reachable. Please check if the backend is running."
            : error.response?.status === 404
            ? "No customers found"
            : "Error searching customers: " + (error.response?.data?.message || error.message),
        severity: "error",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search for smoother UX
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query, mode) => handleSearch(query, mode), 500),
    []
  );

  // Handle input change
  const handleInputChange = (e, value) => {
    const newValue = e?.target?.value ?? value ?? "";
    setSearchQuery(newValue);
    setSelectedCustomer(null);
    debouncedSearch(newValue, searchMode);
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

  // Render list results (used for phone and unit search modes)
  const renderListResults = () =>
    searchResults.length > 0 && (
      <Box sx={{ mt: 1, border: "1px solid", borderColor: theme.palette.grey[700], borderRadius: 1 }}>
        {searchResults.map((customer) => (
          <Box
            key={customer.id}
            sx={{ p: 1.5, cursor: "pointer", "&:hover": { bgcolor: theme.palette.grey[800] } }}
            onClick={() => handleCustomerSelect(null, customer)}
          >
            <Typography sx={{ color: theme.palette.grey[100], fontWeight: 600 }}>
              {customer.firstName || "Unknown"} {customer.lastName || ""}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.grey[400] }}>
              {customer.phoneNumber || "N/A"} &nbsp;·&nbsp;
              Unit: {customer.unit?.unitNumber || "—"} &nbsp;·&nbsp;
              {customer.unit?.building?.name || "—"}
            </Typography>
          </Box>
        ))}
      </Box>
    );

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: theme.palette.grey[300] },
      "&:hover fieldset": { borderColor: theme.palette.greenAccent.main },
      "&.Mui-focused fieldset": { borderColor: theme.palette.greenAccent.main },
    },
    "& .MuiInputLabel-root": { color: theme.palette.grey[100] },
    "& .MuiInputBase-input": { color: theme.palette.grey[100] },
    mb: 1,
  };

  return (
    <Box sx={{ p: 3, justifyContent: "left", alignItems: "center", width: "100vw", margin: 0, boxSizing: "border-box" }}>
      <TitleComponent title="Create Payment" />
      <Paper sx={{ maxWidth: 600, ml: 30, p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2, color: theme.palette.grey[100] }}>
          Search Customer
        </Typography>

        {/* ── Search Mode Toggle ─────────────────────────────────────── */}
        <ToggleButtonGroup
          value={searchMode}
          exclusive
          onChange={(_, val) => {
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
          <ToggleButton value="name"  sx={{ color: theme.palette.grey[100], gap: 0.5 }}>
            <PersonIcon fontSize="small" /> Name
          </ToggleButton>
          <ToggleButton value="phone" sx={{ color: theme.palette.grey[100], gap: 0.5 }}>
            <PhoneIcon fontSize="small" /> Phone
          </ToggleButton>
          <ToggleButton value="unit"  sx={{ color: theme.palette.grey[100], gap: 0.5 }}>
            <UnitIcon fontSize="small" /> Unit
          </ToggleButton>
        </ToggleButtonGroup>

        {/* ── Search Input ───────────────────────────────────────────── */}
        {searchMode === "name" ? (
          <Autocomplete
            freeSolo
            options={searchResults}
            getOptionLabel={(option) =>
              typeof option === "string"
                ? option
                : `${option.firstName || "Unknown"} ${option.lastName || ""} (${option.phoneNumber || "N/A"})`
            }
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
                  startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" /></InputAdornment>,
                  endAdornment: isSearching ? <CircularProgress size={20} /> : params.InputProps.endAdornment,
                }}
                sx={inputSx}
              />
            )}
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
                    {searchMode === "phone" ? <PhoneIcon fontSize="small" /> : <UnitIcon fontSize="small" />}
                  </InputAdornment>
                ),
                endAdornment: isSearching ? <CircularProgress size={20} /> : null,
              }}
              sx={inputSx}
            />
            {renderListResults()}
          </>
        )}

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
                {selectedCustomer.unit && (
                  <Typography variant="caption" sx={{ color: theme.palette.grey[400] }}>
                    Unit {selectedCustomer.unit.unitNumber} · {selectedCustomer.unit.building?.name || "—"}
                  </Typography>
                )}
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