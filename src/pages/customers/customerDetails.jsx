import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import {
  Box, Button, CircularProgress, Stack, Alert, Snackbar, Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";

import CustomerActionBar   from "./customerDetails/CustomerActionBar";
import CustomerProfileCard from "./customerDetails/CustomerProfileCard";
import CustomerDataTabs    from "./customerDetails/CustomerDataTabs";
import SmsDialog           from "./customerDetails/dialogs/SmsDialog";
import DeleteDialog        from "./customerDetails/dialogs/DeleteDialog";
import ActivateDialog      from "./customerDetails/dialogs/ActivateDialog";
import ManageLeaseDialog   from "./customerDetails/dialogs/ManageLeaseDialog";
import SendBillDialog      from "./customerDetails/dialogs/SendBillDialog";

const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";

/* ════════════════════════════════════════════════════════════════════════════ */
const CustomerDetails = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const theme       = useTheme();
  const isDark      = theme.palette.mode === "dark";

  /* ── state ──────────────────────────────────────────────────────────────── */
  const [customer,            setCustomer]            = useState(null);
  const [tabIndex,            setTabIndex]            = useState(0);
  const [loading,             setLoading]             = useState(true);
  const [sending,             setSending]             = useState(false);
  const [smsMessage,          setSmsMessage]          = useState("");
  const [selectedUnitId,      setSelectedUnitId]      = useState("");
  const [leaseFile,           setLeaseFile]           = useState(null);
  const [openSmsDialog,       setOpenSmsDialog]       = useState(false);
  const [openLeaseDialog,     setOpenLeaseDialog]     = useState(false);
  const [openDeleteDialog,    setOpenDeleteDialog]    = useState(false);
  const [openTerminateDialog, setOpenTerminateDialog] = useState(false);
  const [openSendBillDialog,  setOpenSendBillDialog]  = useState(false);
  const [billPeriod,          setBillPeriod]          = useState(null);
  const [openStatusDialog,    setOpenStatusDialog]    = useState(false);
  const [terminationReason,   setTerminationReason]   = useState("");
  const [terminationDate,     setTerminationDate]     = useState("");
  const [snackbar,            setSnackbar]            = useState({ open: false, msg: "", severity: "success" });

  const showSnack = (msg, severity = "success") =>
    setSnackbar({ open: true, msg, severity });

  /* ── guard ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  /* ── fetch ──────────────────────────────────────────────────────────────── */
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
    if (!billPeriod) { showSnack("Please select a billing period.", "warning"); return; }
    const y = billPeriod.getFullYear();
    const m = String(billPeriod.getMonth() + 1).padStart(2, "0");
    setSending(true);
    try {
      await axios.post(`${BASEURL}/send-bill`,
        { customerId: customer?.id, period: `${y}-${m}` },
        { withCredentials: true });
      showSnack("Invoice sent successfully");
      setOpenSendBillDialog(false);
      setBillPeriod(null);
    } catch (err) {
      showSnack(err.response?.data?.message || "Failed to send invoice.", "error");
    } finally { setSending(false); }
  };

  const deleteCustomer = async () => {
    setSending(true);
    try {
      await axios.delete(`${BASEURL}/customers/${id}`, { withCredentials: true });
      showSnack("Customer deleted");
      setOpenDeleteDialog(false);
      navigate("/customers");
    } catch (err) {
      showSnack(err.response?.data?.message || "Failed to delete customer.", "error");
    } finally { setSending(false); }
  };

  const updateCustomerStatus = async () => {
    setSending(true);
    try {
      await axios.post(`${BASEURL}/active-customer`, { customerId: customer?.id }, { withCredentials: true });
      setCustomer((prev) => ({ ...prev, status: "ACTIVE" }));
      showSnack("Customer activated");
      setOpenStatusDialog(false);
    } catch (err) {
      showSnack(err.response?.data?.message || "Failed to update status.", "error");
    } finally { setSending(false); }
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
      const res = await axios.post(`${BASEURL}/upload-lease`, fd, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCustomer((prev) => ({
        ...prev,
        units: prev.units.map((u) =>
          u.id === selectedUnitId
            ? {
                ...u,
                leaseFileUrl: res.data.leaseFileUrl || `Uploads/leases/${leaseFile.name}`,
                leaseStartDate: res.data.leaseStartDate || new Date().toISOString(),
                leaseEndDate: res.data.leaseEndDate,
              }
            : u
        ),
      }));
      showSnack("Lease uploaded successfully");
      setLeaseFile(null);
      setOpenLeaseDialog(false);
    } catch (err) {
      showSnack(err.response?.data?.message || "Failed to upload lease.", "error");
    } finally { setSending(false); }
  };

  const handleLeaseDownload = async (unitId) => {
    setSending(true);
    try {
      const res = await axios.get(`${BASEURL}/download-lease/${id}/${unitId}`, {
        withCredentials: true,
        responseType: "blob",
      });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `lease_${customer?.firstName}_${customer?.lastName}_unit_${unitId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSnack("Lease downloaded");
    } catch (err) {
      showSnack(err.response?.data?.message || "Failed to download lease.", "error");
    } finally { setSending(false); }
  };

  const confirmTerminateLease = () => {
    if (!selectedUnitId) { showSnack("Please select a unit.", "warning"); return; }
    navigate(`/terminate-lease/${id}`, {
      state: {
        unitId: selectedUnitId,
        reason: terminationReason || undefined,
        terminationDate: terminationDate || undefined,
      },
    });
  };

  /* ════════════════════ RENDER ════════════════════════════════════════════ */
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
    <Box sx={{
      bgcolor: theme.palette.background.default,
      minHeight: "100vh",
      minWidth: "1000px",
      p: { xs: 2, md: 3 },
      display: "flex",
      flexDirection: "column",
      gap: 3,
    }}>
      {/* Header + action buttons */}
      <CustomerActionBar
        customer={customer}
        id={id}
        sending={sending}
        selectedUnitId={selectedUnitId}
        onSmsOpen={() => setOpenSmsDialog(true)}
        onSendBill={() => setOpenSendBillDialog(true)}
        onLeaseOpen={() => setOpenLeaseDialog(true)}
        onDeleteOpen={() => setOpenDeleteDialog(true)}
      />

      {/* Profile card */}
      <CustomerProfileCard
        customer={customer}
        isDark={isDark}
        sending={sending}
        onActivateOpen={() => setOpenStatusDialog(true)}
        onLeaseDownload={handleLeaseDownload}
      />

      {/* Data tabs */}
      <CustomerDataTabs
        customer={customer}
        tabIndex={tabIndex}
        onTabChange={setTabIndex}
      />

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <SendBillDialog
        open={openSendBillDialog}
        onClose={() => { setOpenSendBillDialog(false); setBillPeriod(null); }}
        customer={customer}
        sending={sending}
        onSend={sendBill}
        selectedPeriod={billPeriod}
        setSelectedPeriod={setBillPeriod}
      />

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
      />

      <ActivateDialog
        open={openStatusDialog}
        onClose={() => setOpenStatusDialog(false)}
        customer={customer}
        sending={sending}
        onActivate={updateCustomerStatus}
      />

      <ManageLeaseDialog
        open={openLeaseDialog}
        onClose={() => setOpenLeaseDialog(false)}
        customer={customer}
        sending={sending}
        selectedUnitId={selectedUnitId}
        onUnitChange={setSelectedUnitId}
        leaseFile={leaseFile}
        setLeaseFile={setLeaseFile}
        onLeaseUpload={handleLeaseUpload}
        onLeaseDownload={handleLeaseDownload}
        openTerminateDialog={openTerminateDialog}
        setOpenTerminateDialog={setOpenTerminateDialog}
        terminationReason={terminationReason}
        setTerminationReason={setTerminationReason}
        terminationDate={terminationDate}
        setTerminationDate={setTerminationDate}
        onConfirmTerminate={confirmTerminateLease}
      />

      {/* Snackbar */}
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

export default CustomerDetails;
