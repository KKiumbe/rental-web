import { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import {
  Box, Button, CircularProgress, Stack, Alert, Snackbar, Typography,
  Paper, Grid, Tooltip, IconButton, Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SmsIcon from "@mui/icons-material/Sms";
import ReceiptIcon from "@mui/icons-material/Receipt";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WaterIcon from "@mui/icons-material/Water";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import SmsDialog from "../customers/customerDetails/dialogs/SmsDialog";
import DeleteDialog from "../customers/customerDetails/dialogs/DeleteDialog";
import ActivateDialog from "../customers/customerDetails/dialogs/ActivateDialog";
import { statusChip, getInitials } from "../customers/customerDetails/helpers";

const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";

/* ── InfoRow ─────────────────────────────────────────────────────────────── */
const InfoRow = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600}>
      {value ?? "—"}
    </Typography>
  </Box>
);

InfoRow.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

/* ════════════════════════════════════════════════════════════════════════════ */
const WaterOnlyCustomerDetails = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const theme       = useTheme();
  const isDark      = theme.palette.mode === "dark";
  const blue        = theme.palette?.blueAccent?.main  || "#1976d2";
  const green       = theme.palette?.greenAccent?.main || "#388e3c";

  const [customer,         setCustomer]         = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [sending,          setSending]          = useState(false);
  const [smsMessage,       setSmsMessage]       = useState("");
  const [openSmsDialog,    setOpenSmsDialog]    = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [snackbar,         setSnackbar]         = useState({ open: false, msg: "", severity: "success" });

  const showSnack = (msg, severity = "success") =>
    setSnackbar({ open: true, msg, severity });

  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASEURL}/water-only-customers/${id}`, { withCredentials: true });
      setCustomer(res.data.data);
    } catch (err) {
      setSnackbar({ open: true, msg: err.response?.data?.message || "Failed to load customer details.", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCustomer(); }, [fetchCustomer]);

  /* ── handlers ───────────────────────────────────────────────────────────── */
  const sendSMS = async () => {
    setSending(true);
    try {
      await axios.post(`${BASEURL}/send-sms`,
        { mobile: customer?.phoneNumber, message: smsMessage },
        { withCredentials: true });
      showSnack("SMS sent successfully");
      setOpenSmsDialog(false);
      setSmsMessage("");
    } catch (err) {
      showSnack(err.response?.data?.message || "Failed to send SMS.", "error");
    } finally { setSending(false); }
  };

  const sendBill = async () => {
    setSending(true);
    try {
      await axios.post(`${BASEURL}/send-bill`,
        { waterCustomerId: customer?.id },
        { withCredentials: true });
      showSnack("Bill sent successfully");
    } catch (err) {
      showSnack(err.response?.data?.message || "Failed to send bill.", "error");
    } finally { setSending(false); }
  };

  const deleteCustomer = async () => {
    setSending(true);
    try {
      await axios.delete(`${BASEURL}/water-only-customers/${id}`, { withCredentials: true });
      showSnack("Customer deleted");
      setOpenDeleteDialog(false);
      navigate("/water-only-customers");
    } catch (err) {
      showSnack(err.response?.data?.message || "Failed to delete customer.", "error");
    } finally { setSending(false); }
  };

  const activateCustomer = async () => {
    setSending(true);
    try {
      await axios.post(`${BASEURL}/activate-water-customer`,
        { waterCustomerId: customer?.id },
        { withCredentials: true });
      setCustomer((prev) => ({ ...prev, status: "ACTIVE" }));
      showSnack("Customer activated");
      setOpenStatusDialog(false);
    } catch (err) {
      showSnack(err.response?.data?.message || "Failed to activate customer.", "error");
    } finally { setSending(false); }
  };

  /* ════════════════════ RENDER ════════════════════════════════════════════ */
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary">Loading customer details…</Typography>
        </Stack>
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Water customer not found.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>Back</Button>
      </Box>
    );
  }

  const consumption = Math.max(0, (customer.currentReading ?? 0) - (customer.previousReading ?? 0));
  const contrastText = theme.palette?.primary?.contrastText;

  return (
    <Box sx={{
      bgcolor: theme.palette.background.default,
      minHeight: "100vh",
      p: { xs: 2, md: 3 },
      display: "flex",
      flexDirection: "column",
      gap: 3,
    }}>
      {/* ── Action Bar ─────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Tooltip title="Back">
            <IconButton
              onClick={() => navigate(-1)}
              size="small"
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              {customer.firstName} {customer.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Water Customer Detail
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined"
            size="small"
            startIcon={<SmsIcon />}
            onClick={() => setOpenSmsDialog(true)}
            disabled={sending || !customer.phoneNumber}
            sx={{ fontWeight: 600, color: contrastText, borderColor: contrastText, "&:hover": { borderColor: contrastText, opacity: 0.85 } }}
          >
            SMS
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ReceiptIcon />}
            onClick={sendBill}
            disabled={sending}
            sx={{ fontWeight: 600, color: contrastText, borderColor: contrastText, "&:hover": { borderColor: contrastText, opacity: 0.85 } }}
          >
            Send Bill
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<DeleteIcon />}
            color="error"
            onClick={() => setOpenDeleteDialog(true)}
            disabled={sending}
            sx={{ fontWeight: 600 }}
          >
            Delete
          </Button>
        </Stack>
      </Box>

      {/* ── Profile Card ───────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden", bgcolor: theme.palette.background.paper }}>
        {/* Header */}
        <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", gap: 2, borderBottom: "1px solid", borderColor: "divider", flexWrap: "wrap" }}>
          <Avatar sx={{ bgcolor: blue, width: 52, height: 52, fontSize: "1.2rem", fontWeight: 700 }}>
            {getInitials(customer.firstName, customer.lastName)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="h6" fontWeight={700}>
                {customer.firstName} {customer.lastName}
              </Typography>
              {statusChip(customer.status, isDark ? "dark" : "light")}
              {customer.status === "PENDING" && (
                <Tooltip title="Activate customer">
                  <IconButton size="small" onClick={() => setOpenStatusDialog(true)} sx={{ color: green }}>
                    <CheckCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Water-Only Customer
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Outstanding Balance
            </Typography>
            <Typography
              variant="h6"
              fontWeight={700}
              color={(customer.closingBalance || 0) > 0 ? "error.main" : "success.main"}
            >
              Ksh {Number(customer.closingBalance || 0).toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {/* Body */}
        <Box sx={{ p: 2.5 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Typography variant="overline" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
                Contact
              </Typography>
              <Stack spacing={1.5}>
                <InfoRow label="Phone" value={customer.phoneNumber} />
                <InfoRow label="Status" value={customer.status} />
                <InfoRow label="Meter Type" value={customer.meterType} />
              </Stack>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <WaterIcon fontSize="small" sx={{ color: blue }} />
                <Typography variant="overline" fontWeight={700} color="text.secondary">
                  Water Readings
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <InfoRow label="Previous Reading" value={`${customer.previousReading ?? 0} m³`} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <InfoRow label="Current Reading" value={`${customer.currentReading ?? 0} m³`} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <InfoRow label="Consumption" value={`${consumption} m³`} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <InfoRow label="Water Rate" value={`KSH ${customer.waterRate ?? 130}/m³`} />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* ── Data Tabs placeholder ──────────────────────────────────────── */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden", bgcolor: theme.palette.background.paper }}>
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Invoice and payment history will appear here once the schema is extended.
          </Typography>
        </Box>
      </Paper>

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <SmsDialog
        open={openSmsDialog}
        onClose={() => setOpenSmsDialog(false)}
        customer={customer}
        smsMessage={smsMessage}
        setSmsMessage={setSmsMessage}
        sending={sending}
        onSend={sendSMS}
      />

      <DeleteDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        customer={customer}
        sending={sending}
        onDelete={deleteCustomer}
        title="Delete Water Customer"
        bodyText="Are you sure you want to delete this water customer? This action cannot be undone."
      />

      <ActivateDialog
        open={openStatusDialog}
        onClose={() => setOpenStatusDialog(false)}
        customer={customer}
        sending={sending}
        onActivate={activateCustomer}
        title="Activate Water Customer"
        bodyText={
          <>
            Activate{" "}
            <strong>{customer?.firstName} {customer?.lastName}</strong>?
          </>
        }
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 1.5 }}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WaterOnlyCustomerDetails;
