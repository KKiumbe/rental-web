import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import {
  Typography, Tabs, Tab, Box, Button, Grid, IconButton, CircularProgress,
  Paper, TextField, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, Stack, Alert, Snackbar, FormControl, InputLabel, LinearProgress,
  Select, MenuItem, Avatar, Chip, Divider, Tooltip,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
} from "@mui/x-data-grid";
import axios from "axios";
import VisibilityIcon        from "@mui/icons-material/Visibility";
import ArrowBackIcon         from "@mui/icons-material/ArrowBack";
import EditIcon              from "@mui/icons-material/Edit";
import DeleteIcon            from "@mui/icons-material/Delete";
import SmsIcon               from "@mui/icons-material/Sms";
import ReceiptIcon           from "@mui/icons-material/Receipt";
import DescriptionIcon       from "@mui/icons-material/Description";
import HomeIcon              from "@mui/icons-material/Home";
import PersonIcon            from "@mui/icons-material/Person";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CheckCircleOutlineIcon   from "@mui/icons-material/CheckCircleOutline";
import WaterIcon             from "@mui/icons-material/Water";
import { useAuthStore } from "../../store/authStore";
import PropTypes from "prop-types";

const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const formatDate = (val) => {
  if (!val) return "—";
  try {
    const d = new Date(val);
    return `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
  } catch { return "—"; }
};

const getInitials = (f = "", l = "") =>
  `${f[0] || ""}${l[0] || ""}`.toUpperCase() || "?";

const STATUS_STYLE = {
  ACTIVE:     { label: "Active",     lightBg: "#e8f5e9", lightColor: "#2e7d32", darkBg: "#1b5e20", darkColor: "#a5d6a7" },
  INACTIVE:   { label: "Inactive",   lightBg: "#fff8e1", lightColor: "#f57f17", darkBg: "#4e342e", darkColor: "#ffcc02" },
  TERMINATED: { label: "Terminated", lightBg: "#fce4ec", lightColor: "#c62828", darkBg: "#4a1218", darkColor: "#ef9a9a" },
  PENDING:    { label: "Pending",    lightBg: "#e3f2fd", lightColor: "#1565c0", darkBg: "#0d2744", darkColor: "#90caf9" },
};

const statusChip = (value, mode = "light") => {
  const s = STATUS_STYLE[value];
  const bg    = s ? (mode === "dark" ? s.darkBg    : s.lightBg)    : (mode === "dark" ? "#2a2a2a" : "#f5f5f5");
  const color = s ? (mode === "dark" ? s.darkColor  : s.lightColor) : (mode === "dark" ? "#bbb"    : "#616161");
  const label = s?.label || value || "Unknown";
  return (
    <Chip label={label} size="small"
      sx={{ backgroundColor: bg, color, fontWeight: 600, fontSize: "0.7rem", border: "none" }} />
  );
};

/* ─── info row ─────────────────────────────────────────────────────────────── */
const InfoRow = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Typography variant="body2" fontWeight={600}>{value || "—"}</Typography>
  </Box>
);
InfoRow.propTypes = { label: PropTypes.string, value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) };

/* ─── toolbar ──────────────────────────────────────────────────────────────── */
const CustomToolbar = () => (
  <GridToolbarContainer sx={{ px: 1, py: 0.5, gap: 0.5 }}>
    <GridToolbarColumnsButton />
    <GridToolbarFilterButton />
    <GridToolbarDensitySelector />
    <GridToolbarExport />
  </GridToolbarContainer>
);

/* ─── empty state ──────────────────────────────────────────────────────────── */
const EmptyState = ({ message }) => (
  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, gap: 1 }}>
    <DescriptionIcon sx={{ fontSize: 40, color: "action.disabled" }} />
    <Typography variant="body2" color="text.secondary">{message}</Typography>
  </Box>
);
EmptyState.propTypes = { message: PropTypes.string };

/* ════════════════════════════════════════════════════════════════════════════ */
const CustomerDetails = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const currentUser  = useAuthStore((state) => state.currentUser);
  const theme        = useTheme();
  const isDark       = theme.palette.mode === "dark";

  const blue  = theme.palette?.blueAccent?.main  || "#1976d2";
  const green = theme.palette?.greenAccent?.main  || "#388e3c";

  const [customer,           setCustomer]           = useState(null);
  const [tabIndex,           setTabIndex]           = useState(0);
  const [loading,            setLoading]            = useState(true);
  const [sending,            setSending]            = useState(false);
  const [smsMessage,         setSmsMessage]         = useState("");
  const [selectedUnitId,     setSelectedUnitId]     = useState("");
  const [leaseFile,          setLeaseFile]          = useState(null);
  const [openSmsDialog,      setOpenSmsDialog]      = useState(false);
  const [openLeaseDialog,    setOpenLeaseDialog]    = useState(false);
  const [openDeleteDialog,   setOpenDeleteDialog]   = useState(false);
  const [openTerminateDialog,setOpenTerminateDialog]= useState(false);
  const [openStatusDialog,   setOpenStatusDialog]   = useState(false);
  const [snackbar,           setSnackbar]           = useState({ open: false, msg: "", severity: "success" });

  const showSnack = (msg, severity = "success") => setSnackbar({ open: true, msg, severity });

  /* ── auth ──────────────────────────────────────────────────────────────── */
  useEffect(() => { if (!currentUser) navigate("/login"); }, [currentUser, navigate]);

  /* ── fetch ─────────────────────────────────────────────────────────────── */
  const fetchCustomerDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASEURL}/customer-details/${id}`, { withCredentials: true });
      setCustomer(res.data);
      if (res.data.units?.length > 0) setSelectedUnitId(res.data.units[0].id);
    } catch (err) {
      showSnack(err.response?.data?.message || "Failed to load customer details.", "error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCustomerDetails(); }, [fetchCustomerDetails]);

  /* ── actions ───────────────────────────────────────────────────────────── */
  const sendSMS = async () => {
    setSending(true);
    try {
      await axios.post(`${BASEURL}/send-sms`, { mobile: customer?.phoneNumber, message: smsMessage }, { withCredentials: true });
      showSnack("SMS sent successfully");
      setOpenSmsDialog(false);
      setSmsMessage("");
    } catch (err) { showSnack(err.response?.data?.message || "Failed to send SMS.", "error"); }
    finally { setSending(false); }
  };

  const sendBill = async () => {
    setSending(true);
    try {
      await axios.post(`${BASEURL}/send-bill`, { customerId: customer?.id, unitId: selectedUnitId }, { withCredentials: true });
      showSnack("Invoice sent successfully");
    } catch (err) { showSnack(err.response?.data?.message || "Failed to send invoice.", "error"); }
    finally { setSending(false); }
  };

  const deleteCustomer = async () => {
    setSending(true);
    try {
      await axios.delete(`${BASEURL}/customers/${id}`, { withCredentials: true });
      showSnack("Customer deleted");
      setOpenDeleteDialog(false);
      navigate("/customers");
    } catch (err) { showSnack(err.response?.data?.message || "Failed to delete customer.", "error"); }
    finally { setSending(false); }
  };

  const updateCustomerStatus = async () => {
    setSending(true);
    try {
      await axios.post(`${BASEURL}/active-customer`, { customerId: customer?.id }, { withCredentials: true });
      setCustomer((prev) => ({ ...prev, status: "ACTIVE" }));
      showSnack("Customer activated");
      setOpenStatusDialog(false);
    } catch (err) { showSnack(err.response?.data?.message || "Failed to update status.", "error"); }
    finally { setSending(false); }
  };

  const handleLeaseUpload = async () => {
    if (!leaseFile) { showSnack("Please select a PDF file.", "warning"); return; }
    if (leaseFile.type !== "application/pdf") { showSnack("Only PDF files are allowed.", "warning"); return; }
    if (leaseFile.size > 5 * 1024 * 1024) { showSnack("File size exceeds 5 MB.", "warning"); return; }
    if (!selectedUnitId) { showSnack("Please select a unit.", "warning"); return; }
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("leaseFile", leaseFile);
      fd.append("customerId", customer?.id);
      fd.append("unitId", selectedUnitId);
      const res = await axios.post(`${BASEURL}/upload-lease`, fd, { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } });
      setCustomer((prev) => ({
        ...prev,
        units: prev.units.map((u) => u.id === selectedUnitId
          ? { ...u, leaseFileUrl: res.data.leaseFileUrl || `Uploads/leases/${leaseFile.name}`, leaseStartDate: res.data.leaseStartDate || new Date().toISOString(), leaseEndDate: res.data.leaseEndDate }
          : u),
      }));
      showSnack("Lease uploaded successfully");
      setLeaseFile(null);
      setOpenLeaseDialog(false);
    } catch (err) { showSnack(err.response?.data?.message || "Failed to upload lease.", "error"); }
    finally { setSending(false); }
  };

  const handleLeaseDownload = async (unitId) => {
    setSending(true);
    try {
      const res = await axios.get(`${BASEURL}/download-lease/${id}/${unitId}`, { withCredentials: true, responseType: "blob" });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `lease_${customer?.firstName}_${customer?.lastName}_unit_${unitId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSnack("Lease downloaded");
    } catch (err) { showSnack(err.response?.data?.message || "Failed to download lease.", "error"); }
    finally { setSending(false); }
  };

  const confirmTerminateLease = async () => {
    if (!selectedUnitId) { showSnack("Please select a unit.", "warning"); return; }
    setSending(true);
    try {
      await axios.post(`${BASEURL}/terminate-lease/${id}/${selectedUnitId}`, {}, { withCredentials: true });
      setCustomer((prev) => ({
        ...prev,
        units: prev.units.map((u) => u.id === selectedUnitId ? { ...u, leaseFileUrl: null, leaseStartDate: null, leaseEndDate: null } : u),
      }));
      showSnack("Lease terminated");
      setOpenTerminateDialog(false);
      setOpenLeaseDialog(false);
    } catch (err) { showSnack(err.response?.data?.message || "Failed to terminate lease.", "error"); }
    finally { setSending(false); }
  };

  /* ── columns ───────────────────────────────────────────────────────────── */
  const invoiceColumns = [
    {
      field: "actions", headerName: "", width: 60, sortable: false, filterable: false,
      renderCell: (p) => (
        <Tooltip title="View Invoice">
          <IconButton component={Link} to={`/get-invoice/${p.row.id}`} size="small" sx={{ color: blue }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    { field: "invoiceNumber", headerName: "Invoice #", width: 150, renderCell: (p) => <Typography variant="body2" fontWeight={600}>{p.value}</Typography> },
    {
      field: "invoiceAmount", headerName: "Amount (Ksh)", width: 140, type: "number",
      renderCell: (p) => <Typography variant="body2" fontWeight={600}>Ksh {Number(p.value || 0).toLocaleString()}</Typography>,
    },
    {
      field: "status", headerName: "Status", width: 130,
      renderCell: (p) => statusChip(p.value, isDark ? "dark" : "light"),
    },
    {
      field: "items", headerName: "Items", flex: 1, minWidth: 260,
      renderCell: (p) => (
        <Typography variant="caption" color="text.secondary" noWrap>
          {p.value?.map((i) => `${i.description} ×${i.quantity}`).join(" · ") || "—"}
        </Typography>
      ),
    },
    {
      field: "createdAt", headerName: "Date", width: 130,
      renderCell: (p) => <Typography variant="body2" color="text.secondary">{formatDate(p.value)}</Typography>,
    },
  ];

  const paymentColumns = [
    {
      field: "actions", headerName: "", width: 60, sortable: false, filterable: false,
      renderCell: (p) => (
        <Tooltip title="View Payment">
          <IconButton component={Link} to={`/payments/${p.row.id}`} size="small" sx={{ color: blue }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    { field: "paymentNumber",  headerName: "Payment #",      width: 150 },
    {
      field: "amount", headerName: "Amount (Ksh)", width: 140, type: "number",
      renderCell: (p) => <Typography variant="body2" fontWeight={600}>Ksh {Number(p.value || 0).toLocaleString()}</Typography>,
    },
    { field: "modeOfPayment",  headerName: "Payment Mode",   width: 150 },
    { field: "paidBy",         headerName: "Paid By",        width: 150 },
    { field: "transactionCode",headerName: "Transaction Code",width: 160 },
    {
      field: "createdAt", headerName: "Date", width: 130,
      renderCell: (p) => <Typography variant="body2" color="text.secondary">{formatDate(p.value)}</Typography>,
    },
  ];

  const waterColumns = [
    {
      field: "actions", headerName: "", width: 60, sortable: false, filterable: false,
      renderCell: (p) => (
        <Tooltip title="View Reading">
          <IconButton component={Link} to={`/water-reading/${p.row.id}`} size="small" sx={{ color: blue }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: "period", headerName: "Period", width: 130,
      renderCell: (p) => <Typography variant="body2">{p.value ? new Date(p.value).toLocaleString("default", { year: "numeric", month: "short" }) : "—"}</Typography>,
    },
    { field: "reading",     headerName: "Reading (m³)",     width: 140 },
    { field: "consumption", headerName: "Consumption (m³)", width: 150 },
    {
      field: "abnormalReading", headerName: "Abnormal", width: 110,
      renderCell: (p) => (
        <Chip label={p.row.AbnormalWaterReading?.length > 0 ? "Yes" : "No"} size="small"
          sx={{
            bgcolor: p.row.AbnormalWaterReading?.length > 0
              ? (isDark ? "#4a1218" : "#fce4ec")
              : (isDark ? "#1b5e20" : "#e8f5e9"),
            color: p.row.AbnormalWaterReading?.length > 0
              ? (isDark ? "#ef9a9a" : "#c62828")
              : (isDark ? "#a5d6a7" : "#2e7d32"),
            fontWeight: 600, fontSize: "0.7rem",
          }} />
      ),
    },
    {
      field: "createdAt", headerName: "Recorded", width: 130,
      renderCell: (p) => <Typography variant="body2" color="text.secondary">{formatDate(p.value)}</Typography>,
    },
  ];

  const gasColumns = [
    {
      field: "period", headerName: "Period", width: 130,
      renderCell: (p) => <Typography variant="body2">{p.value ? new Date(p.value).toLocaleString("default", { year: "numeric", month: "short" }) : "—"}</Typography>,
    },
    { field: "consumption", headerName: "Consumption (m³)", width: 160 },
    {
      field: "createdAt", headerName: "Recorded", width: 130,
      renderCell: (p) => <Typography variant="body2" color="text.secondary">{formatDate(p.value)}</Typography>,
    },
  ];

  const selectedUnit = customer?.units?.find((u) => u.id === selectedUnitId);

  /* ── grid sx ───────────────────────────────────────────────────────────── */
  const gridSx = {
    border: 0,
    "& .MuiDataGrid-columnHeaders": {
      backgroundColor: theme.palette.background.default,
      fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase",
      letterSpacing: "0.04em", borderBottom: "2px solid", borderColor: "divider",
    },
    "& .MuiDataGrid-row:hover": { backgroundColor: `${blue}1a` },
    "& .MuiDataGrid-cell": { borderColor: "divider", alignItems: "center" },
    "& .MuiDataGrid-footerContainer": { borderTop: "1px solid", borderColor: "divider" },
  };

  /* ════════════════════ RENDER ═══════════════════════════════════════════ */
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary">Loading tenant details…</Typography>
        </Stack>
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Tenant not found.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>Back</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: "100vh", minWidth:"1000px", p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 3 }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Tooltip title="Back">
            <IconButton onClick={() => navigate(-1)} size="small"
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              {customer.firstName} {customer.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">Tenant Detail</Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="outlined" size="small" startIcon={<SmsIcon />}
            onClick={() => setOpenSmsDialog(true)} disabled={sending || !customer.phoneNumber}
            sx={{ fontWeight: 600, color: theme.palette?.primary?.contrastText, borderColor: theme.palette?.primary?.contrastText,
              "&:hover": { borderColor: theme.palette?.primary?.contrastText, opacity: 0.85 } }}>
            SMS
          </Button>
          <Button variant="outlined" size="small" startIcon={<ReceiptIcon />}
            onClick={sendBill} disabled={sending || !selectedUnitId}
            sx={{ fontWeight: 600, color: theme.palette?.primary?.contrastText, borderColor: theme.palette?.primary?.contrastText,
              "&:hover": { borderColor: theme.palette?.primary?.contrastText, opacity: 0.85 } }}>
            Send Invoice
          </Button>
          <Button variant="outlined" size="small" startIcon={<DescriptionIcon />}
            onClick={() => setOpenLeaseDialog(true)} disabled={sending || !customer.units?.length}
            sx={{ fontWeight: 600, color: theme.palette?.primary?.contrastText, borderColor: theme.palette?.primary?.contrastText,
              "&:hover": { borderColor: theme.palette?.primary?.contrastText, opacity: 0.85 } }}>
            Manage Lease
          </Button>
          <Button variant="contained" size="small" startIcon={<EditIcon />}
            onClick={() => navigate(`/customer-edit/${id}`)}
            sx={{ fontWeight: 600, bgcolor: green, color: "#fff",
              "&:hover": { bgcolor: theme.palette?.greenAccent?.dark || "#2e7d32" } }}>
            Edit
          </Button>
          <Button variant="contained" size="small" startIcon={<DeleteIcon />}
            color="error" onClick={() => setOpenDeleteDialog(true)} disabled={sending}
            sx={{ fontWeight: 600 }}>
            Delete
          </Button>
        </Stack>
      </Box>

      {/* ── Profile Card ─────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden", bgcolor: theme.palette.background.paper }}>
        {/* card header */}
        <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", gap: 2, borderBottom: "1px solid", borderColor: "divider", flexWrap: "wrap" }}>
          <Avatar sx={{ bgcolor: blue, width: 52, height: 52, fontSize: "1.2rem", fontWeight: 700 }}>
            {getInitials(customer.firstName, customer.lastName)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="h6" fontWeight={700}>{customer.firstName} {customer.lastName}</Typography>
              {statusChip(customer.status, isDark ? "dark" : "light")}
              {customer.status === "PENDING" && (
                <Tooltip title="Activate tenant">
                  <IconButton size="small" onClick={() => setOpenStatusDialog(true)} sx={{ color: green }}>
                    <CheckCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">{customer.email || "No email on file"}</Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" color="text.secondary" display="block">Outstanding Balance</Typography>
            <Typography variant="h6" fontWeight={700} color={(customer.closingBalance || 0) > 0 ? "error.main" : "success.main"}>
              Ksh {Number(customer.closingBalance || 0).toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {/* contact + unit info */}
        <Box sx={{ p: 2.5 }}>
          <Grid container spacing={3}>
            {/* contact */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <PersonIcon fontSize="small" sx={{ color: blue }} />
                <Typography variant="overline" fontWeight={700} color="text.secondary">Contact</Typography>
              </Box>
              <Stack spacing={1.5}>
                <InfoRow label="Phone"           value={customer.phoneNumber} />
                <InfoRow label="Secondary Phone" value={customer.secondaryPhoneNumber} />
                <InfoRow label="Email"           value={customer.email} />
                <InfoRow label="National ID"     value={customer.nationalId} />
              </Stack>
            </Grid>

            {/* unit(s) */}
            <Grid item xs={12} sm={6} md={9}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <HomeIcon fontSize="small" sx={{ color: green }} />
                <Typography variant="overline" fontWeight={700} color="text.secondary">
                  {customer.units?.length > 1 ? "Units" : "Unit"}
                </Typography>
              </Box>
              {customer.units?.length > 0 ? (
                <Grid container spacing={2}>
                  {customer.units.map((unit) => (
                    <Grid item xs={12} sm={6} md={4} key={unit.id}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                          <Typography variant="body2" fontWeight={700}>Unit {unit.unitNumber}</Typography>
                          <Chip label={unit.status} size="small"
                            sx={{
                              bgcolor: unit.status === "OCCUPIED"
                                ? (isDark ? "#1b5e20" : "#e8f5e9")
                                : (isDark ? "#0d2744" : "#e3f2fd"),
                              color: unit.status === "OCCUPIED"
                                ? (isDark ? "#a5d6a7" : "#2e7d32")
                                : (isDark ? "#90caf9" : "#1565c0"),
                              fontWeight: 600, fontSize: "0.68rem",
                            }} />
                        </Box>
                        <Stack spacing={0.8}>
                          <InfoRow label="Building"    value={unit.building?.name} />
                          <InfoRow label="Rent"        value={unit.monthlyCharge ? `Ksh ${Number(unit.monthlyCharge).toLocaleString()}` : undefined} />
                          <InfoRow label="Unit Type"   value={unit.unitType?.replace(/_/g, " ")} />
                          <InfoRow label="Lease Start" value={formatDate(unit.leaseStartDate)} />
                          <InfoRow label="Lease End"   value={formatDate(unit.leaseEndDate)} />
                        </Stack>
                        {unit.leaseFileUrl && (
                          <Button size="small" startIcon={<DescriptionIcon />}
                            onClick={() => handleLeaseDownload(unit.id)} disabled={sending}
                            sx={{ mt: 1.5, color: green, fontWeight: 600, p: 0, textTransform: "none" }}>
                            Download Lease
                          </Button>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">No unit assigned.</Typography>
              )}
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden", bgcolor: theme.palette.background.paper }}>
        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v)}
          sx={{
            px: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
            "& .MuiTab-root": { fontWeight: 600, textTransform: "none", minHeight: 48 },
            "& .Mui-selected": { color: blue },
            "& .MuiTabs-indicator": { backgroundColor: blue },
          }}
        >
          <Tab label="Invoices"          icon={<ReceiptIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Payments"          icon={<AccountBalanceWalletIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Water Readings"    icon={<WaterIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Gas Consumption"   icon={<DescriptionIcon fontSize="small" />} iconPosition="start" />
        </Tabs>

        {/* Invoices */}
        <Box hidden={tabIndex !== 0} sx={{ p: 0 }}>
          {!customer.invoices?.length ? <EmptyState message="No invoices found." /> : (
            <DataGrid
              rows={customer.invoices.map((inv) => ({ ...inv, items: inv.InvoiceItem || [] }))}
              columns={invoiceColumns}
              getRowId={(r) => r.id}
              autoHeight
              density="comfortable"
              pageSizeOptions={[10, 25]}
              components={{ Toolbar: CustomToolbar }}
              sx={gridSx}
            />
          )}
        </Box>

        {/* Payments */}
        <Box hidden={tabIndex !== 1} sx={{ p: 0 }}>
          {!customer.payments?.length ? <EmptyState message="No payment records found." /> : (
            <DataGrid
              rows={customer.payments}
              columns={paymentColumns}
              getRowId={(r) => r.id}
              autoHeight
              density="comfortable"
              pageSizeOptions={[10, 25]}
              components={{ Toolbar: CustomToolbar }}
              sx={gridSx}
            />
          )}
        </Box>

        {/* Water */}
        <Box hidden={tabIndex !== 2} sx={{ p: 0 }}>
          {!customer.waterConsumptions?.length ? <EmptyState message="No water readings found." /> : (
            <DataGrid
              rows={customer.waterConsumptions}
              columns={waterColumns}
              getRowId={(r) => r.id}
              autoHeight
              density="comfortable"
              pageSizeOptions={[10, 25]}
              components={{ Toolbar: CustomToolbar }}
              sx={gridSx}
            />
          )}
        </Box>

        {/* Gas */}
        <Box hidden={tabIndex !== 3} sx={{ p: 0 }}>
          {!customer.gasConsumptions?.length ? <EmptyState message="No gas consumption records found." /> : (
            <DataGrid
              rows={customer.gasConsumptions}
              columns={gasColumns}
              getRowId={(r) => r.id}
              autoHeight
              density="comfortable"
              pageSizeOptions={[10, 25]}
              components={{ Toolbar: CustomToolbar }}
              sx={gridSx}
            />
          )}
        </Box>
      </Paper>

      {/* ════════════════ DIALOGS ═══════════════════════════════════════════ */}

      {/* SMS */}
      <Dialog open={openSmsDialog} onClose={() => setOpenSmsDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
          <SmsIcon color="action" fontSize="small" />
          <Typography variant="h6" fontWeight={700}>Send SMS</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            To: {customer.phoneNumber}
          </Typography>
          <TextField fullWidth label="Message" multiline rows={4} value={smsMessage}
            onChange={(e) => setSmsMessage(e.target.value)} size="small" />
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setOpenSmsDialog(false)} disabled={sending}>Cancel</Button>
          <Button variant="contained" onClick={sendSMS} disabled={sending || !smsMessage.trim()}
            sx={{ bgcolor: blue, color: "#fff", fontWeight: 600, "&:hover": { bgcolor: theme.palette?.blueAccent?.dark || "#1565c0" } }}>
            {sending ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Send"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>Delete Tenant</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <DialogContentText>
            Are you sure you want to delete <strong>{customer.firstName} {customer.lastName}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={sending}>Cancel</Button>
          <Button variant="contained" color="error" onClick={deleteCustomer} disabled={sending} sx={{ fontWeight: 600 }}>
            {sending ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activate */}
      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>Activate Tenant</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <DialogContentText>
            Activate <strong>{customer.firstName} {customer.lastName}</strong>? Ensure rent and deposit invoices have been paid.
          </DialogContentText>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setOpenStatusDialog(false)} disabled={sending}>Cancel</Button>
          <Button variant="contained" onClick={updateCustomerStatus} disabled={sending}
            sx={{ bgcolor: green, color: "#fff", fontWeight: 600, "&:hover": { bgcolor: theme.palette?.greenAccent?.dark || "#2e7d32" } }}>
            {sending ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Activate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Lease */}
      <Dialog open={openLeaseDialog} onClose={() => setOpenLeaseDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
          <DescriptionIcon color="action" fontSize="small" />
          <Typography variant="h6" fontWeight={700}>Manage Lease</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          {sending && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}
          <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
            <InputLabel>Select Unit</InputLabel>
            <Select value={selectedUnitId} label="Select Unit"
              onChange={(e) => setSelectedUnitId(e.target.value)} disabled={sending}>
              {customer.units?.map((u) => (
                <MenuItem key={u.id} value={u.id}>Unit {u.unitNumber} — {u.building?.name || "N/A"}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedUnit?.leaseFileUrl ? (
            <>
              <Alert severity="success" icon={<DescriptionIcon fontSize="inherit" />} sx={{ mb: 2, borderRadius: 1.5 }}>
                Active lease for Unit {selectedUnit.unitNumber} · Started {formatDate(selectedUnit.leaseStartDate)}
              </Alert>
              <Stack direction="row" spacing={1.5}>
                <Button variant="contained" startIcon={<DescriptionIcon />}
                  onClick={() => handleLeaseDownload(selectedUnitId)} disabled={sending}
                  sx={{ bgcolor: blue, color: "#fff", fontWeight: 600, "&:hover": { bgcolor: theme.palette?.blueAccent?.dark || "#1565c0" } }}>
                  Download
                </Button>
                <Button variant="outlined" color="error" onClick={() => setOpenTerminateDialog(true)} disabled={sending} sx={{ fontWeight: 600 }}>
                  Terminate
                </Button>
              </Stack>
            </>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2, borderRadius: 1.5 }}>
                No lease found for Unit {selectedUnit?.unitNumber || "—"}. Upload a PDF (max 5 MB).
              </Alert>
              <Button variant="outlined" component="label" sx={{ fontWeight: 600, mb: 1.5 }}>
                {leaseFile ? leaseFile.name : "Choose PDF…"}
                <input type="file" accept=".pdf" hidden onChange={(e) => setLeaseFile(e.target.files[0])} />
              </Button>
              <Box>
                <Button variant="contained" onClick={handleLeaseUpload}
                  disabled={sending || !leaseFile || !selectedUnitId}
                  sx={{ bgcolor: green, color: "#fff", fontWeight: 600, "&:hover": { bgcolor: theme.palette?.greenAccent?.dark || "#2e7d32" } }}>
                  {sending ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Upload Lease"}
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setOpenLeaseDialog(false)} disabled={sending}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Terminate Lease confirm */}
      <Dialog open={openTerminateDialog} onClose={() => setOpenTerminateDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>Terminate Lease</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <DialogContentText>
            Are you sure you want to terminate the lease for Unit <strong>{selectedUnit?.unitNumber}</strong>?
          </DialogContentText>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setOpenTerminateDialog(false)} disabled={sending}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmTerminateLease} disabled={sending} sx={{ fontWeight: 600 }}>
            {sending ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Terminate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ─────────────────────────────────────────────────────── */}
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity} variant="filled" sx={{ borderRadius: 1.5 }}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerDetails;
