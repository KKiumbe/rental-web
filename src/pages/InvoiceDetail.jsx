import React, { useEffect, useState, useCallback } from "react";
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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import axios from "axios";
import TitleComponent from "../components/title";
import { useAuthStore } from "../store/authStore";
import { getTheme } from "../store/theme";

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

  const BASEURL = import.meta.env.VITE_BASE_URL || "http://localhost:5000/api";
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
  }, [id]);

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
  }, [id]);

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
  }, [id]);

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

  const renderInvoiceItems = () => {
    if (!invoice?.items || invoice.items.length === 0) {
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
            {invoice.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell sx={{ color: theme.palette.grey[100] }}>{item.description}</TableCell>
                <TableCell sx={{ color: theme.palette.grey[100] }}>KES {item.amount.toFixed(2)}</TableCell>
                <TableCell sx={{ color: theme.palette.grey[100] }}>{item.quantity}</TableCell>
                <TableCell sx={{ color: theme.palette.grey[100] }}>
                  KES {(item.amount * item.quantity).toFixed(2)}
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
                  KES {payment.amount.toFixed(2)}
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
            <strong>Closing Balance:</strong> KES {invoice.closingBalance.toFixed(2)}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.grey[100] }}>
            <strong>Amount Paid:</strong> KES {invoice.amountPaid.toFixed(2)}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.grey[100] }}>
            <strong>Outstanding Balance:</strong> KES {invoice.outstandingBalance.toFixed(2)}
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
            Total: KES {invoice.invoiceAmount.toFixed(2)}
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
              sx={{
                bgcolor: theme.palette.secondary.main,
                color: "#fff",
                "&:hover": { bgcolor: theme.palette.secondary.main, opacity: 0.9 },
              }}
              onClick={handleEmailInvoice}
            >
              Email Invoice
            </Button>
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