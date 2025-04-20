import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Button,
  Grid,
  IconButton,
  CircularProgress,
  Modal,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import { Link } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import { useAuthStore } from "../store/authStore";
import { getTheme } from "../store/theme";

const CustomerDetails = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openStatusModal, setOpenStatusModal] = useState(false);
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const theme = getTheme();
  const BASEURL = import.meta.env.VITE_BASE_URL;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  // Fetch customer and deposit details
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        const [customerResponse, depositsResponse] = await Promise.all([
          axios.get(`${BASEURL}/customer-details/${id}`, { withCredentials: true }),
          axios.get(`${BASEURL}/customers/${id}/deposits`, { withCredentials: true }),
        ]);
        setCustomer(customerResponse.data);
        setDeposits(depositsResponse.data.deposits || []);
      } catch (err) {
        console.error("Error fetching customer or deposits:", err);
        setError(err.response?.data?.message || "Failed to load customer details.");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomerDetails();
  }, [id]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  // Send SMS
  const sendSMS = async () => {
    setSending(true);
    try {
      await axios.post(
        `${BASEURL}/send-sms`,
        { mobile: customer.phoneNumber, message: smsMessage },
        { withCredentials: true }
      );
      setOpenModal(false);
      setSmsMessage("");
    } catch (err) {
      console.error("Error sending SMS:", err);
      setError("Failed to send SMS.");
    } finally {
      setSending(false);
    }
  };

  // Send Bill (Invoice)
  const sendBill = async () => {
    setSending(true);
    try {
      await axios.post(
        `${BASEURL}/send-invoice`,
        { customerId: customer.id },
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Error sending bill:", err);
      setError("Failed to send invoice.");
    } finally {
      setSending(false);
    }
  };

  // Delete Customer
  const deleteCustomer = async () => {
    setSending(true);
    try {
      await axios.delete(`${BASEURL}/customers/${id}`, {
        withCredentials: true,
      });
      setOpenDeleteDialog(false);
      navigate("/customers");
    } catch (err) {
      console.error("Error deleting customer:", err);
      setError("Failed to delete customer.");
    } finally {
      setSending(false);
    }
  };

  // Update Customer Status to Active
  const updateCustomerStatus = async () => {
    setSending(true);
    try {
      await axios.post(
        `${BASEURL}/active-customer`,
        { customerId: customer.id },
        { withCredentials: true }
      );
      setCustomer((prev) => ({ ...prev, status: "ACTIVE" }));
      setOpenStatusModal(false);
    } catch (err) {
      console.error("Error updating customer status:", err);
      setError(err.response?.data?.message || "Failed to update customer status.");
    } finally {
      setSending(false);
    }
  };

  // Navigate to Terminate Lease
  const handleTerminateLease = () => {
    navigate(`/terminate-lease/${id}`);
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  // DataGrid columns for Invoices
  const invoiceColumns = [
    {
      field: "actions",
      headerName: "View",
      width: 100,
      renderCell: (params) => (
        <IconButton component={Link} to={`/get-invoice/${params.row.id}`}>
          <VisibilityIcon sx={{ color: theme.palette.greenAccent.main }} />
        </IconButton>
      ),
    },
    { field: "invoiceNumber", headerName: "Invoice #", width: 150 },
    { field: "invoiceAmount", headerName: "Amount", width: 120 },
    { field: "status", headerName: "Status", width: 120 },
    {
      field: "InvoiceItem",
      headerName: "Items",
      width: 300,
      renderCell: (params) => (
        <ul>
          {params.value.map((item) => (
            <li key={item.id}>
              {item.description} - {item.quantity} x {item.amount}
            </li>
          ))}
        </ul>
      ),
    },
    {
      field: "createdAt",
      headerName: "Date",
      width: 180,
      renderCell: (params) =>
        new Date(params.value).toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
  ];

  // DataGrid columns for Receipts
  const receiptColumns = [
    {
      field: "actions",
      headerName: "View",
      width: 100,
      renderCell: (params) => (
        <IconButton component={Link} to={`/receipts/${params.row.id}`}>
          <VisibilityIcon sx={{ color: theme.palette.greenAccent.main }} />
        </IconButton>
      ),
    },
    { field: "receiptNumber", headerName: "Receipt #", width: 150 },
    { field: "amount", headerName: "Amount", width: 120 },
    {
      field: "modeOfPayment",
      headerName: "Payment Mode",
      width: 150,
      valueGetter: (params) => params.row.payment?.modeOfPayment || "N/A",
    },
    { field: "paidBy", headerName: "Paid By", width: 150 },
    {
      field: "createdAt",
      headerName: "Date",
      width: 180,
      renderCell: (params) =>
        new Date(params.value).toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      field: "transactionCode",
      headerName: "Transaction Code",
      width: 150,
      valueGetter: (params) => params.row.transactionCode || "N/A",
    },
  ];

  // DataGrid columns for Gas Consumption
  const gasConsumptionColumns = [
    { field: "id", headerName: "ID", width: 150 },
    {
      field: "period",
      headerName: "Period",
      width: 150,
      renderCell: (params) =>
        new Date(params.value).toLocaleString(undefined, { year: "numeric", month: "short" }),
    },
    { field: "consumption", headerName: "Consumption (m³)", width: 150 },
    {
      field: "createdAt",
      headerName: "Recorded At",
      width: 180,
      renderCell: (params) =>
        new Date(params.value).toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
  ];

  // DataGrid columns for Water Consumption
  const waterConsumptionColumns = [
    { field: "id", headerName: "ID", width: 150 },
    {
      field: "period",
      headerName: "Period",
      width: 150,
      renderCell: (params) =>
        new Date(params.value).toLocaleString(undefined, { year: "numeric", month: "short" }),
    },
    { field: "consumption", headerName: "Consumption (L)", width: 150 },
    {
      field: "createdAt",
      headerName: "Recorded At",
      width: 180,
      renderCell: (params) =>
        new Date(params.value).toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
  ];

  return (
    <Container sx={{ py: 4, transition: "margin 0.3s ease-in-out" }}>
      <Typography variant="h4" gutterBottom>
        Customer Details
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
          <CircularProgress color="primary" size={50} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : (
        customer && (
          <>
            <Box sx={{ p: 3, bgcolor: "background.paper", borderRadius: 2, boxShadow: 1 }}>
              <Stack direction="row" alignItems="center" mb={2}>
                <IconButton onClick={handleBack} sx={{ color: theme.palette.greenAccent.main, mr: 2 }}>
                  <ArrowBackIcon sx={{ fontSize: 30 }} />
                </IconButton>
                <Typography variant="h5">{customer.fullName}</Typography>
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Email:</strong> {customer.email || "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Phone:</strong> {customer.phoneNumber}
                  </Typography>
                  <Typography>
                    <strong>Secondary Phone:</strong> {customer.secondaryPhoneNumber || "N/A"}
                  </Typography>
                  <Typography>
                    <strong>National ID:</strong> {customer.nationalId || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Unit:</strong> {customer.unitName || "Not Assigned"}
                  </Typography>
                  <Typography>
                    <strong>Building:</strong> {customer.buildingName || "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Lease Status:</strong> {customer.leaseStatus || "No Lease"}
                  </Typography>
                  <Typography>
                    <strong>Closing Balance:</strong> {customer.closingBalance}
                  </Typography>
                  <Typography>
                    <strong>Status:</strong> {customer.status}
                    {customer.status === "PENDING" && (
                      <IconButton
                        onClick={() => setOpenStatusModal(true)}
                        sx={{ ml: 1, color: theme.palette.greenAccent.main }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Typography>
                </Grid>
              </Grid>

              <Stack direction="row" spacing={2} mt={3}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setOpenModal(true)}
                  disabled={sending}
                >
                  {sending ? "Sending..." : `SMS ${customer.firstName}`}
                </Button>
                <Button variant="contained" color="secondary" onClick={sendBill} disabled={sending}>
                  {sending ? "Sending..." : `Send Invoice to ${customer.firstName}`}
                </Button>
                <Button
                  variant="contained"
                 
                  onClick={() => navigate(`/terminate-lease/${id}`)}
                 
                 
                >
                  {sending ? "Processing..." : "Terminate Lease"}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => setOpenDeleteDialog(true)}
                  disabled={sending}
                >
                  {sending ? "Deleting..." : "Delete Customer"}
                </Button>
              </Stack>
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Are you sure you want to delete {customer.fullName}? This action cannot be undone.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
                  Cancel
                </Button>
                <Button
                  onClick={deleteCustomer}
                  color="error"
                  variant="contained"
                  disabled={sending}
                >
                  {sending ? "Deleting..." : "Delete"}
                </Button>
              </DialogActions>
            </Dialog>

            {/* SMS Modal */}
            <Modal open={openModal} onClose={() => setOpenModal(false)}>
              <Box
                sx={{
                  p: 4,
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  width: 400,
                  mx: "auto",
                  mt: "10%",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Send SMS
                </Typography>
                <TextField
                  fullWidth
                  label="Message"
                  multiline
                  rows={4}
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={sendSMS}
                    disabled={sending}
                  >
                    {sending ? "Sending..." : "Send"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setOpenModal(false)}
                    disabled={sending}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Box>
            </Modal>

            {/* Status Update Confirmation Dialog */}
            <Dialog open={openStatusModal} onClose={() => setOpenStatusModal(false)}>
              <DialogTitle>Confirm Customer Activation</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Are you sure you want to activate customer {customer.fullName}? Make sure invoices for rent and deposits are paid.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenStatusModal(false)} color="primary" disabled={sending}>
                  Cancel
                </Button>
                <Button
                  onClick={updateCustomerStatus}
                  color="primary"
                  variant="contained"
                  disabled={sending}
                >
                  {sending ? "Activating..." : "Activate"}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Tabs */}
            <Tabs
              value={tabIndex}
              onChange={handleTabChange}
              sx={{ mt: 2, "& .MuiTab-root": { color: theme.palette.greenAccent.main } }}
            >
              <Tab label="Invoices" />
              <Tab label="Receipts" />
              <Tab label="Gas Consumption" />
              <Tab label="Water Consumption" />
            </Tabs>

            {/* Invoices Tab */}
            <Box hidden={tabIndex !== 0} sx={{ mt: 2, ml: 2 }}>
              <Typography variant="h6" mb={2}>
                Invoices
              </Typography>
              <DataGrid
                rows={customer.invoices || []}
                columns={invoiceColumns}
                pageSize={5}
                getRowId={(row) => row.id}
                autoHeight
              />
            </Box>

            {/* Receipts Tab */}
            <Box hidden={tabIndex !== 1} sx={{ mt: 2, ml: 2 }}>
              <Typography variant="h6" mb={2}>
                Receipts
              </Typography>
              <DataGrid
                rows={customer.receipts || []}
                columns={receiptColumns}
                pageSize={5}
                getRowId={(row) => row.id}
                autoHeight
              />
            </Box>

            {/* Gas Consumption Tab */}
            <Box hidden={tabIndex !== 2} sx={{ mt: 2, ml: 2 }}>
              <Typography variant="h6" mb={2}>
                Gas Consumption
              </Typography>
              <DataGrid
                rows={customer.gasConsumptions || []}
                columns={gasConsumptionColumns}
                pageSize={5}
                getRowId={(row) => row.id}
                autoHeight
              />
            </Box>

            {/* Water Consumption Tab */}
            <Box hidden={tabIndex !== 3} sx={{ mt: 2, ml: 2 }}>
              <Typography variant="h6" mb={2}>
                Water Consumption
              </Typography>
              <DataGrid
                rows={customer.waterConsumptions || []}
                columns={waterConsumptionColumns}
                pageSize={5}
                getRowId={(row) => row.id}
                autoHeight
             />
            </Box>
          </>
        )
      )}
    </Container>
  );
};

export default CustomerDetails;