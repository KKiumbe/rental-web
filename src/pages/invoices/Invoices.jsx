import { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Chip,
  Divider,
  InputAdornment,
  Tooltip,
  alpha,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { getTheme } from "../../store/theme";

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [pageInput, setPageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [printingId, setPrintingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const BASEURL = import.meta.env.VITE_BASE_URL
  const theme = getTheme();

  // Fetch all invoices
  const fetchAllInvoices = async (page, pageSize) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await axios.get(`${BASEURL}/invoices/all`, {
        params: { page: page + 1, limit: pageSize }, // 1-based indexing
        withCredentials: true,
      });
      const { invoices: fetchedInvoices, total } = res.data;
      setInvoices(fetchedInvoices || []);
      setRowCount(total || 0);
    } catch (error) {
      console.error("Error fetching all invoices:", error);
      setInvoices([]);
      setRowCount(0);
      setErrorMessage(error.response?.data?.error || "Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  // Fetch invoices by phone number
  const fetchInvoicesByPhone = async (page, pageSize, query) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await axios.get(`${BASEURL}/invoices/search-by-phone`, {
        params: {
          phone: query,
          page: page + 1,
          limit: pageSize,
        },
        withCredentials: true,
      });
      const { invoices: fetchedInvoices, total } = res.data;
      setInvoices(fetchedInvoices || []);
      setRowCount(total || 0);
    } catch (error) {
      console.error("Error fetching invoices by phone:", error);
      setInvoices([]);
      setRowCount(0);
      setErrorMessage(error.response?.data?.error || "Failed to search invoices by phone");
    } finally {
      setLoading(false);
    }
  };

  // Fetch invoices by name
  const fetchInvoicesByName = async (page, pageSize, query) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [firstName, ...lastNameParts] = query.trim().split(" ");
      const lastName = lastNameParts.length > 0 ? lastNameParts.join(" ") : undefined;
      const res = await axios.get(`${BASEURL}/invoices/search-by-name`, {
        params: {
          firstName,
          lastName,
          page: page + 1,
          limit: pageSize,
        },
        withCredentials: true,
      });
      const { invoices: fetchedInvoices, total } = res.data;
      setInvoices(fetchedInvoices || []);
      setRowCount(total || 0);
    } catch (error) {
      console.error("Error fetching invoices by name:", error);
      setInvoices([]);
      setRowCount(0);
      setErrorMessage(error.response?.data?.error || "Failed to search invoices by name");
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery === "") {
      fetchAllInvoices(0, paginationModel.pageSize);
    } else {
      const isPhoneNumber = /^\d+$/.test(trimmedQuery);
      if (isPhoneNumber) {
        fetchInvoicesByPhone(0, paginationModel.pageSize, trimmedQuery);
      } else {
        fetchInvoicesByName(0, paginationModel.pageSize, trimmedQuery);
      }
    }
  };

  // Initial fetch and pagination updates
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    if (!searchQuery) {
      fetchAllInvoices(paginationModel.page, paginationModel.pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, navigate, paginationModel, searchQuery]);

  // Sanitized rows for DataGrid
  const sanitizedRows = invoices.map((invoice) => ({
    id: invoice.id || Math.random().toString(),
    invoiceNumber: invoice.invoiceNumber,
    invoiceAmount: invoice.invoiceAmount,
    amountPaid: invoice.amountPaid || 0,
    closingBalance: invoice.closingBalance,
    invoicePeriod: invoice.invoicePeriod,
    status: invoice.status,
    isSystemGenerated: invoice.isSystemGenerated,
    createdBy: invoice.createdBy || "N/A",
    customerId: invoice.customer?.id || "N/A",
    firstName: invoice.customer?.firstName?.trim() || "Unknown",
    lastName: invoice.customer?.lastName?.trim() || "Unknown",
    phoneNumber: invoice.customer?.phoneNumber?.trim() || "N/A",
    unitNumber: invoice.unit?.unitNumber || "N/A",
    itemDescriptions: invoice.items?.length
      ? invoice.items.map((item) => `${item.description} (Qty: ${item.quantity}, Amount: ${item.amount})`).join(", ")
      : "N/A",
    paymentSummary: invoice.payments?.length
      ? invoice.payments.map((p) => `${p.amount} (${p.modeOfPayment})`).join(", ")
      : "No Payments",
    createdAt: invoice.createdAt,
  }));

  const statusChipStyles = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "paid") return { bg: alpha("#4caf50", 0.15), color: "#4caf50", border: "#4caf50" };
    if (s === "partial") return { bg: alpha("#ff9800", 0.15), color: "#ff9800", border: "#ff9800" };
    if (s === "overdue") return { bg: alpha("#f44336", 0.15), color: "#f44336", border: "#f44336" };
    return { bg: alpha("#90a4ae", 0.15), color: "#90a4ae", border: "#90a4ae" };
  };

  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", height: "100%" }}>
          <Tooltip title="View Invoice">
            <IconButton
              component={Link}
              to={`/get-invoice/${params.row.id}`}
              size="small"
              sx={{
                color: theme.palette.greenAccent.main,
                "&:hover": { bgcolor: alpha(theme.palette.greenAccent.main, 0.1) },
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Invoice">
            <span>
              <IconButton
                onClick={(e) => { e.stopPropagation(); handlePrintInvoice(params.row.id); }}
                disabled={printingId === params.row.id}
                size="small"
                sx={{
                  color: theme.palette.blueAccent?.main || "#1976d2",
                  "&:hover": { bgcolor: alpha(theme.palette.blueAccent?.main || "#1976d2", 0.1) },
                }}
              >
                {printingId === params.row.id
                  ? <CircularProgress size={16} sx={{ color: "inherit" }} />
                  : <PrintIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Download Invoice">
            <span>
              <IconButton
                onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(params.row.id); }}
                disabled={downloadingId === params.row.id}
                size="small"
                sx={{
                  color: theme.palette.blueAccent?.main || "#1976d2",
                  "&:hover": { bgcolor: alpha(theme.palette.blueAccent?.main || "#1976d2", 0.1) },
                }}
              >
                {downloadingId === params.row.id
                  ? <CircularProgress size={16} sx={{ color: "inherit" }} />
                  : <DownloadIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "invoiceNumber",
      headerName: "Invoice #",
      width: 160,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, color: theme.palette.greenAccent.main, fontFamily: "monospace" }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "firstName",
      headerName: "Tenant",
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", py: 0.5, lineHeight: 1 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: theme.palette.text.primary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {params.row.firstName} {params.row.lastName}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.secondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {params.row.phoneNumber}
          </Typography>
        </Box>
      ),
    },
    { field: "unitNumber", headerName: "Unit", width: 100 },
    {
      field: "invoiceAmount",
      headerName: "Invoice Amt",
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {Number(params.value || 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: "amountPaid",
      headerName: "Paid",
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: "#4caf50", fontWeight: 600 }}>
          {Number(params.value || 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: "closingBalance",
      headerName: "Balance",
      width: 130,
      renderCell: (params) => {
        const bal = Number(params.value || 0);
        return (
          <Typography variant="body2" sx={{ color: bal > 0 ? "#f44336" : "#4caf50", fontWeight: 600 }}>
            {bal.toLocaleString()}
          </Typography>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => {
        const styles = statusChipStyles(params.value);
        return (
          <Chip
            label={(params.value || "Unknown").toUpperCase()}
            size="small"
            sx={{
              bgcolor: styles.bg,
              color: styles.color,
              border: `1px solid ${styles.border}`,
              fontWeight: 700,
              fontSize: "0.68rem",
              letterSpacing: "0.04em",
            }}
          />
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Date Created",
      width: 170,
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
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {String(date.getHours()).padStart(2, "0")}:
                {String(date.getMinutes()).padStart(2, "0")}
              </Typography>
            </Box>
          );
        } catch {
          return "Invalid Date";
        }
      },
    },
    {
      field: "invoicePeriod",
      headerName: "Period",
      width: 120,
      renderCell: (params) =>
        params.value
          ? new Date(params.value).toLocaleString("default", { year: "numeric", month: "short" })
          : "N/A",
    },
    {
      field: "isSystemGenerated",
      headerName: "Source",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Auto" : "Manual"}
          size="small"
          variant="outlined"
          sx={{
            fontSize: "0.68rem",
            fontWeight: 600,
            color: params.value ? theme.palette.blueAccent?.main : theme.palette.text.secondary,
            borderColor: params.value ? theme.palette.blueAccent?.main : theme.palette.divider,
          }}
        />
      ),
    },
    { field: "createdBy", headerName: "Created By", width: 150 },
    { field: "itemDescriptions", headerName: "Items", width: 300 },
    { field: "paymentSummary", headerName: "Payments", width: 250 },
  ];

  const handlePrintInvoice = async (invoiceId) => {
    setPrintingId(invoiceId);
    try {
      const response = await axios.get(`${BASEURL}/download-invoice/${invoiceId}`, {
        withCredentials: true,
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.addEventListener("load", () => {
          printWindow.focus();
          printWindow.print();
        });
      } else {
        setErrorMessage("Print window was blocked. Please allow popups for this site.");
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to print invoice");
    } finally {
      setPrintingId(null);
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    setDownloadingId(invoiceId);
    try {
      const response = await axios.get(`${BASEURL}/download-invoice/${invoiceId}`, {
        withCredentials: true,
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to download invoice");
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePageInputChange = (e) => {
    const value = e.target.value;
    const totalPages = Math.ceil(rowCount / paginationModel.pageSize);
    if (value === "" || (/^\d+$/.test(value) && value <= totalPages && value > 0)) {
      setPageInput(value);
    }
  };

  const handlePageInputSubmit = () => {
    if (pageInput) {
      const newPage = parseInt(pageInput, 10) - 1; // Convert to 0-based index
      setPaginationModel((prev) => ({ ...prev, page: newPage }));
      setPageInput("");
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const totalPages = Math.ceil(rowCount / paginationModel.pageSize);
  const currentPage = paginationModel.page + 1;
  const isDark = theme.palette.mode === "dark";
  const surfaceBg = isDark ? "#141824" : "#f4f6fb";
  const cardBg = isDark ? "#1c2030" : "#ffffff";
  const borderColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const headerBg = isDark ? "#181d2e" : "#f0f3f9";
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const accentGreen = theme.palette.greenAccent.main;
  const accentBlue = theme.palette.blueAccent?.main || "#1976d2";

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
      {/* ── Page Header ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2,
              bgcolor: alpha(accentGreen, 0.12),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${alpha(accentGreen, 0.2)}`,
            }}
          >
            <ReceiptLongIcon sx={{ color: accentGreen, fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: textPrimary, lineHeight: 1.2, letterSpacing: "-0.01em" }}
            >
              Invoices
            </Typography>
            <Typography variant="caption" sx={{ color: textSecondary }}>
              {rowCount.toLocaleString()} total records
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            size="small"
            sx={{
              borderColor,
              color: textSecondary,
              textTransform: "none",
              fontWeight: 500,
              borderRadius: 1.5,
              "&:hover": { borderColor: accentGreen, color: accentGreen, bgcolor: alpha(accentGreen, 0.06) },
            }}
          >
            Filter
          </Button>
          <Button
            component={Link}
            to="/create-invoice"
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
            sx={{
              bgcolor: accentGreen,
              color: "#fff",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 1.5,
              px: 2,
              boxShadow: `0 2px 10px ${alpha(accentGreen, 0.35)}`,
              "&:hover": {
                bgcolor: theme.palette.greenAccent.dark || accentGreen,
                boxShadow: `0 4px 18px ${alpha(accentGreen, 0.45)}`,
              },
            }}
          >
            New Invoice
          </Button>
        </Box>
      </Box>

      {/* ── Summary Stats ── */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {[
          { label: "Total Invoices", value: rowCount.toLocaleString(), color: accentBlue, bg: alpha(accentBlue, 0.1) },
          { label: "Page", value: `${currentPage} / ${totalPages || 1}`, color: accentGreen, bg: alpha(accentGreen, 0.1) },
        ].map((stat) => (
          <Paper
            key={stat.label}
            elevation={0}
            sx={{
              px: 2.5,
              py: 1.5,
              borderRadius: 2,
              border: `1px solid ${borderColor}`,
              bgcolor: cardBg,
              minWidth: 150,
              display: "flex",
              flexDirection: "column",
              gap: 0.25,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}
            >
              {stat.label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: stat.color, lineHeight: 1.3 }}>
              {stat.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* ── Search & Navigation Controls ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2 },
          borderRadius: 2,
          border: `1px solid ${borderColor}`,
          bgcolor: cardBg,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <TextField
          placeholder="Search by name or phone number…"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: textSecondary, fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: "1 1 280px",
            maxWidth: 420,
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
            bgcolor: accentGreen,
            color: "#fff",
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 1.5,
            px: 2.5,
            boxShadow: "none",
            "&:hover": { bgcolor: theme.palette.greenAccent.dark || accentGreen, boxShadow: "none" },
          }}
        >
          Search
        </Button>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ color: textSecondary, whiteSpace: "nowrap", fontSize: "0.8rem" }}>
            Go to page
          </Typography>
          <TextField
            variant="outlined"
            size="small"
            value={pageInput}
            onChange={handlePageInputChange}
            sx={{
              width: 68,
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                "& fieldset": { borderColor },
                "&:hover fieldset": { borderColor: accentGreen },
                "&.Mui-focused fieldset": { borderColor: accentGreen },
              },
              "& .MuiInputBase-input": { color: textPrimary, textAlign: "center", fontSize: "0.875rem" },
            }}
          />
          <Button
            onClick={handlePageInputSubmit}
            variant="outlined"
            size="small"
            sx={{
              borderColor,
              color: textPrimary,
              textTransform: "none",
              fontWeight: 500,
              borderRadius: 1.5,
              "&:hover": { borderColor: accentGreen, color: accentGreen, bgcolor: alpha(accentGreen, 0.06) },
            }}
          >
            Go
          </Button>
        </Box>
      </Paper>

      {/* ── Data Table ── */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          borderRadius: 2,
          border: `1px solid ${borderColor}`,
          bgcolor: cardBg,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 520,
        }}
      >
        {/* Table title bar */}
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            bgcolor: headerBg,
            borderBottom: `1px solid ${borderColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: textPrimary, letterSpacing: "0.02em" }}
          >
            Invoice Records
          </Typography>
          {!loading && (
            <Chip
              label={`${rowCount.toLocaleString()} invoices`}
              size="small"
              sx={{
                bgcolor: alpha(accentGreen, 0.12),
                color: accentGreen,
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 22,
              }}
            />
          )}
        </Box>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: 2,
              py: 10,
            }}
          >
            <CircularProgress size={44} thickness={4} sx={{ color: accentGreen }} />
            <Typography variant="body2" sx={{ color: textSecondary }}>
              Loading invoices…
            </Typography>
          </Box>
        ) : errorMessage ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: 1.5,
              py: 10,
            }}
          >
            <ErrorOutlineIcon sx={{ color: "#f44336", fontSize: 48 }} />
            <Typography variant="body1" sx={{ color: "#f44336", fontWeight: 600 }}>
              {errorMessage}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => fetchAllInvoices(paginationModel.page, paginationModel.pageSize)}
              sx={{
                borderColor: accentGreen,
                color: accentGreen,
                textTransform: "none",
                mt: 1,
                borderRadius: 1.5,
                "&:hover": { bgcolor: alpha(accentGreen, 0.08) },
              }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <DataGrid
            rows={sanitizedRows}
            columns={columns}
            getRowId={(row) => row.id}
            paginationMode="server"
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            rowHeight={62}
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
                transition: "background 0.15s ease",
                cursor: "pointer",
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
    </Box>
  );
}

