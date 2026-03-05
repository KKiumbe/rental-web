import { useEffect, useState, useCallback } from "react";
import {
  TextField,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
  Autocomplete,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Paper,
  Divider,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
  Chip,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { getTheme } from "../../store/theme";
import debounce from "lodash/debounce";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

type SearchMode = "name" | "phone" | "unit";

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

const CreateInvoice = () => {
  const navigate = useNavigate();
  const theme = getTheme();
  const currentUser = useAuthStore((state) => state.currentUser);
  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";

  const [searchMode,       setSearchMode]       = useState<SearchMode>("name");
  const [searchQuery,      setSearchQuery]      = useState("");
  const [searchResults,    setSearchResults]    = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData,         setFormData]         = useState({ description: "", amount: "", quantity: "" });
  const [snackbar,         setSnackbar]         = useState({ open: false, message: "", severity: "success" as "success" | "error" | "info" | "warning" });
  const [isSearching,      setIsSearching]      = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [submitted,        setSubmitted]        = useState(false);
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [selectedPeriod,   setSelectedPeriod]   = useState<Date | null | undefined>(null);
  const [generating,       setGenerating]       = useState(false);

  const isDark        = theme.palette.mode === "dark";
  const surfaceBg     = isDark ? "#141824" : "#f4f6fb";
  const cardBg        = isDark ? "#1c2030" : "#ffffff";
  const borderColor   = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const headerBg      = isDark ? "#181d2e" : "#f0f3f9";
  const textPrimary   = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const accentGreen   = theme.palette.greenAccent.main;
  const accentBlue    = (theme.palette as any).blueAccent?.main || "#1976d2";

  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  const cleanQuery = (q: string) => q.replace(/\s*\([^)]+\)/g, "").trim();

  const handleSearch = async (query: string, mode: SearchMode) => {
    const q = cleanQuery(query);
    if (!q) { setSearchResults([]); return; }
    if (mode === "phone" && q.length < 10) { setSearchResults([]); return; }

    setIsSearching(true);
    try {
      const params: Record<string, string> = {};
      if (mode === "name")  params.name       = q;
      if (mode === "phone") params.phone      = q;
      if (mode === "unit")  params.unitNumber = q;

      const { data } = await axios.get(`${BASEURL}/search-customers`, { params, withCredentials: true });
      const results: Customer[] = data?.customers || [];
      setSearchResults(results);
      if (!results.length) setSnackbar({ open: true, message: "No customers found", severity: "info" });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.status === 404 ? "No customers found" : `Search error: ${err.response?.data?.message || err.message}`,
        severity: "error",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(debounce((q: string, m: SearchMode) => handleSearch(q, m), 500), []);

  const handleInputChange = (_e: any, value: string) => {
    setSearchQuery(value);
    setSelectedCustomer(null);
    debouncedSearch(value, searchMode);
  };

  const handleCustomerSelect = (_: any, val: Customer | null) => {
    setSelectedCustomer(val);
    if (val) { setSearchQuery(""); setSearchResults([]); }
  };

  const handleFormChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleCreateInvoice = async () => {
    const { description, amount, quantity } = formData;
    if (!description || !amount || !quantity || !selectedCustomer) {
      setSnackbar({ open: true, message: "Please fill in all fields and select a customer", severity: "error" });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${BASEURL}/create-invoice`,
        { customerId: selectedCustomer.id, invoiceItemsData: [{ description, amount: parseFloat(amount), quantity: parseInt(quantity) }] },
        { withCredentials: true }
      );
      setSubmitted(true);
      setSnackbar({ open: true, message: "Invoice created successfully!", severity: "success" });
      setTimeout(() => navigate(`/get-invoice/${res.data.newInvoice.id}`), 1800);
    } catch {
      setSnackbar({ open: true, message: "Failed to create invoice. Please try again.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const formatPeriod = (date: Date | null | undefined): string => {
    if (!date) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  const handleGenerateAllConfirm = async () => {
    if (!selectedPeriod) {
      setSnackbar({ open: true, message: "Please select a billing period", severity: "error" });
      return;
    }
    const period = formatPeriod(selectedPeriod);
    setGenerating(true);
    setOpenGenerateDialog(false);
    try {
      await axios.post(`${BASEURL}/generate-invoices-for-all`, { period }, { withCredentials: true });
      setSnackbar({ open: true, message: `Invoices generated for all active customers — ${period}`, severity: "success" });
    } catch (err: any) {
      setSnackbar({ open: true, message: `Failed to generate invoices for ${period}.`, severity: "error" });
    } finally {
      setGenerating(false);
      setSelectedPeriod(null);
    }
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

  const isFormReady = !!(selectedCustomer && formData.description && formData.amount && formData.quantity);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: surfaceBg, p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>

      {/* Page Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 46, height: 46, borderRadius: 2,
              bgcolor: alpha(accentGreen, 0.12),
              border: `1px solid ${alpha(accentGreen, 0.2)}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ReceiptLongIcon sx={{ color: accentGreen, fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: textPrimary, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              Create Invoice
            </Typography>
            <Typography variant="caption" sx={{ color: textSecondary }}>
              Select a tenant and fill in invoice details
            </Typography>
          </Box>
        </Box>

        {/* Generate All button */}
        <Button
          variant="outlined"
          startIcon={generating ? <CircularProgress size={14} sx={{ color: accentGreen }} /> : <AutorenewIcon />}
          onClick={() => setOpenGenerateDialog(true)}
          disabled={generating}
          size="small"
          sx={{
            borderColor: alpha(accentBlue, 0.4), color: accentBlue,
            textTransform: "none", fontWeight: 600, borderRadius: 1.5, px: 2,
            "&:hover": { borderColor: accentBlue, bgcolor: alpha(accentBlue, 0.07) },
          }}
        >
          {generating ? "Generating…" : "Generate All Invoices"}
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap", alignItems: "flex-start" }}>

        {/* ── Left card: Find Tenant ───────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            flex: "1 1 340px", maxWidth: 480,
            borderRadius: 2, border: `1px solid ${borderColor}`, bgcolor: cardBg, overflow: "hidden",
          }}
        >
          <Box sx={{ px: 2.5, py: 1.75, bgcolor: headerBg, borderBottom: `1px solid ${borderColor}`, display: "flex", alignItems: "center", gap: 1 }}>
            <PersonIcon sx={{ color: accentGreen, fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: textPrimary }}>Find Tenant</Typography>
          </Box>

          <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Search mode toggle */}
            <ToggleButtonGroup
              value={searchMode}
              exclusive
              onChange={(_e, val) => {
                if (val) { setSearchMode(val); setSearchQuery(""); setSearchResults([]); setSelectedCustomer(null); }
              }}
              size="small"
              sx={{
                "& .MuiToggleButton-root": {
                  borderColor, color: textSecondary, textTransform: "none",
                  fontWeight: 600, fontSize: "0.8rem", gap: 0.5, borderRadius: "8px !important",
                  "&.Mui-selected": { bgcolor: alpha(accentGreen, 0.12), color: accentGreen, borderColor: alpha(accentGreen, 0.3) },
                  "&:hover": { bgcolor: alpha(accentGreen, 0.07) },
                },
              }}
            >
              <ToggleButton value="name"><PersonIcon fontSize="small" /> Name</ToggleButton>
              <ToggleButton value="phone"><PhoneIcon fontSize="small" /> Phone</ToggleButton>
              <ToggleButton value="unit"><MeetingRoomIcon fontSize="small" /> Unit</ToggleButton>
            </ToggleButtonGroup>

            {/* Search input */}
            {searchMode === "name" ? (
              <Autocomplete
                freeSolo
                options={searchResults}
                getOptionLabel={(opt) =>
                  typeof opt === "string" ? opt : `${opt.firstName || ""} ${opt.lastName || ""} (${opt.phoneNumber || "N/A"})`
                }
                onChange={handleCustomerSelect}
                onInputChange={handleInputChange}
                loading={isSearching}
                renderOption={(props, opt) => (
                  <Box component="li" {...props} sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", py: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: textPrimary }}>
                      {(opt as Customer).firstName} {(opt as Customer).lastName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: textSecondary }}>
                      {(opt as Customer).phoneNumber || "N/A"} &nbsp;·&nbsp;
                      Unit {(opt as Customer).unit?.unitNumber || "\u2014"} &nbsp;·&nbsp;
                      {(opt as Customer).unit?.building?.name || "\u2014"}
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
                          : <MeetingRoomIcon sx={{ fontSize: 16, color: textSecondary }} />}
                      </InputAdornment>
                    ),
                    endAdornment: isSearching ? <CircularProgress size={16} sx={{ color: accentGreen }} /> : null,
                  }}
                  sx={fieldSx}
                />

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
                }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 1 }}>
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
                </Box>

                <Divider sx={{ borderColor, mb: 1 }} />

                {/* Customer financial snapshot */}
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {[
                    { label: "Category",       value: selectedCustomer.category || "\u2014" },
                    { label: "Monthly Charge", value: selectedCustomer.monthlyCharge != null ? `KES ${Number(selectedCustomer.monthlyCharge).toLocaleString()}` : "\u2014" },
                    {
                      label: "Balance",
                      value: selectedCustomer.closingBalance != null ? `KES ${Number(selectedCustomer.closingBalance).toLocaleString()}` : "\u2014",
                      color: selectedCustomer.closingBalance != null && selectedCustomer.closingBalance < 0 ? "#f44336" : accentGreen,
                    },
                  ].map((item) => (
                    <Box key={item.label}>
                      <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
                        {item.label}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: (item as any).color || textPrimary }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}
          </Box>
        </Paper>

        {/* ── Right card: Invoice details ──────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            flex: "1 1 300px", maxWidth: 440,
            borderRadius: 2, border: `1px solid ${borderColor}`, bgcolor: cardBg, overflow: "hidden",
            opacity: selectedCustomer ? 1 : 0.55,
            pointerEvents: selectedCustomer ? "auto" : "none",
            transition: "opacity 0.2s ease",
          }}
        >
          <Box sx={{ px: 2.5, py: 1.75, bgcolor: headerBg, borderBottom: `1px solid ${borderColor}`, display: "flex", alignItems: "center", gap: 1 }}>
            <AccountBalanceWalletIcon sx={{ color: accentBlue, fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: textPrimary }}>Invoice Details</Typography>
            {!selectedCustomer && (
              <Typography variant="caption" sx={{ color: textSecondary, ml: "auto" }}>Select a tenant first</Typography>
            )}
          </Box>

          <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Description"
              value={formData.description}
              onChange={handleFormChange("description")}
              fullWidth
              size="small"
              placeholder="e.g. Monthly Rent — March 2026"
              multiline
              minRows={2}
              sx={fieldSx}
            />
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                label="Amount (KES)"
                value={formData.amount}
                onChange={handleFormChange("amount")}
                type="number"
                size="small"
                inputProps={{ min: 0 }}
                sx={{ ...fieldSx, flex: 1 }}
              />
              <TextField
                label="Quantity"
                value={formData.quantity}
                onChange={handleFormChange("quantity")}
                type="number"
                size="small"
                inputProps={{ min: 1, step: 1 }}
                sx={{ ...fieldSx, width: 110 }}
              />
            </Box>

            <Divider sx={{ borderColor }} />

            {/* Summary */}
            {isFormReady && (
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
                    {selectedCustomer?.firstName} {selectedCustomer?.lastName}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ color: textSecondary }}>Description</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: textPrimary, maxWidth: 200, textAlign: "right" }}>
                    {formData.description}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ color: textSecondary }}>Total</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: accentGreen }}>
                    KES {(parseFloat(formData.amount || "0") * parseInt(formData.quantity || "1")).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Submit */}
            <Button
              variant="contained"
              onClick={handleCreateInvoice}
              disabled={loading || submitted || !isFormReady}
              fullWidth
              startIcon={submitted ? <CheckCircleOutlineIcon /> : loading ? null : <ReceiptLongIcon />}
              sx={{
                mt: 0.5,
                bgcolor: submitted ? alpha("#4caf50", 0.15) : accentGreen,
                color: submitted ? "#4caf50" : "#fff",
                border: submitted ? "1px solid #4caf50" : "none",
                textTransform: "none", fontWeight: 700, borderRadius: 1.5, py: 1.2,
                boxShadow: submitted ? "none" : `0 2px 12px ${alpha(accentGreen, 0.35)}`,
                "&:hover": {
                  bgcolor: submitted ? alpha("#4caf50", 0.2) : ((theme.palette as any).greenAccent.dark || accentGreen),
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
              {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : submitted ? "Invoice Created" : "Create Invoice"}
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Generate All Invoices Dialog */}
      <Dialog
        open={openGenerateDialog}
        onClose={() => { setOpenGenerateDialog(false); setSelectedPeriod(null); }}
        PaperProps={{
          sx: {
            bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`,
            backgroundImage: "none", minWidth: 400,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: textPrimary, pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <AutorenewIcon sx={{ color: accentBlue, fontSize: 20 }} />
          Generate All Invoices
        </DialogTitle>
        <Divider sx={{ borderColor }} />
        <DialogContent sx={{ pt: 2 }}>
          <DialogContentText sx={{ color: textSecondary, mb: 2, fontSize: "0.875rem" }}>
            This will create invoices for <strong style={{ color: textPrimary }}>all active customers</strong> and update their balances for the selected billing period. This action cannot be undone.
          </DialogContentText>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              views={["year", "month"]}
              label="Billing Period"
              value={selectedPeriod}
              onChange={(v: Date | null | undefined) => setSelectedPeriod(v ?? null)}
              maxDate={new Date()}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  helperText: "Format: YYYY-MM (e.g. 2026-03)",
                  sx: fieldSx,
                },
              }}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => { setOpenGenerateDialog(false); setSelectedPeriod(null); }}
            size="small"
            sx={{ color: textSecondary, textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerateAllConfirm}
            variant="contained"
            size="small"
            disabled={!selectedPeriod}
            sx={{
              bgcolor: accentBlue, color: "#fff", textTransform: "none", fontWeight: 700, borderRadius: 1.5, px: 2.5,
              boxShadow: `0 2px 10px ${alpha(accentBlue, 0.35)}`,
              "&:hover": { bgcolor: accentBlue, opacity: 0.9 },
              "&:disabled": { bgcolor: isDark ? alpha("#fff", 0.06) : alpha("#000", 0.06), color: textSecondary },
            }}
          >
            Confirm &amp; Generate
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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

export default CreateInvoice;
