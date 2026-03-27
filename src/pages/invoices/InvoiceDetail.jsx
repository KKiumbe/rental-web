import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Button,
  Divider,
  Chip,
  Stack,
  Snackbar,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintIcon from "@mui/icons-material/Print";
import TuneIcon from "@mui/icons-material/Tune";
import axios from "axios";
import TitleComponent from "../../components/title";
import { useAuthStore } from "../../store/authStore";
import { getTheme } from "../../store/theme";

const InvoiceDetails = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustType, setAdjustType] = useState("REDUCE");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);

  const BASEURL = import.meta.env.VITE_BASE_URL;
  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const theme = getTheme();

  // Validate UUID format
  const isValidUUID = (str) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!isValidUUID(id)) {
      setError("Invalid invoice ID format");
      setSnackbarMessage("Invalid invoice ID format");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setLoading(false);
      setTimeout(() => setSnackbarOpen(false), 4000);
      return;
    }

    setSnackbarMessage("Opening the invoice...");
    setSnackbarOpen(true);
    fetchInvoiceDetails();
  }, [id, BASEURL]);

  const fetchInvoiceDetails = useCallback(async () => {
    try {
      const response = await axios.get(`${BASEURL}/invoices/${id}`, { withCredentials: true });
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch invoice");
      }
      setInvoice(response.data.data);
    } catch (err) {
      console.error("Error fetching invoice:", err);
      const message = err.response?.data?.message || "Failed to load invoice";
      setError(message);
      setSnackbarMessage(message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      setTimeout(() => setSnackbarOpen(false), 4000);
    }
  }, [id,BASEURL]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleInvoicesPage = useCallback(() => {
    navigate("/invoices");
  }, [navigate]);

  const handleDownloadInvoice = useCallback(async () => {
    setDownloadLoading(true);
    setSnackbarMessage("Downloading invoice...");
    setSnackbarSeverity("info");
    setSnackbarOpen(true);

    try {
      const response = await axios.get(`${BASEURL}/download-invoice/${id}`, {
        withCredentials: true,
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbarMessage("Invoice downloaded successfully!");
      setSnackbarSeverity("success");
    } catch (err) {
      console.error("Error downloading invoice:", err);
      setSnackbarMessage(err.response?.data?.message || "Failed to download invoice.");
      setSnackbarSeverity("error");
    } finally {
      setDownloadLoading(false);
      setTimeout(() => setSnackbarOpen(false), 4000);
    }
  }, [id,BASEURL]);

  const handlePrintInvoice = useCallback(async () => {
    setSnackbarMessage("Preparing invoice for printing...");
    setSnackbarSeverity("info");
    setSnackbarOpen(true);
    try {
      const response = await axios.get(`${BASEURL}/download-invoice/${id}`, {
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
        // Fallback: if popup blocked, open in same tab as object
        setSnackbarMessage("Popup blocked. Please allow popups and try again.");
        setSnackbarSeverity("warning");
      }
      // Clean up the object URL after a delay to ensure print dialog loads
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error("Error printing invoice:", err);
      setSnackbarMessage(err.response?.data?.message || "Failed to prepare invoice for printing.");
      setSnackbarSeverity("error");
    } finally {
      setTimeout(() => setSnackbarOpen(false), 4000);
    }
  }, [id, BASEURL]);

  const handleCancelInvoice = useCallback(async () => {
    setCancelLoading(true);
    setSnackbarMessage("Canceling invoice...");
    setSnackbarSeverity("info");
    setSnackbarOpen(true);

    try {
      const response = await axios.patch(`${BASEURL}/invoice/cancel/${id}`, {}, { withCredentials: true });
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to cancel invoice");
      }
      setInvoice({
        ...invoice,
        status: response.data.data.invoice.status,
        closingBalance: response.data.data.customer.closingBalance,
      });
      setSnackbarMessage(response.data.message);
      setSnackbarSeverity("success");
    } catch (err) {
      console.error("Error canceling invoice:", err);
      setSnackbarMessage(err.response?.data?.message || "Failed to cancel invoice.");
      setSnackbarSeverity("error");
    } finally {
      setCancelLoading(false);
      setTimeout(() => setSnackbarOpen(false), 4000);
    }
  }, [id, invoice]);

  const handleEmailInvoice = useCallback(async () => {
    setSnackbarMessage("Emailing invoice...");
    setSnackbarSeverity("info");
    setSnackbarOpen(true);

    try {
      const response = await axios.post(`${BASEURL}/invoice/email/${id}`, {}, { withCredentials: true });
      setSnackbarMessage(response.data.message || "Invoice emailed successfully!");
      setSnackbarSeverity("success");
    } catch (err) {
      console.error("Error emailing invoice:", err);
      setSnackbarMessage(err.response?.data?.message || "Failed to email invoice.");
      setSnackbarSeverity("error");
    } finally {
      setTimeout(() => setSnackbarOpen(false), 4000);
    }
  }, [id]);

  const handleAdjustInvoice = useCallback(async () => {
    const amt = parseFloat(adjustAmount);
    if (!amt || amt <= 0) {
      setSnackbarMessage("Enter a valid positive amount.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    setAdjustLoading(true);
    try {
      const response = await axios.patch(
        `${BASEURL}/invoice/adjust/${id}`,
        { adjustmentType: adjustType, amount: amt },
        { withCredentials: true }
      );
      setInvoice((prev) => ({
        ...prev,
        invoiceAmount: response.data.data.invoice.invoiceAmount,
        outstandingBalance:
          response.data.data.invoice.invoiceAmount - prev.amountPaid,
        closingBalance: response.data.data.customer.closingBalance,
      }));
      setSnackbarMessage(response.data.message);
      setSnackbarSeverity("success");
      setAdjustOpen(false);
      setAdjustAmount("");
    } catch (err) {
      setSnackbarMessage(err.response?.data?.message || "Failed to adjust invoice.");
      setSnackbarSeverity("error");
    } finally {
      setAdjustLoading(false);
      setSnackbarOpen(true);
      setTimeout(() => setSnackbarOpen(false), 4000);
    }
  }, [id, adjustType, adjustAmount, BASEURL]);

  const renderInvoiceItems = () => {
    if (!invoice?. InvoiceItem || invoice. InvoiceItem.length === 0) {
      return <Typography sx={{ color: theme.palette.grey[100] }}>No invoice items found.</Typography>;
    }
    return (
      <TableContainer component={Paper} sx={{ bgcolor: theme.palette.primary.main }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: theme.palette.grey[100] }}>Description</TableCell>
              <TableCell sx={{ color: theme.palette.grey[100] }}>Amount</TableCell>
              <TableCell sx={{ color: theme.palette.grey[100] }}>Quantity</TableCell>
              <TableCell sx={{ color: theme.palette.grey[100] }}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoice. InvoiceItem.map((item) => (
              <TableRow key={item.id}>
                <TableCell sx={{ color: theme.palette.grey[100] }}>{item.description}</TableCell>
                <TableCell sx={{ color: theme.palette.grey[100] }}>KES {Math.round(item.amount)}</TableCell>
                <TableCell sx={{ color: theme.palette.grey[100] }}>{item.quantity}</TableCell>
                <TableCell sx={{ color: theme.palette.grey[100] }}>
                  KES {Math.round(item.amount * item.quantity)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderPayments = () => {
    if (!invoice?.payments || invoice.payments.length === 0) {
      return <Typography sx={{ color: theme.palette.grey[100] }}>No payments recorded.</Typography>;
    }
    return (
      <TableContainer component={Paper} sx={{ bgcolor: theme.palette.primary.main }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: theme.palette.grey[100] }}>Amount</TableCell>
              <TableCell sx={{ color: theme.palette.grey[100] }}>Payment Date</TableCell>
              <TableCell sx={{ color: theme.palette.grey[100] }}>Method</TableCell>
              <TableCell sx={{ color: theme.palette.grey[100] }}>Transaction ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoice.payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell sx={{ color: theme.palette.grey[100] }}>
                  KES {Math.round(payment.amount)}
                </TableCell>
                <TableCell sx={{ color: theme.palette.grey[100] }}>
                  {new Date(payment.paymentDate).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell sx={{ color: theme.palette.grey[100] }}>{payment.paymentMethod}</TableCell>
                <TableCell sx={{ color: theme.palette.grey[100] }}>
                  {payment.transactionId || "N/A"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress sx={{ color: theme.palette.greenAccent.main }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", minHeight: "100vh", bgcolor: theme.palette.background.default, p: 2 }}>
      <Card
        sx={{
          width: "100%",
          maxWidth: 600,
          padding: 3,
          mt: 4,
          bgcolor: theme.palette.primary.main,
          position: "relative",
        }}
      >
        <IconButton
          onClick={handleBack}
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            color: theme.palette.greenAccent.main,
            "&:hover": {
              bgcolor: theme.palette.greenAccent.main + "20",
            },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 40 }} />
        </IconButton>

        <CardContent sx={{ width: "100%" }}>
          <TitleComponent title="Invoice Details" />
          <Typography variant="h5" sx={{ color: theme.palette.grey[100] }}>
            Invoice #{invoice.invoiceNumber.substring(0, 9)}
          </Typography>

          <Chip
            label={invoice.status}
            color={
              invoice.status === "PAID"
                ? "success"
                : invoice.status === "CANCELED"
                ? "error"
                : "warning"
            }
            sx={{ mt: 2, mb: 2 }}
          />

          <Divider sx={{ my: 2, borderColor: theme.palette.grey[300] }} />

          <Typography variant="subtitle1" sx={{ color: theme.palette.grey[100] }}>
            <strong>Customer:</strong> {invoice.customer.fullName}
          </Typography>
          <Typography variant="subtitle2" sx={{ color: theme.palette.grey[100] }}>
            Phone: {invoice.customer.phoneNumber}
          </Typography>
          <Typography variant="subtitle2" sx={{ color: theme.palette.grey[100] }}>
            Email: {invoice.customer.email || "N/A"}
          </Typography>
          <Typography variant="subtitle2" sx={{ color: theme.palette.grey[100] }}>
            Unit: {invoice.customer.unitName || "Not Assigned"}
          </Typography>
          <Typography variant="subtitle2" sx={{ color: theme.palette.grey[100] }}>
            Building: {invoice.customer.buildingName || "N/A"}
          </Typography>

          <Divider sx={{ my: 2, borderColor: theme.palette.grey[300] }} />

          <Typography variant="body2" sx={{ color: theme.palette.grey[100] }}>
            <strong>Invoice Date:</strong>{" "}
            {new Date(invoice.createdAt).toLocaleDateString()}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.grey[100] }}>
            <strong>Invoice Period:</strong>{" "}
            {new Date(invoice.invoicePeriod).toLocaleString(undefined, {
              year: "numeric",
              month: "long",
            })}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.grey[100] }}>
            <strong>Closing Balance:</strong> KES {Math.round(invoice.closingBalance)}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.grey[100] }}>
            <strong>Amount Paid:</strong> KES {Math.round(invoice.amountPaid)}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.grey[100] }}>
            <strong>Outstanding Balance:</strong> KES {Math.round(invoice.outstandingBalance)}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.grey[100] }}>
            <strong>Total Items:</strong> {invoice.totalItems}
          </Typography>

          <Divider sx={{ my: 2, borderColor: theme.palette.grey[300] }} />

          <Typography variant="h6" sx={{ color: theme.palette.grey[100] }}>
            Invoice Items
          </Typography>
          {renderInvoiceItems()}

          <Typography variant="h6" sx={{ mt: 2, color: theme.palette.grey[100] }}>
            Total: KES {Math.round(invoice.invoiceAmount)}
          </Typography>

          <Divider sx={{ my: 2, borderColor: theme.palette.grey[300] }} />

          <Typography variant="h6" sx={{ color: theme.palette.grey[100] }}>
            Payments
          </Typography>
          {renderPayments()}

          <Divider sx={{ my: 2, borderColor: theme.palette.grey[300] }} />

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              sx={{
                bgcolor: theme.palette.greenAccent.main,
                color: "#fff",
                "&:hover": { bgcolor: theme.palette.greenAccent.main, opacity: 0.9 },
              }}
              onClick={handleDownloadInvoice}
              disabled={downloadLoading}
            >
              {downloadLoading ? "Downloading..." : "Download PDF"}
            </Button>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              sx={{
                bgcolor: theme.palette.blueAccent?.main || "#1976d2",
                color: "#fff",
                "&:hover": { opacity: 0.9 },
              }}
              onClick={handlePrintInvoice}
            >
              Print
            </Button>
            <Button
              variant="contained"
              sx={{
                bgcolor: theme.palette.secondary.main,
                color: "#fff",
                "&:hover": { bgcolor: theme.palette.secondary.main, opacity: 0.9 },
              }}
              onClick={handleEmailInvoice}
            >
              Email Invoice
            </Button>
            {invoice.status !== "CANCELED" && invoice.status !== "PAID" && (
              <Button
                variant="contained"
                startIcon={<TuneIcon />}
                sx={{
                  bgcolor: theme.palette.warning?.main || "#ed6c02",
                  color: "#fff",
                  "&:hover": { opacity: 0.9 },
                }}
                onClick={() => { setAdjustAmount(""); setAdjustOpen(true); }}
              >
                Adjust Invoice
              </Button>
            )}
            {invoice.status !== "CANCELED" && (
              <Button
                variant="contained"
                sx={{
                  bgcolor: theme.palette.error.main,
                  color: "#fff",
                  "&:hover": { bgcolor: theme.palette.error.main, opacity: 0.9 },
                }}
                onClick={handleCancelInvoice}
                disabled={cancelLoading}
              >
                {cancelLoading ? "Canceling..." : "Cancel Invoice"}
              </Button>
            )}
          </Stack>

          <Stack direction="row" spacing={2} sx={{ mt: 4, justifyContent: "center" }}>
            <Button
              variant="outlined"
              sx={{
                borderColor: theme.palette.greenAccent.main,
                color: theme.palette.greenAccent.main,
                "&:hover": {
                  borderColor: theme.palette.greenAccent.main,
                  bgcolor: theme.palette.greenAccent.main + "20",
                },
              }}
              onClick={handleInvoicesPage}
            >
              Invoices Page
            </Button>
          </Stack>

          {/* ── Adjust Invoice Dialog ───────────────────────────────── */}
          <Dialog
            open={adjustOpen}
            onClose={() => setAdjustOpen(false)}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 2, bgcolor: theme.palette.primary.main } }}
          >
            <DialogTitle sx={{ color: theme.palette.grey[100], fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
              <TuneIcon fontSize="small" /> Adjust Invoice Amount
            </DialogTitle>
            <Divider sx={{ borderColor: theme.palette.grey[700] }} />
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
              <Typography variant="body2" sx={{ color: theme.palette.grey[300] }}>
                Current invoice amount: <strong>KES {Math.round(invoice.invoiceAmount)}</strong>
              </Typography>
              <TextField
                select
                label="Adjustment Type"
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ style: { color: theme.palette.grey[300] } }}
                InputProps={{ style: { color: theme.palette.grey[100] } }}
                sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.grey[600] } }}
              >
                <MenuItem value="ADD">Add Amount (Increase Balance)</MenuItem>
                <MenuItem value="REDUCE">Reduce Amount (Decrease Balance)</MenuItem>
              </TextField>
              <TextField
                label="Amount (KES)"
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                size="small"
                fullWidth
                inputProps={{ min: 1 }}
                InputLabelProps={{ style: { color: theme.palette.grey[300] } }}
                InputProps={{
                  style: { color: theme.palette.grey[100] },
                  startAdornment: <InputAdornment position="start"><Typography sx={{ color: theme.palette.grey[400], fontSize: 13 }}>KES</Typography></InputAdornment>,
                }}
                sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.grey[600] } }}
                helperText={
                  adjustType === "REDUCE"
                    ? `Max reducible: KES ${Math.round(invoice.invoiceAmount - invoice.amountPaid)}`
                    : " "
                }
                FormHelperTextProps={{ style: { color: theme.palette.grey[400] } }}
              />
            </DialogContent>
            <Divider sx={{ borderColor: theme.palette.grey[700] }} />
            <DialogActions sx={{ px: 3, py: 1.5 }}>
              <Button onClick={() => setAdjustOpen(false)} disabled={adjustLoading} sx={{ color: theme.palette.grey[300] }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleAdjustInvoice}
                disabled={adjustLoading || !adjustAmount}
                sx={{
                  bgcolor: theme.palette.warning?.main || "#ed6c02",
                  color: "#fff",
                  fontWeight: 700,
                  "&:hover": { opacity: 0.9 },
                }}
              >
                {adjustLoading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Confirm Adjustment"}
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={4000}
            onClose={() => setSnackbarOpen(false)}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              onClose={() => setSnackbarOpen(false)}
              severity={snackbarSeverity}
              sx={{ width: "100%", bgcolor: theme.palette.grey[300], color: theme.palette.grey[100] }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InvoiceDetails;