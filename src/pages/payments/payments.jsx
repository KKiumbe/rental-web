import { useEffect, useState } from "react";
import axios from "axios";
import { DataGrid, GridToolbarContainer, GridToolbarExport } from "@mui/x-data-grid";
import {
  CircularProgress,
  Typography,
  Box,
  TextField,
  Button,
  Snackbar,
  IconButton,
  Select,
  MenuItem,
  Chip,
  Alert,
  Paper,
  Divider,
  InputAdornment,
  Tooltip,
  alpha,
  ToggleButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import PaymentsIcon from "@mui/icons-material/Payments";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { getTheme } from "../../store/theme";

const flattenPayments = (payments) => {
  return payments.map((payment) => {
    const receipt = payment.receipt || {};
    const receiptInvoices = receipt.receiptInvoices || [];
    const firstInvoice = receiptInvoices[0]?.invoice || {};
    return {
      id: payment.id,
      tenantId: payment.tenantId,
      amount: payment.amount,
      modeOfPayment: payment.modeOfPayment,
      transactionId: payment.transactionId || "N/A",
      firstName: payment.customer?.firstName || payment.firstName || "N/A",
      lastName: payment.customer?.lastName || "N/A",
      receipted: payment.receipted,
      ref: payment.ref || "N/A",
      createdAt: payment.createdAt,
      receiptId: receipt.id || null,
      receiptNumber: receipt.id ? `REC-${receipt.id}` : "N/A",
      invoiceId: firstInvoice.id || null,
      invoiceNumber: firstInvoice.invoiceNumber || "N/A",
    };
  });
};

const modeChipStyle = (mode) => {
  const m = (mode || "").toUpperCase();
  if (m === "MPESA")         return { bg: alpha("#4caf50", 0.12), color: "#4caf50", border: "#4caf50" };
  if (m === "CASH")          return { bg: alpha("#1976d2", 0.12), color: "#1976d2", border: "#1976d2" };
  if (m === "BANK_TRANSFER") return { bg: alpha("#9c27b0", 0.12), color: "#9c27b0", border: "#9c27b0" };
  return                            { bg: alpha("#90a4ae", 0.12), color: "#90a4ae", border: "#90a4ae" };
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("name");
  const [modeFilter, setModeFilter] = useState("all");
  const [showUnreceiptedOnly, setShowUnreceiptedOnly] = useState(false);

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const theme = getTheme();
  const BASEURL = import.meta.env.VITE_BASE_URL;

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

  useEffect(() => {
    if (currentUser) {
      fetchPayments(paginationModel.page, paginationModel.pageSize, modeFilter, showUnreceiptedOnly);
    }
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentUser && !searchQuery) {
      fetchPayments(paginationModel.page, paginationModel.pageSize, modeFilter, showUnreceiptedOnly);
    }
  }, [paginationModel, modeFilter, showUnreceiptedOnly, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setOpenSnackbar(false);
    setError(null);
  };

  const fetchPayments = async (page, pageSize, mode = "all", unreceiptedOnly = false) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = unreceiptedOnly ? `${BASEURL}/payments/unreceipted` : `${BASEURL}/payments`;
      const params = { page: page + 1, limit: pageSize };
      if (mode !== "all") params.mode = mode;
      const response = await axios.get(endpoint, { params, withCredentials: true });
      const { payments: fetched, total } = response.data;
      setPayments(flattenPayments(fetched || []));
      setRowCount(total || 0);
    } catch (err) {
      setError(err.response?.status === 404 ? "Not found" : err.response?.data?.error || "Failed to fetch payments.");
      setOpenSnackbar(true);
      setPayments([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentsByName = async (page, pageSize, query) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BASEURL}/payments/search-by-name`, {
        params: { name: query, page: page + 1, limit: pageSize },
        withCredentials: true,
      });
      const { payments: fetched, total } = response.data;
      setPayments(flattenPayments(fetched || []));
      setRowCount(total || 0);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to search by name.");
      setOpenSnackbar(true);
      setPayments([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentByTransactionId = async (page, pageSize, query) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BASEURL}/searchTransactionById`, {
        params: { transactionId: query, page: page + 1, limit: pageSize },
        withCredentials: true,
      });
      const { transaction } = response.data;
      setPayments(flattenPayments([transaction]));
      setRowCount(1);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to search by transaction ID.");
      setOpenSnackbar(true);
      setPayments([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentsByRef = async (page, pageSize, query) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BASEURL}/payments/search-by-phone`, {
        params: { ref: query, page: page + 1, limit: pageSize },
        withCredentials: true,
      });
      const { payments: fetched, total } = response.data;
      setPayments(flattenPayments(fetched || []));
      setRowCount(total || 0);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to search by reference.");
      setOpenSnackbar(true);
      setPayments([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
    setSearchQuery("");
    setPayments([]);
    setRowCount(0);
  };

  const handleModeFilterChange = (e) => {
    setModeFilter(e.target.value);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleSearch = () => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    const q = searchQuery.trim();
    if (!q) { fetchPayments(0, paginationModel.pageSize, modeFilter, showUnreceiptedOnly); return; }
    if (searchType === "name")               fetchPaymentsByName(0, paginationModel.pageSize, q);
    else if (searchType === "transactionId") fetchPaymentByTransactionId(0, paginationModel.pageSize, q);
    else                                     fetchPaymentsByRef(0, paginationModel.pageSize, q);
  };

  const handleKeyPress = (e) => { if (e.key === "Enter") handleSearch(); };

  const handleFilterUnreceipted = () => {
    setShowUnreceiptedOnly((prev) => {
      const next = !prev;
      fetchPayments(0, paginationModel.pageSize, modeFilter, next);
      return next;
    });
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const searchPlaceholder = {
    name: "Search by tenant name\u2026",
    transactionId: "Search by transaction ID\u2026",
    ref: "Search by reference number\u2026",
  }[searchType];

  const totalPages = Math.ceil(rowCount / paginationModel.pageSize) || 1;

  const columns = [
    {
      field: "view",
      headerName: "Actions",
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", height: "100%" }}>
          <Tooltip title="View Payment">
            <IconButton
              component={Link}
              to={`/payments/${params.row.id}`}
              size="small"
              sx={{ color: accentGreen, "&:hover": { bgcolor: alpha(accentGreen, 0.1) } }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {!params.row.receipted && (
            <Tooltip title="Edit Payment">
              <IconButton
                onClick={() => navigate(`/payments/${params.row.id}`)}
                size="small"
                sx={{ color: accentBlue, "&:hover": { bgcolor: alpha(accentBlue, 0.1) } }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
    {
      field: "firstName",
      headerName: "Tenant",
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", py: 0.5 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {params.row.firstName} {params.row.lastName}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {params.row.ref !== "N/A" ? `Ref: ${params.row.ref}` : "\u2014"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "amount",
      headerName: "Amount (KES)",
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: accentGreen }}>
          {Number(params.value || 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: "modeOfPayment",
      headerName: "Mode",
      width: 155,
      renderCell: (params) => {
        const s = modeChipStyle(params.value);
        return (
          <Chip
            label={params.value || "\u2014"}
            size="small"
            sx={{ bgcolor: s.bg, color: s.color, border: `1px solid ${s.border}`, fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.03em" }}
          />
        );
      },
    },
    {
      field: "receipted",
      headerName: "Status",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Receipted" : "Pending"}
          size="small"
          sx={{
            bgcolor: params.value ? alpha("#4caf50", 0.12) : alpha("#ff9800", 0.12),
            color:   params.value ? "#4caf50" : "#ff9800",
            border:  `1px solid ${params.value ? "#4caf50" : "#ff9800"}`,
            fontWeight: 700, fontSize: "0.68rem",
          }}
        />
      ),
    },
    {
      field: "createdAt",
      headerName: "Date",
      width: 160,
      renderCell: (params) => {
        if (!params?.value) return "N/A";
        try {
          const date = new Date(params.value);
          date.setHours(date.getHours() - 1);
          return (
            <Box>
              <Typography variant="body2">
                {String(date.getDate()).padStart(2, "0")}{" "}
                {date.toLocaleString("default", { month: "short" })}{" "}
                {date.getFullYear()}
              </Typography>
              <Typography variant="caption" sx={{ color: textSecondary }}>
                {String(date.getHours()).padStart(2, "0")}:{String(date.getMinutes()).padStart(2, "0")}
              </Typography>
            </Box>
          );
        } catch { return "Invalid Date"; }
      },
    },
    {
      field: "transactionId",
      headerName: "Transaction ID",
      width: 190,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem", color: textPrimary }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "receiptNumber",
      headerName: "Receipt",
      width: 160,
      renderCell: (params) =>
        params.row.receiptId ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <ReceiptIcon sx={{ fontSize: 14, color: accentGreen }} />
            <Link
              to={`/receipts/${params.row.receiptId}`}
              style={{ textDecoration: "none", color: accentGreen, fontWeight: 600, fontSize: "0.82rem" }}
            >
              {params.value}
            </Link>
          </Box>
        ) : (
          <Typography variant="caption" sx={{ color: textSecondary }}>\u2014</Typography>
        ),
    },
    {
      field: "invoiceNumber",
      headerName: "Invoice",
      width: 160,
      renderCell: (params) =>
        params.row.invoiceId ? (
          <Link
            to={`/get-invoice/${params.row.invoiceId}`}
            style={{ textDecoration: "none", color: accentBlue, fontWeight: 600, fontSize: "0.82rem" }}
          >
            {params.value}
          </Link>
        ) : (
          <Typography variant="caption" sx={{ color: textSecondary }}>\u2014</Typography>
        ),
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: surfaceBg,
        p: { xs: 2, md: 3 },
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
      }}
    >
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
            <PaymentsIcon sx={{ color: accentGreen, fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: textPrimary, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              Payments
            </Typography>
            <Typography variant="caption" sx={{ color: textSecondary }}>
              {rowCount.toLocaleString()} total records
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            size="small"
            sx={{
              borderColor, color: textSecondary, textTransform: "none", fontWeight: 500, borderRadius: 1.5,
              "&:hover": { borderColor: accentGreen, color: accentGreen, bgcolor: alpha(accentGreen, 0.06) },
            }}
          >
            Filter
          </Button>
          <Button
            component={Link}
            to="/add-payment"
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
            sx={{
              bgcolor: accentGreen, color: "#fff", textTransform: "none", fontWeight: 600,
              borderRadius: 1.5, px: 2,
              boxShadow: `0 2px 10px ${alpha(accentGreen, 0.35)}`,
              "&:hover": { bgcolor: theme.palette.greenAccent.dark || accentGreen, boxShadow: `0 4px 18px ${alpha(accentGreen, 0.45)}` },
            }}
          >
            Add Payment
          </Button>
        </Box>
      </Box>

      {/* Summary Stats */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {[
          { label: "Total Payments", value: rowCount.toLocaleString(), color: accentBlue },
          { label: "Page", value: `${paginationModel.page + 1} / ${totalPages}`, color: accentGreen },
        ].map((s) => (
          <Paper
            key={s.label}
            elevation={0}
            sx={{
              px: 2.5, py: 1.5, borderRadius: 2,
              border: `1px solid ${borderColor}`, bgcolor: cardBg, minWidth: 150,
              display: "flex", flexDirection: "column", gap: 0.25,
            }}
          >
            <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {s.label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: s.color, lineHeight: 1.3 }}>
              {s.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Search & Filter Toolbar */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2 }, borderRadius: 2,
          border: `1px solid ${borderColor}`, bgcolor: cardBg,
          display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap",
        }}
      >
        <Select
          value={searchType}
          onChange={handleSearchTypeChange}
          size="small"
          sx={{
            minWidth: 160, borderRadius: 1.5, fontSize: "0.85rem", color: textPrimary,
            "& .MuiOutlinedInput-notchedOutline": { borderColor },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: accentGreen },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: accentGreen },
          }}
        >
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="transactionId">Transaction ID</MenuItem>
          <MenuItem value="ref">Reference Number</MenuItem>
        </Select>

        <TextField
          placeholder={searchPlaceholder}
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: textSecondary, fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: "1 1 240px", maxWidth: 380,
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              bgcolor: isDark ? alpha("#fff", 0.04) : alpha("#000", 0.02),
              "& fieldset": { borderColor },
              "&:hover fieldset": { borderColor: accentGreen },
              "&.Mui-focused fieldset": { borderColor: accentGreen, borderWidth: 1.5 },
            },
            "& .MuiInputBase-input": { color: textPrimary, fontSize: "0.875rem" },
          }}
        />

        <Button
          variant="contained"
          onClick={handleSearch}
          size="small"
          sx={{
            bgcolor: accentGreen, color: "#fff", textTransform: "none", fontWeight: 600,
            borderRadius: 1.5, px: 2.5, boxShadow: "none",
            "&:hover": { bgcolor: theme.palette.greenAccent.dark || accentGreen, boxShadow: "none" },
          }}
        >
          Search
        </Button>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor }} />

        <Select
          value={modeFilter}
          onChange={handleModeFilterChange}
          size="small"
          displayEmpty
          sx={{
            minWidth: 150, borderRadius: 1.5, fontSize: "0.85rem", color: textPrimary,
            "& .MuiOutlinedInput-notchedOutline": { borderColor },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: accentGreen },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: accentGreen },
          }}
        >
          <MenuItem value="all">All Modes</MenuItem>
          <MenuItem value="CASH">Cash</MenuItem>
          <MenuItem value="MPESA">M-Pesa</MenuItem>
          <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
        </Select>

        <ToggleButton
          value="unreceipted"
          selected={showUnreceiptedOnly}
          onChange={handleFilterUnreceipted}
          size="small"
          sx={{
            borderRadius: 1.5,
            border: `1px solid ${showUnreceiptedOnly ? "#ff9800" : borderColor}`,
            color: showUnreceiptedOnly ? "#ff9800" : textSecondary,
            bgcolor: showUnreceiptedOnly ? alpha("#ff9800", 0.1) : "transparent",
            textTransform: "none", fontWeight: 600, fontSize: "0.8rem", px: 1.5,
            "&:hover": { bgcolor: alpha("#ff9800", 0.12), borderColor: "#ff9800", color: "#ff9800" },
            "&.Mui-selected": { bgcolor: alpha("#ff9800", 0.12), color: "#ff9800", borderColor: "#ff9800" },
            "&.Mui-selected:hover": { bgcolor: alpha("#ff9800", 0.18) },
          }}
        >
          {showUnreceiptedOnly ? "Unreceipted Only \u2713" : "Unreceipted Only"}
        </ToggleButton>
      </Paper>

      {/* Data Table */}
      <Paper
        elevation={0}
        sx={{
          flex: 1, borderRadius: 2, border: `1px solid ${borderColor}`,
          bgcolor: cardBg, overflow: "hidden",
          display: "flex", flexDirection: "column", minHeight: 520,
        }}
      >
        <Box
          sx={{
            px: 2.5, py: 1.5, bgcolor: headerBg,
            borderBottom: `1px solid ${borderColor}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: textPrimary, letterSpacing: "0.02em" }}>
            Payment Records
          </Typography>
          {!loading && (
            <Chip
              label={`${rowCount.toLocaleString()} payments`}
              size="small"
              sx={{ bgcolor: alpha(accentGreen, 0.12), color: accentGreen, fontWeight: 600, fontSize: "0.7rem", height: 22 }}
            />
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 2, py: 10 }}>
            <CircularProgress size={44} thickness={4} sx={{ color: accentGreen }} />
            <Typography variant="body2" sx={{ color: textSecondary }}>Loading payments\u2026</Typography>
          </Box>
        ) : error && payments.length === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 1.5, py: 10 }}>
            <ErrorOutlineIcon sx={{ color: "#f44336", fontSize: 48 }} />
            <Typography variant="body1" sx={{ color: "#f44336", fontWeight: 600 }}>{error}</Typography>
            <Button
              variant="outlined" size="small"
              onClick={() => fetchPayments(paginationModel.page, paginationModel.pageSize, modeFilter, showUnreceiptedOnly)}
              sx={{ borderColor: accentGreen, color: accentGreen, textTransform: "none", mt: 1, borderRadius: 1.5, "&:hover": { bgcolor: alpha(accentGreen, 0.08) } }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <DataGrid
            rows={payments}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
            paginationMode="server"
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 50]}
            disableSelectionOnClick
            rowHeight={62}
            components={{
              Toolbar: () => (
                <GridToolbarContainer sx={{ px: 2, py: 0.5, borderBottom: `1px solid ${borderColor}` }}>
                  <GridToolbarExport sx={{ color: textSecondary, fontSize: "0.8rem", textTransform: "none" }} />
                </GridToolbarContainer>
              ),
            }}
            sx={{
              border: "none",
              color: textPrimary,
              flex: 1,
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: headerBg,
                borderBottom: `1px solid ${borderColor}`,
                minHeight: "44px !important",
                maxHeight: "44px !important",
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: 700,
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: textSecondary,
              },
              "& .MuiDataGrid-row": {
                borderBottom: `1px solid ${borderColor}`,
                cursor: "pointer",
                transition: "background 0.15s ease",
                "&:hover": { bgcolor: isDark ? alpha("#fff", 0.035) : alpha("#000", 0.018) },
                "&.Mui-selected": {
                  bgcolor: alpha(accentGreen, 0.08),
                  "&:hover": { bgcolor: alpha(accentGreen, 0.12) },
                },
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "none",
                display: "flex",
                alignItems: "center",
                fontSize: "0.85rem",
                overflow: "hidden",
              },
              "& .MuiDataGrid-footerContainer": {
                bgcolor: headerBg,
                borderTop: `1px solid ${borderColor}`,
                color: textPrimary,
                minHeight: 48,
              },
              "& .MuiCheckbox-root": { color: textSecondary },
              "& .MuiDataGrid-columnSeparator": { color: borderColor },
              "& .MuiTablePagination-root": { color: textPrimary },
              "& .MuiTablePagination-selectIcon": { color: textSecondary },
              "& .MuiTablePagination-actions button": { color: textSecondary },
              "& .MuiDataGrid-virtualScroller": {
                "&::-webkit-scrollbar": { width: 6, height: 6 },
                "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.14)",
                  borderRadius: 3,
                },
              },
            }}
          />
        )}
      </Paper>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Payments;
