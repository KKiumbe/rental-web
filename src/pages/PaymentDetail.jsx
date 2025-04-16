import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Fade,
  IconButton,
  Modal,
  TextField,
  Autocomplete,
  Snackbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAuthStore } from "../store/authStore";
import TitleComponent from "../components/title";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PaymentIcon from "@mui/icons-material/Payment";
import InvoiceIcon from "@mui/icons-material/Description";
import EditIcon from "@mui/icons-material/Edit";
import { getTheme } from "../store/theme";
import axios from "axios";

const PaymentDetails = () => {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [receiptingError, setReceiptingError] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const theme = getTheme();
  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const response = await fetch(`${BASEURL}/payments/${id}`, {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            navigate("/login");
            return;
          }
          if (response.status === 404) {
            throw new Error("Payment not found");
          }
          throw new Error(`Failed to fetch payment details: ${response.statusText}`);
        }

        const data = await response.json();
        setPayment(data);
      } catch (err) {
        setError(err.message || "Failed to fetch payment details.");
        console.error("Error fetching payment details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [id, BASEURL, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEditOpen = () => {
    setModalOpen(true);
    setModalStep(1);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedCustomer(null);
    setReceiptingError(null);
    setSnackbarOpen(false);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalStep(1);
    setReceiptingError(null);
    setSnackbarOpen(false);
  };

  const handleSearchChange = (event, value) => {
    setSearchQuery(value);
    const isPhoneNumber = /^\d+$/.test(value);
    if (!isPhoneNumber && value.length >= 2) {
      handleSearchAutocomplete();
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchAutocomplete = async () => {
    setIsSearching(true);
    try {
      const response = await axios.get(`${BASEURL}/search-customer-by-name`, {
        params: { name: searchQuery },
        withCredentials: true,
      });
      setSearchResults(response.data.customers || response.data);
    } catch (error) {
      console.error("Error in name autocomplete:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchButtonClick = async () => {
    setIsSearching(true);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSnackbarMessage("Please enter a search query.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      setIsSearching(false);
      return;
    }

    try {
      const isPhoneNumber = /^\d+$/.test(searchQuery);
      const endpoint = isPhoneNumber
        ? `${BASEURL}/search-customer-by-phone`
        : `${BASEURL}/search-customer-by-name`;
      const params = isPhoneNumber ? { phone: searchQuery } : { name: searchQuery };

      const response = await axios.get(endpoint, {
        params,
        withCredentials: true,
      });

      if (isPhoneNumber) {
        const customer = response.data;
        if (customer) {
          setSelectedCustomer(customer);
          setModalStep(2);
          setSearchResults([customer]);
        } else {
          setSnackbarMessage("No customer found with this phone number.");
          setSnackbarSeverity("warning");
          setSnackbarOpen(true);
          setSearchResults([]);
        }
      } else {
        const results = response.data.customers || response.data;
        if (results.length > 0) {
          setSearchResults(results);
        } else {
          setSnackbarMessage("No customers found with this name.");
          setSnackbarSeverity("warning");
          setSnackbarOpen(true);
          setSearchResults([]);
        }
      }
    } catch (error) {
      console.error("Error searching customers:", error);
      setSnackbarMessage(error.response?.data?.message || "Error searching customers.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCustomerSelect = (event, value) => {
    setSelectedCustomer(value);
    if (value) {
      setModalStep(2);
    }
  };

  const handleManualReceipt = async () => {
    if (!selectedCustomer) {
      setReceiptingError("No customer selected.");
      setSnackbarMessage("No customer selected.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    const receiptPayload = {
      paymentId: id,
      customerId: selectedCustomer.id,
      totalAmount: payment.amount,
      modeOfPayment: payment.modeOfPayment,
      paidBy: selectedCustomer.firstName,
    };

    setReceiptLoading(true);
    try {
      const response = await axios.post(`${BASEURL}/manual-receipt`, receiptPayload, {
        withCredentials: true,
      });
      const receiptId = response.data.receipts[0]?.id;
      if (!receiptId) {
        setReceiptingError("No receipt ID returned.");
        setSnackbarMessage("No receipt ID returned.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }
      setPayment((prev) => ({ ...prev, receipted: true, receipt: response.data.receipts[0] }));
      setModalOpen(false);
      setSnackbarMessage("Payment receipted successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      navigate(`/receipts/${receiptId}`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to receipt payment.";
      if (error.response?.status === 400 && errorMessage === "Payment with this ID has already been receipted.") {
        setSnackbarMessage("This payment has already been receipted.");
        setSnackbarSeverity("info");
        setSnackbarOpen(true);
        setModalOpen(false); // Close modal since no action can be taken
      } else {
        setReceiptingError(errorMessage);
        setSnackbarMessage(errorMessage);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
      console.error("Error receipting payment:", error);
    } finally {
      setReceiptLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress size={60} thickness={4} sx={{ color: theme.palette.greenAccent.main }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
        <TitleComponent title="Payment Details" />
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2, bgcolor: theme.palette.grey[300] }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!payment) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
        <TitleComponent title="Payment Details" />
        <Typography variant="h6" color={theme.palette.grey[100]} align="center">
          No payment data available.
        </Typography>
      </Box>
    );
  }

  const { receipt } = payment;
  const receiptInvoices = receipt?.receiptInvoices || [];

  return (
    <Fade in={!loading}>
      <Box
        sx={{
          width: "100%",
          mx: "auto",
          p: 3,
          mt: 2,
        ml:20,
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

        <TitleComponent title="Payment Details" />
        <Card
          sx={{
            mb: 3,
            borderRadius: 2,
            boxShadow: 3,
         
            color: theme.palette.grey[100],
            width: "50%",
            ml: 20,
          
          }}
        >
          <CardHeader
            avatar={<PaymentIcon sx={{ color: theme.palette.greenAccent.main }} />}
            title="Payment Information"
            titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
            action={
              !payment.receipted && (
                <IconButton onClick={handleEditOpen} sx={{ color: theme.palette.greenAccent.main }}>
                  <EditIcon />
                </IconButton>
              )
            }
          
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Payment ID
                </Typography>
                <Typography variant="body1">{payment.id}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Amount
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.greenAccent.main, fontWeight: "bold" }}>
                  {payment.amount} KES
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Mode of Payment
                </Typography>
                <Typography variant="body1">{payment.modeOfPayment}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Customer Name
                </Typography>
                <Typography variant="body1">{payment.firstName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Status
                </Typography>
                <Chip
                  label={payment.receipted ? "Receipted" : "Not Receipted"}
                  sx={{
                    bgcolor: payment.receipted ? theme.palette.greenAccent.main : theme.palette.grey[300],
                    color: payment.receipted ? "#fff" : theme.palette.grey[100],
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Transaction ID
                </Typography>
                <Typography variant="body1">{payment.transactionId}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Reference
                </Typography>
                <Typography variant="body1">{payment.ref || "N/A"}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Created At
                </Typography>
              
                <Typography variant="body1">
  {new Date(new Date(payment.createdAt).setHours(new Date(payment.createdAt).getHours() - 1)).toLocaleString()}
</Typography>

              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {receipt ? (
          <Card
            sx={{
              mb: 3,
              borderRadius: 2,
              boxShadow: 3,
              bgcolor: theme.palette.primary.main,
              color: theme.palette.grey[100],
            }}
          >
            <CardHeader
              avatar={<ReceiptIcon sx={{ color: theme.palette.greenAccent.main }} />}
              title="Receipt Information"
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
              sx={{ bgcolor: theme.palette.grey[300] }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                    Receipt ID
                  </Typography>
                  <Typography variant="body1">{receipt.id}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                    Receipt Number
                  </Typography>
                  <Typography variant="body1">{receipt.receiptNumber}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                    Amount
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.greenAccent.main, fontWeight: "bold" }}>
                    {receipt.amount} KES
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                    Paid By
                  </Typography>
                  <Typography variant="body1">{receipt.paidBy}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                    Transaction Code
                  </Typography>
                  <Typography variant="body1">{receipt.transactionCode || "N/A"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                    Phone Number
                  </Typography>
                  <Typography variant="body1">{receipt.phoneNumber || "N/A"}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                    Created At
                  </Typography>
                  <Typography variant="body1">{new Date(receipt.createdAt).toLocaleString()}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ) : (
          <Typography variant="body1" color={theme.palette.grey[100]} align="center" sx={{ mt: 2 }}>
            No receipt information available.
          </Typography>
        )}

        {receiptInvoices.length > 0 && (
          <Card
            sx={{
              borderRadius: 2,
              boxShadow: 3,
              bgcolor: theme.palette.primary.main,
              color: theme.palette.grey[100],
            }}
          >
            <CardHeader
              avatar={<InvoiceIcon sx={{ color: theme.palette.greenAccent.main }} />}
              title="Associated Invoices"
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
              sx={{ bgcolor: theme.palette.grey[300] }}
            />
            <CardContent>
              {receiptInvoices.map((ri) => (
                <Box
                  key={ri.id}
                  sx={{
                    mb: 3,
                    border: 1,
                    borderColor: theme.palette.grey[300],
                    borderRadius: 1,
                    p: 2,
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                        Invoice ID
                      </Typography>
                      <Typography variant="body1">{ri.invoiceId}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                        Invoice Number
                      </Typography>
                      <Typography variant="body1">{ri.invoice.invoiceNumber}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                        Invoice Amount
                      </Typography>
                      <Typography variant="body1">{ri.invoice.invoiceAmount} KES</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                        Amount Paid
                      </Typography>
                      <Typography variant="body1">{ri.invoice.amountPaid} KES</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                        Closing Balance
                      </Typography>
                      <Typography variant="body1">{ri.invoice.closingBalance} KES</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                        Status
                      </Typography>
                      <Chip
                        label={ri.invoice.status}
                        sx={{
                          bgcolor:
                            ri.invoice.status === "PAID"
                              ? theme.palette.greenAccent.main
                              : ri.invoice.status === "PPAID"
                              ? "#ff9800"
                              : "#f44336",
                          color: "#fff",
                        }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                        Invoice Period
                      </Typography>
                      <Typography variant="body1">
                        {new Date(ri.invoice.invoicePeriod).toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        })}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                        Created At
                      </Typography>
                      <Typography variant="body1">{new Date(ri.invoice.createdAt).toLocaleString()}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Two-Step Modal */}
        <Modal
          open={modalOpen}
          onClose={handleModalClose}
          aria-labelledby="edit-payment-modal"
          sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Box
            sx={{
              bgcolor: theme.palette.background.paper,
              borderRadius: 2,
              p: 3,
              width: 400,
              boxShadow: 24,
            }}
          >
            {modalStep === 1 ? (
              <>
                <Typography variant="h6" sx={{ mb: 2, color: theme.palette.grey[900] }}>
                  Select Customer to Receipt
                </Typography>
                <Autocomplete
                  freeSolo
                  options={searchResults}
                  getOptionLabel={(option) =>
                    `${option.firstName} ${option.lastName || ""} (${option.phoneNumber || "N/A"})`
                  }
                  inputValue={searchQuery}
                  onInputChange={handleSearchChange}
                  onChange={handleCustomerSelect}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search by Name or Phone"
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                  )}
                />
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSearchButtonClick}
                    disabled={isSearching}
                    sx={{ bgcolor: theme.palette.blueAccent?.main || "#1976d2", color: theme.palette.grey[100] }}
                  >
                    {isSearching ? <CircularProgress size={24} /> : "Search"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleModalClose}
                    sx={{ borderColor: theme.palette.grey[300], color: theme.palette.grey[900] }}
                  >
                    Cancel
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Typography variant="h6" sx={{ mb: 2, color: theme.palette.grey[900] }}>
                  Confirm Receipt
                </Typography>
                <TextField
                  label="Amount (KES)"
                  value={payment.amount || ""}
                  disabled
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Mode of Payment"
                  value={payment.modeOfPayment || ""}
                  disabled
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Customer Name"
                  value={selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName || ""}` : ""}
                  disabled
                  fullWidth
                  sx={{ mb: 2 }}
                />
                {receiptingError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {receiptingError}
                  </Alert>
                )}
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleManualReceipt}
                    disabled={receiptLoading}
                    sx={{ bgcolor: theme.palette.greenAccent.main, color: theme.palette.grey[100] }}
                  >
                    {receiptLoading ? <CircularProgress size={24} /> : "Confirm Receipt"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setModalStep(1)}
                    sx={{ borderColor: theme.palette.grey[300], color: theme.palette.grey[900] }}
                  >
                    Back
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Modal>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

        <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 3 }}>
          <Button
            variant="outlined"
            sx={{
              borderColor: theme.palette.greenAccent.main,
              color: theme.palette.greenAccent.main,
              borderRadius: 20,
              px: 4,
              "&:hover": {
                borderColor: theme.palette.greenAccent.main,
                bgcolor: theme.palette.greenAccent.main,
                color: "#fff",
              },
            }}
            onClick={() => navigate("/payments")}
          >
            Back to Payments
          </Button>
        </Box>
      </Box>
    </Fade>
  );
};

export default PaymentDetails;