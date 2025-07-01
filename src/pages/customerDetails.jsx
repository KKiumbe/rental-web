import { useEffect, useState } from "react";
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
  FormControl,
  InputLabel,
  LinearProgress,
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
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const theme = getTheme();
  const BASEURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api";
  const [customer, setCustomer] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [waterReadings, setWaterReadings] = useState([]);
  const [waterReadingsLoading, setWaterReadingsLoading] = useState(false);
  const [waterReadingsError, setWaterReadingsError] = useState(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 5 });
  const [rowCount, setRowCount] = useState(0);
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openStatusModal, setOpenStatusModal] = useState(false);
  const [openLeaseModal, setOpenLeaseModal] = useState(false);
  const [openTerminateDialog, setOpenTerminateDialog] = useState(false);
  const [leaseFile, setLeaseFile] = useState(null);

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
  }, [id, BASEURL]);

  // Fetch water readings using /water-readings/customer
  const fetchWaterReadings = async (page, pageSize) => {
    setWaterReadingsLoading(true);
    setWaterReadingsError(null);
    try {
      const response = await axios.get(`${BASEURL}/water-readings/customer`, {
        params: { customerId: id, page: page + 1, limit: pageSize },
        withCredentials: true,
      });
      setWaterReadings(response.data.data || []);
      setRowCount(response.data.totalCount || 0);
    } catch (err) {
      console.error("Error fetching water readings:", err);
      setWaterReadingsError(err.response?.data?.message || "Failed to load water readings.");
      setWaterReadings([]);
      setRowCount(0);
    } finally {
      setWaterReadingsLoading(false);
    }
  };

  // Fetch water readings when tab is selected or pagination changes
  useEffect(() => {
    if (tabIndex === 3 && customer) {
      fetchWaterReadings(paginationModel.page, paginationModel.pageSize);
    }
  }, [tabIndex, paginationModel, customer, id]);

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
      setSuccess("SMS sent successfully");
      setOpenModal(false);
      setSmsMessage("");
    } catch (err) {
      console.error("Error sending SMS:", err);
      setError(err.response?.data?.message || "Failed to send SMS.");
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
      setSuccess("Invoice sent successfully");
    } catch (err) {
      console.error("Error sending bill:", err);
      setError(err.response?.data?.message || "Failed to send invoice.");
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
      setSuccess("Customer deleted successfully");
      setOpenDeleteDialog(false);
      navigate("/customers");
    } catch (err) {
      console.error("Error deleting customer:", err);
      setError(err.response?.data?.message || "Failed to delete customer.");
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
      setSuccess("Customer status updated to ACTIVE");
      setOpenStatusModal(false);
    } catch (err) {
      console.error("Error updating customer status:", err);
      setError(err.response?.data?.message || "Failed to update customer status.");
    } finally {
      setSending(false);
    }
  };

  // Handle Lease File Upload
  const handleLeaseUpload = async () => {
    if (!leaseFile) {
      setError("Please select a PDF file to upload.");
      return;
    }
    if (leaseFile.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }
    if (leaseFile.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB.");
      return;
    }
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("leaseFile", leaseFile);
      formData.append("customerId", customer.id);

      await axios.post(`${BASEURL}/upload-lease`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCustomer((prev) => ({
        ...prev,
        leaseFileUrl: `Uploads/leases/${leaseFile.name}`,
      }));
      setSuccess("Lease uploaded successfully");
      setLeaseFile(null);
      setOpenLeaseModal(false);
    } catch (err) {
      console.error("Error uploading lease:", err);
      setError(err.response?.data?.message || "Failed to upload lease agreement.");
    } finally {
      setSending(false);
    }
  };

  // Handle Lease File Download
  const handleLeaseDownload = async () => {
    setSending(true);
    try {
      const response = await axios.get(`${BASEURL}/download-lease/${id}`, {
        withCredentials: true,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `lease_${customer.firstName}_${customer.lastName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess("Lease downloaded successfully");
    } catch (err) {
      console.error("Error downloading lease:", err);
      setError(err.response?.data?.message || "Failed to download lease agreement.");
    } finally {
      setSending(false);
    }
  };

  // Handle Terminate Lease
  const handleTerminateLease = () => {
    setOpenTerminateDialog(true);
  };

  const confirmTerminateLease = async () => {
    setSending(true);
    try {
      await axios.post(`${BASEURL}/terminate-lease/${id}`, {}, { withCredentials: true });
      setCustomer((prev) => ({
        ...prev,
        leaseFileUrl: "",
      }));
      setSuccess("Lease terminated successfully");
      setOpenLeaseModal(false);
      setOpenTerminateDialog(false);
    } catch (err) {
      console.error("Error terminating lease:", err);
      setError(err.response?.data?.message || "Failed to terminate lease.");
    } finally {
      setSending(false);
    }
  };

  // Navigate to Edit Customer
  const handleEditCustomer = () => {
    navigate(`/customer-edit/${id}`);
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
    {
      field: "actions",
      headerName: "View",
      width: 100,
      renderCell: (params) => (
        <IconButton component={Link} to={`/water-reading/${params.row.id}`}>
          <VisibilityIcon sx={{ color: theme.palette.greenAccent.main }} />
        </IconButton>
      ),
    },
    { field: "id", headerName: "ID", width: 150 },
    {
      field: "period",
      headerName: "Period",
      width: 150,
      renderCell: (params) =>
        new Date(params.value).toLocaleString(undefined, { year: "numeric", month: "short" }),
    },
    { field: "reading", headerName: "Reading (m³)", width: 150 },
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
    {
      field: "abnormalReading",
      headerName: "Abnormal",
      width: 120,
      renderCell: (params) => (params.row.AbnormalWaterReading?.length > 0 ? "Yes" : "No"),
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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : success ? (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      ) : null}

      {customer && (
        <>
          <Box sx={{ p: 3, bgcolor: theme.palette.background.paper, borderRadius: 2, boxShadow: 1 }}>
            <Stack direction="row" alignItems="center" mb={2}>
              <IconButton onClick={handleBack} sx={{ color: theme.palette.greenAccent.main, mr: 2 }}>
                <ArrowBackIcon sx={{ fontSize: 30 }} />
              </IconButton>
              <Typography variant="h5">
                {customer.firstName} {customer.lastName}
              </Typography>
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
                  <strong>Lease:</strong> {customer.leaseFileUrl ? "Active" : "No Lease"}
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
                sx={{ backgroundColor: theme.palette.greenAccent.main }}
                onClick={() => setOpenModal(true)}
                disabled={sending}
              >
                {sending ? "Sending..." : `SMS ${customer.firstName}`}
              </Button>
              <Button
                variant="contained"
                sx={{ backgroundColor: theme.palette.greenAccent.main }}
                onClick={sendBill}
                disabled={sending}
              >
                {sending ? "Sending..." : `Send Invoice to ${customer.firstName}`}
              </Button>
              <Button
                variant="contained"
                onClick={handleEditCustomer}
                disabled={sending}
                startIcon={<EditIcon />}
                sx={{ backgroundColor: theme.palette.greenAccent.main }}
              >
                {sending ? "Processing..." : "Edit Customer"}
              </Button>
              <Button
                variant="contained"
                onClick={() => setOpenLeaseModal(true)}
                disabled={sending}
                sx={{ backgroundColor: theme.palette.greenAccent.main }}
              >
                {sending ? "Processing..." : "Manage Lease"}
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
                Are you sure you want to delete {customer.firstName} {customer.lastName}? This action
                cannot be undone.
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

          {/* Lease Management Modal */}
          <Modal open={openLeaseModal} onClose={() => setOpenLeaseModal(false)}>
            <Box
              sx={{
                p: 4,
                bgcolor: theme.palette.background.paper,
                borderRadius: 2,
                width: 400,
                mx: "auto",
                mt: "10%",
              }}
            >
              <Typography variant="h6" gutterBottom>
                Manage Lease
              </Typography>
              {error && openLeaseModal && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              {success && openLeaseModal && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                  {success}
                </Alert>
              )}
              {sending && <LinearProgress sx={{ mb: 2 }} />}
              {!customer.leaseFileUrl ? (
                <>
                  <Typography variant="body1" mb={2}>
                    No lease agreement found. Upload a new lease agreement (PDF only, max 5MB).
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel shrink htmlFor="lease-upload">
                      Upload Lease Agreement
                    </InputLabel>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setLeaseFile(e.target.files[0])}
                      id="lease-upload"
                      style={{ marginTop: "16px" }}
                    />
                  </FormControl>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleLeaseUpload}
                      disabled={sending || !leaseFile}
                    >
                      {sending ? "Uploading..." : "Upload Lease"}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setOpenLeaseModal(false)}
                      disabled={sending}
                      color={theme.palette.secondary.contrastText}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </>
              ) : (
                <>
                  <Typography variant="body1" mb={2}>
                    Lease agreement exists. You can download it here.
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      sx={{ backgroundColor: theme.palette.greenAccent.main }}
                      onClick={handleLeaseDownload}
                      disabled={sending}
                    >
                      {sending ? "Downloading..." : "Download Lease"}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleTerminateLease}
                      disabled={sending}
                    >
                      {sending ? "Processing..." : "Terminate Lease"}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setOpenLeaseModal(false)}
                      disabled={sending}
                      color={theme.palette.secondary.contrastText}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </>
              )}
            </Box>
          </Modal>

          {/* Terminate Lease Confirmation Dialog */}
          <Dialog open={openTerminateDialog} onClose={() => setOpenTerminateDialog(false)}>
            <DialogTitle>Confirm Lease Termination</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to terminate the lease for {customer.firstName}{" "}
                {customer.lastName}?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenTerminateDialog(false)} disabled={sending}>
                Cancel
              </Button>
              <Button
                onClick={confirmTerminateLease}
                color="error"
                disabled={sending}
              >
                {sending ? "Terminating..." : "Terminate"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Status Update Confirmation Dialog */}
          <Dialog open={openStatusModal} onClose={() => setOpenStatusModal(false)}>
            <DialogTitle>Confirm Customer Activation</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to activate customer {customer.firstName} {customer.lastName}?
                Make sure invoices for rent and deposits are paid.
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
            {waterReadingsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                <CircularProgress size={24} sx={{ color: theme.palette.greenAccent.main }} />
              </Box>
            ) : waterReadingsError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {waterReadingsError}
              </Alert>
            ) : waterReadings.length === 0 ? (
              <Typography sx={{ color: theme.palette.grey[100], textAlign: "center", mt: 2 }}>
                No water readings found.
              </Typography>
            ) : (
              <DataGrid
                rows={waterReadings}
                columns={waterConsumptionColumns}
                getRowId={(row) => row.id}
                paginationMode="server"
                rowCount={rowCount}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[5, 10, 20]}
                autoHeight
              />
            )}
          </Box>
        </>
      )}
    </Container>
  );
};

export default CustomerDetails;