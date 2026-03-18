import { useEffect, useState } from "react";
import { DataGrid, GridToolbarContainer, GridToolbarExport } from "@mui/x-data-grid";
import {
  CircularProgress,
  Typography,
  Box,
  TextField,
  Button,
  IconButton,
  Chip,
  Alert,
  Paper,
  Divider,
  InputAdornment,
  Tooltip,
  alpha,
  Snackbar,
  Select,
  MenuItem,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";
import { getTheme } from "../../../store/theme";
import axios from "axios";

const flattenReceipts = (receipts) => {
  if (!Array.isArray(receipts)) return [];
  return receipts.map((receipt) => {
    const payment = receipt.payment || {};
    const customer = receipt.customer || {};
    const firstInvoice = receipt.receiptInvoices?.[0]?.invoice || {};
    return {
      id: receipt.id || "",
      tenantId: receipt.tenantId || null,
      receiptNumber: receipt.receiptNumber || "N/A",
      amount: receipt.amount || 0,
      modeOfPayment: receipt.modeOfPayment || "N/A",
      paidBy: receipt.paidBy || "N/A",
      transactionCode: receipt.transactionCode || null,
      phoneNumber: receipt.phoneNumber || null,
      paymentId: receipt.paymentId || "",
      customerId: receipt.customerId || "",
      createdAt: receipt.createdAt || null,
      paymentFirstName: payment.firstName || "N/A",
      paymentTransactionId: payment.transactionId || null,
      paymentCreatedAt: payment.createdAt || null,
      customerFirstName: customer.firstName || "N/A",
      customerLastName: customer.lastName || "N/A",
      customerPhoneNumber: customer.phoneNumber || "N/A",
      customerClosingBalance:
        customer.closingBalance !== undefined ? customer.closingBalance : "N/A",
      invoiceId: firstInvoice.id || "",
      invoiceNumber: firstInvoice.invoiceNumber || "N/A",
      invoiceAmount: firstInvoice.invoiceAmount || "N/A",
      invoiceStatus: firstInvoice.status || "N/A",
      invoiceCreatedAt: firstInvoice.createdAt || null,
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

const invoiceStatusStyle = (status) => {
  const s = (status || "").toUpperCase();
  if (s === "PAID")     return { bg: alpha("#4caf50", 0.12), color: "#4caf50", border: "#4caf50" };
  if (s === "PARTIAL")  return { bg: alpha("#ff9800", 0.12), color: "#ff9800", border: "#ff9800" };
  if (s === "OVERDUE")  return { bg: alpha("#f44336", 0.12), color: "#f44336", border: "#f44336" };
  return                       { bg: alpha("#90a4ae", 0.12), color: "#90a4ae", border: "#90a4ae" };
};

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("name");
  const [downloadingId, setDownloadingId] = useState(null);

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
    if (currentUser && !searchQuery) {
      fetchAllReceipts(paginationModel.page, paginationModel.pageSize);
    }
  }, [paginationModel, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setOpenSnackbar(false);
    setError(null);
  };

  const handleDownloadReceipt = async (receiptId, receiptNumber) => {
    setDownloadingId(receiptId);
    try {
      const response = await axios.get(`${BASEURL}/download-receipt/${receiptId}`, {
        responseType: "blob",
        withCredentials: true,
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `receipt-${receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download receipt");
      setOpenSnackbar(true);
    } finally {
      setDownloadingId(null);
    }
  };

  const fetchAllReceipts = async (page, pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BASEURL}/receipts`, {
        params: { page: page + 1, limit: pageSize },
        withCredentials: true,
      });
      const { receipts: fetchedReceipts, total } = response.data;
      setReceipts(flattenReceipts(fetchedReceipts || []));
      setRowCount(total || 0);
    } catch (err) {
      const msg =
        err.code === "ERR_NETWORK"
          ? "Network error: Is the backend server running?"
          : err.response?.data?.error || "Failed to fetch receipts.";
      setError(msg);
      setOpenSnackbar(true);
      setReceipts([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceiptsByPhone = async (page, pageSize, query) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BASEURL}/search-by-phone`, {
        params: { phone: query, page: page + 1, limit: pageSize },
        withCredentials: true,
      });
      const { receipts: fetchedReceipts, total } = response.data;
      setReceipts(flattenReceipts(fetchedReceipts || []));
      setRowCount(total || 0);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to search by phone.");
      setOpenSnackbar(true);
      setReceipts([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceiptsByName = async (page, pageSize, query) => {
    setLoading(true);
    setError(null);
    try {
      const [firstName, ...rest] = query.trim().split(" ");
      const lastName = rest.length > 0 ? rest.join(" ") : undefined;
      const response = await axios.get(`${BASEURL}/search-by-name`, {
        params: { firstName, lastName, page: page + 1, limit: pageSize },
        withCredentials: true,
      });
      const { receipts: fetchedReceipts, total } = response.data;
      setReceipts(flattenReceipts(fetchedReceipts || []));
      setRowCount(total || 0);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to search by name.");
      setOpenSnackbar(true);
      setReceipts([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
    setSearchQuery("");
  };

  const handleSearch = () => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    const q = searchQuery.trim();
    if (!q) { fetchAllReceipts(0, paginationModel.pageSize); return; }
    if (searchType === "phone") fetchReceiptsByPhone(0, paginationModel.pageSize, q);
    else                        fetchReceiptsByName(0, paginationModel.pageSize, q);
  };

  const handleKeyPress = (e) => { if (e.key === "Enter") handleSearch(); };

  const totalPages = Math.ceil(rowCount / paginationModel.pageSize) || 1;

  const searchPlaceholder = searchType === "phone"
    ? "Search by phone number\u2026"
    : "Search by tenant name\u2026";

  const columns = [
    {
      field: "view",
      headerName: "Actions",
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Tooltip title="View Receipt">
            <IconButton
              component={Link}
              to={`/receipts/${params.row.id}`}
              size="small"
              sx={{ color: accentGreen, "&:hover": { bgcolor: alpha(accentGreen, 0.1) } }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download Receipt">
            <span>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); handleDownloadReceipt(params.row.id, params.row.receiptNumber); }}
                disabled={downloadingId === params.row.id}
                sx={{ color: accentGreen, "&:hover": { bgcolor: alpha(accentGreen, 0.1) } }}
              >
                {downloadingId === params.row.id
                  ? <CircularProgress size={14} />
                  : <DownloadIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "customerFirstName",
      headerName: "Tenant",
      width: 210,
      renderCell: (params) => (
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", py: 0.5 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {params.row.customerFirstName} {params.row.customerLastName}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {params.row.customerPhoneNumber !== "N/A" ? params.row.customerPhoneNumber : "\u2014"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "receiptNumber",
      headerName: "Receipt #",
      width: 150,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{ fontFamily: "monospace", fontWeight: 600, color: accentGreen, fontSize: "0.82rem" }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "amount",
      headerName: "Amount (KES)",
      width: 155,
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
            sx={{
              bgcolor: s.bg, color: s.color, border: `1px solid ${s.border}`,
              fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.03em",
            }}
          />
        );
      },
    },
    {
      field: "transactionCode",
      headerName: "Transaction Code",
      width: 180,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem", color: textPrimary }}>
          {params.value || "\u2014"}
        </Typography>
      ),
    },
    {
      field: "paidBy",
      headerName: "Paid By",
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: textPrimary }}>
          {params.value || "\u2014"}
        </Typography>
      ),
    },
    {
      field: "customerClosingBalance",
      headerName: "Closing Balance",
      width: 155,
      renderCell: (params) => {
        const val = params.value;
        if (val === "N/A" || val === undefined || val === null) {
          return <Typography variant="caption" sx={{ color: textSecondary }}>\u2014</Typography>;
        }
        const num = Number(val);
        const color = num < 0 ? "#f44336" : num === 0 ? accentGreen : "#ff9800";
        return (
          <Typography variant="body2" sx={{ fontWeight: 700, color }}>
            {num.toLocaleString()}
          </Typography>
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Date",
      width: 165,
      renderCell: (params) => {
        if (!params?.value) return <Typography variant="caption" sx={{ color: textSecondary }}>N/A</Typography>;
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
    {
      field: "invoiceStatus",
      headerName: "Invoice Status",
      width: 140,
      renderCell: (params) => {
        if (!params.value || params.value === "N/A") {
          return <Typography variant="caption" sx={{ color: textSecondary }}>\u2014</Typography>;
        }
        const s = invoiceStatusStyle(params.value);
        return (
          <Chip
            label={params.value}
            size="small"
            sx={{
              bgcolor: s.bg, color: s.color, border: `1px solid ${s.border}`,
              fontWeight: 700, fontSize: "0.68rem",
            }}
          />
        );
      },
    },
    {
      field: "invoiceAmount",
      headerName: "Invoice Amt",
      width: 135,
      renderCell: (params) =>
        params.value && params.value !== "N/A" ? (
          <Typography variant="body2" sx={{ fontWeight: 600, color: textPrimary }}>
            {Number(params.value).toLocaleString()}
          </Typography>
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
            <ReceiptLongIcon sx={{ color: accentGreen, fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: textPrimary, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              Receipts
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
              "&:hover": {
                bgcolor: theme.palette.greenAccent.dark || accentGreen,
                boxShadow: `0 4px 18px ${alpha(accentGreen, 0.45)}`,
              },
            }}
          >
            Add Payment
          </Button>
        </Box>
      </Box>

      {/* Summary Stats */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {[
          { label: "Total Receipts", value: rowCount.toLocaleString(), color: accentBlue },
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

      {/* Search Toolbar */}
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
            minWidth: 155, borderRadius: 1.5, fontSize: "0.85rem", color: textPrimary,
            "& .MuiOutlinedInput-notchedOutline": { borderColor },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: accentGreen },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: accentGreen },
          }}
        >
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="phone">Phone</MenuItem>
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
            flex: "1 1 240px", maxWidth: 400,
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

        <Typography variant="caption" sx={{ color: textSecondary, fontStyle: "italic", whiteSpace: "nowrap" }}>
          {searchType === "phone" ? "Enter digits only" : "First name or full name"}
        </Typography>
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
            Receipt Records
          </Typography>
          {!loading && (
            <Chip
              label={`${rowCount.toLocaleString()} receipts`}
              size="small"
              sx={{ bgcolor: alpha(accentGreen, 0.12), color: accentGreen, fontWeight: 600, fontSize: "0.7rem", height: 22 }}
            />
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 2, py: 10 }}>
            <CircularProgress size={44} thickness={4} sx={{ color: accentGreen }} />
            <Typography variant="body2" sx={{ color: textSecondary }}>Loading receipts\u2026</Typography>
          </Box>
        ) : error && receipts.length === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 1.5, py: 10 }}>
            <ErrorOutlineIcon sx={{ color: "#f44336", fontSize: 48 }} />
            <Typography variant="body1" sx={{ color: "#f44336", fontWeight: 600 }}>{error}</Typography>
            <Button
              variant="outlined" size="small"
              onClick={() => fetchAllReceipts(paginationModel.page, paginationModel.pageSize)}
              sx={{ borderColor: accentGreen, color: accentGreen, textTransform: "none", mt: 1, borderRadius: 1.5, "&:hover": { bgcolor: alpha(accentGreen, 0.08) } }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <DataGrid
            rows={receipts}
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

export default Receipts;
