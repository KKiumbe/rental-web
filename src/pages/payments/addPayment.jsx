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
  Divider,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
  Chip,
} from "@mui/material";
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  MeetingRoom as UnitIcon,
  Payments as PaymentsIcon,
  CheckCircleOutline as CheckCircleIcon,
  AccountBalanceWallet as WalletIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { getTheme } from "../../store/theme";
import axios from "axios";
import debounce from "lodash/debounce";

const PAYMENT_MODES = ["CASH", "MPESA", "BANK_TRANSFER", "CREDIT_CARD", "DEBIT_CARD"];

const modeColor = (mode) => {
  if (mode === "MPESA")         return "#4caf50";
  if (mode === "CASH")          return "#1976d2";
  if (mode === "BANK_TRANSFER") return "#9c27b0";
  return "#90a4ae";
};

const CreatePayment = () => {
  const navigate = useNavigate();
  const theme = getTheme();
  const currentUser = useAuthStore((state) => state.currentUser);
  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";

  const [searchMode,       setSearchMode]       = useState("name");
  const [searchQuery,      setSearchQuery]      = useState("");
  const [searchResults,    setSearchResults]    = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSearching,      setIsSearching]      = useState(false);
  const [formData,         setFormData]         = useState({ totalAmount: "", modeOfPayment: "" });
  const [snackbar,         setSnackbar]         = useState({ open: false, message: "", severity: "info" });
  const [isProcessing,     setIsProcessing]     = useState(false);
  const [submitted,        setSubmitted]        = useState(false);

  const isDark        = theme.palette.mode === "dark";
  const surfaceBg     = isDark ? "#141824" : "#f4f6fb";
  const cardBg        = isDark ? "#1c2030" : "#ffffff";
  const borderColor   = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const headerBg      = isDark ? "#181d2e" : "#f0f3f9";
  const textPrimary   = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const accentGreen   = theme.palette.greenAccent.main;
  const accentBlue    = theme.palette.blueAccent?.main || "#1976d2";

  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  const handleSearch = async (query, mode) => {
    const q = (query || "").trim();
    if (!q) { setSearchResults([]); return; }
    if (mode === "phone" && q.length < 10) { setSearchResults([]); return; }

    setIsSearching(true);
    try {
      const params = {};
      if (mode === "name")  params.name       = q;
      if (mode === "phone") params.phone      = q;
      if (mode === "unit")  params.unitNumber = q;

      const { data } = await axios.get(`${BASEURL}/search-customers`, { params, withCredentials: true });
      const results = data?.customers || [];
      setSearchResults(results);
      if (!results.length) {
        setSnackbar({ open: true, message: "No customers found", severity: "info" });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err.code === "ERR_NETWORK"
            ? "Server not reachable."
            : err.response?.status === 404
            ? "No customers found"
            : "Search error: " + (err.response?.data?.message || err.message),
        severity: "error",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(debounce((q, m) => handleSearch(q, m), 500), []);

  const handleInputChange = (e, value) => {
    const v = e?.target?.value ?? value ?? "";
    setSearchQuery(v);
    setSelectedCustomer(null);
    debouncedSearch(v, searchMode);
  };

  const handleCustomerSelect = (_, newValue) => {
    setSelectedCustomer(newValue);
    if (newValue) { setSearchQuery(""); setSearchResults([]); }
  };

  const handleFormChange = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handlePaymentSubmit = async () => {
    const { totalAmount, modeOfPayment } = formData;
    if (!selectedCustomer || !totalAmount || !modeOfPayment) {
      setSnackbar({ open: true, message: "Please fill in all payment details", severity: "error" });
      return;
    }
    setIsProcessing(true);
    try {
      await axios.post(
        `${BASEURL}/manual-cash-payment`,
        {
          customerId: selectedCustomer.id,
          totalAmount: parseFloat(totalAmount),
          modeOfPayment,
          paidBy: selectedCustomer.firstName,
        },
        { withCredentials: true }
      );
      setSubmitted(true);
      setSnackbar({ open: true, message: "Payment recorded successfully", severity: "success" });
      setTimeout(() => navigate("/payments"), 2200);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Error recording payment: " + (err.response?.data?.message || err.message),
        severity: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetSearch = () => {
    setSearchMode("name");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedCustomer(null);
    setFormData({ totalAmount: "", modeOfPayment: "" });
    setSubmitted(false);
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 1.5,
      bgcolor: isDark ? alpha("#fff", 0.04) : alpha("#000", 0.02),
      "& fieldset": { borderColor },
      "&:hover fieldset": { borderColor: accentGreen },
      "&.Mui-focused fieldset": { borderColor: accentGreen, borderWidth: 1.5 },
    },
    "& .MuiInputLabel-root": { color: textSecondary },
    "& .MuiInputLabel-root.Mui-focused": { color: accentGreen },
    "& .MuiInputBase-input": { color: textPrimary },
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: surfaceBg, p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>

      {/* Page Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 46, height: 46, borderRadius: 2,
            bgcolor: alpha(accentGreen, 0.12),
            border: `1px solid ${alpha(accentGreen, 0.2)}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <PaymentsIcon sx={{ color: accentGreen, fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: textPrimary, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            Record Payment
          </Typography>
          <Typography variant="caption" sx={{ color: textSecondary }}>
            Search for a tenant, then enter payment details
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap", alignItems: "flex-start" }}>

        {/* ── Left card: Customer search ───────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            flex: "1 1 340px", maxWidth: 480,
            borderRadius: 2, border: `1px solid ${borderColor}`, bgcolor: cardBg,
            overflow: "hidden",
          }}
        >
          {/* Card header */}
          <Box sx={{ px: 2.5, py: 1.75, bgcolor: headerBg, borderBottom: `1px solid ${borderColor}`, display: "flex", alignItems: "center", gap: 1 }}>
            <PersonIcon sx={{ color: accentGreen, fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: textPrimary }}>
              Find Tenant
            </Typography>
          </Box>

          <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Search mode toggle */}
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
              sx={{
                "& .MuiToggleButton-root": {
                  borderColor, color: textSecondary, textTransform: "none",
                  fontWeight: 600, fontSize: "0.8rem", gap: 0.5, borderRadius: "8px !important",
                  "&.Mui-selected": {
                    bgcolor: alpha(accentGreen, 0.12),
                    color: accentGreen,
                    borderColor: alpha(accentGreen, 0.3),
                  },
                  "&:hover": { bgcolor: alpha(accentGreen, 0.07) },
                },
              }}
            >
              <ToggleButton value="name"><PersonIcon fontSize="small" /> Name</ToggleButton>
              <ToggleButton value="phone"><PhoneIcon fontSize="small" /> Phone</ToggleButton>
              <ToggleButton value="unit"><UnitIcon fontSize="small" /> Unit</ToggleButton>
            </ToggleButtonGroup>

            {/* Search input */}
            {searchMode === "name" ? (
              <Autocomplete
                freeSolo
                options={searchResults}
                getOptionLabel={(opt) =>
                  typeof opt === "string"
                    ? opt
                    : `${opt.firstName || ""} ${opt.lastName || ""} (${opt.phoneNumber || "N/A"})`
                }
                onChange={handleCustomerSelect}
                onInputChange={handleInputChange}
                loading={isSearching}
                renderOption={(props, opt) => (
                  <Box component="li" {...props} sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", py: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: textPrimary }}>
                      {opt.firstName} {opt.lastName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: textSecondary }}>
                      {opt.phoneNumber || "N/A"} &nbsp;·&nbsp; Unit {opt.unit?.unitNumber || "\u2014"} &nbsp;·&nbsp; {opt.unit?.building?.name || "\u2014"}
                    </Typography>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search by name"
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ fontSize: 16, color: textSecondary }} />
                        </InputAdornment>
                      ),
                      endAdornment: isSearching
                        ? <CircularProgress size={16} sx={{ color: accentGreen }} />
                        : params.InputProps.endAdornment,
                    }}
                    sx={fieldSx}
                  />
                )}
              />
            ) : (
              <Box>
                <TextField
                  label={searchMode === "phone" ? "Search by phone" : "Search by unit number"}
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedCustomer(null);
                    debouncedSearch(e.target.value, searchMode);
                  }}
                  fullWidth
                  disabled={isSearching}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {searchMode === "phone"
                          ? <PhoneIcon sx={{ fontSize: 16, color: textSecondary }} />
                          : <UnitIcon  sx={{ fontSize: 16, color: textSecondary }} />}
                      </InputAdornment>
                    ),
                    endAdornment: isSearching ? <CircularProgress size={16} sx={{ color: accentGreen }} /> : null,
                  }}
                  sx={fieldSx}
                />

                {/* Search results list */}
                {searchResults.length > 0 && (
                  <Paper
                    elevation={0}
                    sx={{
                      mt: 0.5, border: `1px solid ${borderColor}`, borderRadius: 1.5,
                      bgcolor: cardBg, overflow: "hidden", maxHeight: 240, overflowY: "auto",
                    }}
                  >
                    {searchResults.map((c, i) => (
                      <Box
                        key={c.id}
                        onClick={() => handleCustomerSelect(null, c)}
                        sx={{
                          px: 2, py: 1.25, cursor: "pointer",
                          borderBottom: i < searchResults.length - 1 ? `1px solid ${borderColor}` : "none",
                          "&:hover": { bgcolor: isDark ? alpha("#fff", 0.04) : alpha("#000", 0.03) },
                          transition: "background 0.12s ease",
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, color: textPrimary }}>
                          {c.firstName} {c.lastName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: textSecondary }}>
                          {c.phoneNumber || "N/A"} &nbsp;·&nbsp; Unit {c.unit?.unitNumber || "\u2014"} &nbsp;·&nbsp; {c.unit?.building?.name || "\u2014"}
                        </Typography>
                      </Box>
                    ))}
                  </Paper>
                )}
              </Box>
            )}

            {/* Selected customer card */}
            {selectedCustomer && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.75, borderRadius: 1.5,
                  border: `1px solid ${alpha(accentGreen, 0.3)}`,
                  bgcolor: alpha(accentGreen, 0.06),
                  display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1,
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary }}>
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: textSecondary, display: "block" }}>
                    {selectedCustomer.phoneNumber || "N/A"}
                  </Typography>
                  {selectedCustomer.unit && (
                    <Typography variant="caption" sx={{ color: textSecondary }}>
                      Unit {selectedCustomer.unit.unitNumber} &nbsp;·&nbsp; {selectedCustomer.unit.building?.name || "\u2014"}
                    </Typography>
                  )}
                </Box>
                <Chip
                  label="Selected"
                  size="small"
                  sx={{ bgcolor: alpha(accentGreen, 0.15), color: accentGreen, fontWeight: 700, fontSize: "0.68rem", height: 22 }}
                />
              </Paper>
            )}
          </Box>
        </Paper>

        {/* ── Right card: Payment details ──────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            flex: "1 1 300px", maxWidth: 440,
            borderRadius: 2, border: `1px solid ${borderColor}`, bgcolor: cardBg,
            overflow: "hidden",
            opacity: selectedCustomer ? 1 : 0.55,
            pointerEvents: selectedCustomer ? "auto" : "none",
            transition: "opacity 0.2s ease",
          }}
        >
          {/* Card header */}
          <Box sx={{ px: 2.5, py: 1.75, bgcolor: headerBg, borderBottom: `1px solid ${borderColor}`, display: "flex", alignItems: "center", gap: 1 }}>
            <WalletIcon sx={{ color: accentBlue, fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: textPrimary }}>
              Payment Details
            </Typography>
            {!selectedCustomer && (
              <Typography variant="caption" sx={{ color: textSecondary, ml: "auto" }}>
                Select a tenant first
              </Typography>
            )}
          </Box>

          <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Amount */}
            <TextField
              label="Amount (KES)"
              variant="outlined"
              size="small"
              type="number"
              value={formData.totalAmount}
              onChange={handleFormChange("totalAmount")}
              fullWidth
              inputProps={{ min: 0 }}
              sx={fieldSx}
            />

            {/* Mode of payment */}
            <TextField
              select
              label="Mode of Payment"
              variant="outlined"
              size="small"
              value={formData.modeOfPayment}
              onChange={handleFormChange("modeOfPayment")}
              fullWidth
              sx={fieldSx}
            >
              {PAYMENT_MODES.map((m) => (
                <MenuItem key={m} value={m}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: modeColor(m) }} />
                    <Typography variant="body2" sx={{ color: textPrimary }}>{m.replace("_", " ")}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </TextField>

            <Divider sx={{ borderColor }} />

            {/* Summary preview */}
            {formData.totalAmount && formData.modeOfPayment && selectedCustomer && (
              <Box
                sx={{
                  p: 1.5, borderRadius: 1.5,
                  border: `1px solid ${borderColor}`,
                  bgcolor: isDark ? alpha("#fff", 0.03) : alpha("#000", 0.02),
                  display: "flex", flexDirection: "column", gap: 0.5,
                }}
              >
                <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Summary
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                  <Typography variant="body2" sx={{ color: textSecondary }}>Tenant</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: textPrimary }}>
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ color: textSecondary }}>Amount</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: accentGreen }}>
                    KES {Number(formData.totalAmount).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ color: textSecondary }}>Mode</Typography>
                  <Chip
                    label={formData.modeOfPayment.replace("_", " ")}
                    size="small"
                    sx={{
                      height: 20, fontSize: "0.68rem", fontWeight: 700,
                      bgcolor: alpha(modeColor(formData.modeOfPayment), 0.12),
                      color: modeColor(formData.modeOfPayment),
                      border: `1px solid ${modeColor(formData.modeOfPayment)}`,
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Submit */}
            <Button
              variant="contained"
              onClick={handlePaymentSubmit}
              disabled={isProcessing || submitted || !selectedCustomer || !formData.totalAmount || !formData.modeOfPayment}
              fullWidth
              startIcon={submitted ? <CheckCircleIcon /> : isProcessing ? null : <PaymentsIcon />}
              sx={{
                mt: 0.5,
                bgcolor: submitted ? alpha("#4caf50", 0.15) : accentGreen,
                color: submitted ? "#4caf50" : "#fff",
                border: submitted ? "1px solid #4caf50" : "none",
                textTransform: "none", fontWeight: 700, borderRadius: 1.5, py: 1.2,
                boxShadow: submitted ? "none" : `0 2px 12px ${alpha(accentGreen, 0.35)}`,
                "&:hover": {
                  bgcolor: submitted ? alpha("#4caf50", 0.2) : (theme.palette.greenAccent.dark || accentGreen),
                  boxShadow: submitted ? "none" : `0 4px 18px ${alpha(accentGreen, 0.45)}`,
                },
                "&:disabled": {
                  bgcolor: isDark ? alpha("#fff", 0.06) : alpha("#000", 0.06),
                  color: textSecondary,
                  boxShadow: "none",
                },
                transition: "all 0.2s ease",
              }}
            >
              {isProcessing
                ? <CircularProgress size={20} sx={{ color: "#fff" }} />
                : submitted
                ? "Payment Recorded"
                : "Submit Payment"}
            </Button>

            {submitted && (
              <Button
                variant="text"
                onClick={resetSearch}
                size="small"
                sx={{ color: textSecondary, textTransform: "none", fontSize: "0.8rem", "&:hover": { color: accentGreen } }}
              >
                Record another payment
              </Button>
            )}
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }} onClose={() => setSnackbar((p) => ({ ...p, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreatePayment;
