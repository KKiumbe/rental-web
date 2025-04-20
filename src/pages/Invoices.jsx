import { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Grid,
  Box,
  Button,
  IconButton,
  TextField,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../store/authStore";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TitleComponent from "../components/title";
import { getTheme } from "../store/theme";

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0, // 0-based index (Page 1)
    pageSize: 10,
  });
  const [pageInput, setPageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
  }, [currentUser, navigate, paginationModel, searchQuery]);

  // Sanitized rows for DataGrid
  const sanitizedRows = invoices.map((invoice) => ({
    id: invoice.id || Math.random().toString(),
    invoiceNumber: invoice.invoiceNumber,
    invoiceAmount: invoice.invoiceAmount,
    amountPaid: invoice.amountPaid || 0, // New field
    closingBalance: invoice.closingBalance,
    invoicePeriod: invoice.invoicePeriod,
    status: invoice.status,
    isSystemGenerated: invoice.isSystemGenerated,
    createdBy: invoice.createdBy || "N/A", // New field
    customerId: invoice.customer?.id || "N/A",
    firstName: invoice.customer?.firstName?.trim() || "Unknown",
    lastName: invoice.customer?.lastName?.trim() || "Unknown",
    phoneNumber: invoice.customer?.phoneNumber?.trim() || "N/A",
    unitNumber: invoice.unit?.unitNumber || "N/A", // New relation
    itemDescriptions: invoice.items?.length
      ? invoice.items.map((item) => `${item.description} (Qty: ${item.quantity}, Amount: ${item.amount})`).join(", ")
      : "N/A",
    paymentSummary: invoice.payments?.length
      ? invoice.payments.map((p) => `${p.amount} (${p.modeOfPayment})`).join(", ")
      : "No Payments", // New relation
    createdAt: invoice.createdAt,
  }));

  const columns = [
    {
      field: "actions",
      headerName: "View",
      width: 100,
      renderCell: (params) => (
        <IconButton
          component={Link}
          to={`/get-invoice/${params.row.id}`}
          sx={{ color: theme.palette.greenAccent.main }}
        >
          <VisibilityIcon />
        </IconButton>
      ),
    },
    { field: "invoiceNumber", headerName: "Invoice #", width: 150 },
    { field: "firstName", headerName: "First Name", width: 150 },
    { field: "lastName", headerName: "Last Name", width: 150 },
    { field: "phoneNumber", headerName: "Phone Number", width: 180 },
    { field: "invoiceAmount", headerName: "Invoice Amount", width: 150 },
    { field: "amountPaid", headerName: "Amount Paid", width: 150 }, // New column
    { field: "closingBalance", headerName: "Closing Balance", width: 150 },
    { field: "unitNumber", headerName: "Unit", width: 120 }, // New column
    { field: "createdBy", headerName: "Created By", width: 150 }, // New column
    {
      field: "createdAt",
      headerName: "Date",
      width: 200,
      renderCell: (params) => {
        if (!params?.value) return "N/A";
        try {
          const date = new Date(params.value);
          date.setHours(date.getHours() - 1); // Subtract 1 hour to correct time
          const day = String(date.getDate()).padStart(2, "0");
          const month = date.toLocaleString("default", { month: "short" });
          const year = date.getFullYear();
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          const seconds = String(date.getSeconds()).padStart(2, "0");
          return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
        } catch (error) {
          console.error("Invalid Date:", params.value);
          return "Invalid Date";
        }
      },
    },
    {
      field: "invoicePeriod",
      headerName: "Period",
      width: 150,
      renderCell: (params) =>
        params.value
          ? new Date(params.value).toLocaleString("default", { year: "numeric", month: "short" })
          : "N/A",
    },
    { field: "status", headerName: "Status", width: 120 },
    { field: "isSystemGenerated", headerName: "System Generated", width: 180, renderCell: (params) => (params.value ? "Yes" : "No") },
    { field: "itemDescriptions", headerName: "Items", width: 300 },
    { field: "paymentSummary", headerName: "Payments", width: 250 }, // New column
  ];

  const handleRowClick = (params) => {
    setSelectedCustomer(params.row);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedCustomer(null);
  };

  const handleBack = () => {
    navigate(-1);
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

  return (
    <Box sx={{ p: 3, bgcolor: theme.palette.primary.main, height: "100vh" }}>
      <IconButton
        onClick={handleBack}
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          color: theme.palette.greenAccent.main,
          "&:hover": { bgcolor: theme.palette.greenAccent.main + "20" },
        }}
      >
        <ArrowBackIcon sx={{ fontSize: 40 }} />
      </IconButton>

      <Grid item xs={showDetails ? 6 : 12}>
        <Paper
          sx={{
            width: "100%",
            height: "100%",
            padding: 2,
            bgcolor: theme.palette.primary.main,
            overflow: "hidden",
          }}
        >
          <Typography component="div" sx={{ padding: 3, ml: 5 }}>
            <TitleComponent title="Invoices" />
          </Typography>

          <Box sx={{ display: "flex", gap: 2, marginBottom: 2, ml: 10 }}>
            <TextField
              label="Search by Name or Phone Number"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
              sx={{
                width: "400px",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: theme.palette.grey[300] },
                  "&:hover fieldset": { borderColor: theme.palette.greenAccent.main },
                  "&.Mui-focused fieldset": { borderColor: theme.palette.greenAccent.main },
                },
                "& .MuiInputLabel-root": { color: theme.palette.grey[100] },
                "& .MuiInputBase-input": { color: theme.palette.grey[100] },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              sx={{
                bgcolor: theme.palette.greenAccent.main,
                color: "#fff",
                "&:hover": { bgcolor: theme.palette.greenAccent.main, opacity: 0.9 },
              }}
            >
              Search
            </Button>
            <TextField
              label="Go to Page"
              variant="outlined"
              size="small"
              value={pageInput}
              onChange={handlePageInputChange}
              sx={{
                width: "100px",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: theme.palette.grey[300] },
                  "&:hover fieldset": { borderColor: theme.palette.greenAccent.main },
                  "&.Mui-focused fieldset": { borderColor: theme.palette.greenAccent.main },
                  fontSize: "0.9rem",
                },
                "& .MuiInputLabel-root": { color: theme.palette.grey[100] },
                "& .MuiInputBase-input": { color: theme.palette.grey[100] },
              }}
            />
            <Button
              onClick={handlePageInputSubmit}
              variant="contained"
              sx={{
                bgcolor: theme.palette.greenAccent.main,
                color: "#fff",
                "&:hover": { bgcolor: theme.palette.greenAccent.main, opacity: 0.9 },
              }}
            >
              Go
            </Button>
          </Box>

          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "50vh",
                ml: 50,
              }}
            >
              <CircularProgress size={70} sx={{ color: theme.palette.greenAccent.main, p: 2 }} />
            </Box>
          ) : errorMessage ? (
            <Typography sx={{ color: theme.palette.error.main, textAlign: "center", mt: 2 }}>
              {errorMessage}
            </Typography>
          ) : (
            <Box sx={{ height: "70%", width: "100%", ml: 10, display: "flex", flexDirection: "column" }}>
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
                sx={{
                  minWidth: 1200,
                  maxWidth: 1600,
                  color: theme.palette.grey[100],
                  "& .MuiDataGrid-columnHeaders": { bgcolor: theme.palette.grey[300] },
                  "& .MuiDataGrid-footerContainer": {
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.grey[100],
                    borderTop: `1px solid ${theme.palette.grey[300]}`,
                  },
                  "& .MuiPaginationItem-root": {
                    color: theme.palette.grey[100],
                    "&.Mui-selected": { bgcolor: theme.palette.greenAccent.main, color: "#fff" },
                    "&:hover": { bgcolor: theme.palette.greenAccent.main + "20" },
                  },
                  flex: 1,
                }}
                onRowClick={handleRowClick}
              />
              <Typography
                sx={{
                  color: theme.palette.greenAccent.main,
                  textAlign: "center",
                  py: 2,
                  bgcolor: theme.palette.primary.main,
                  mr: 95,
                  paddingBottom: 5,
                  fontSize: 20,
                }}
              >
                Page {currentPage} of {totalPages}
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>

      {showDetails && (
        <Grid item xs={6}>
          <Paper
            sx={{
              width: "100%",
              height: "100%",
              overflow: "auto",
              padding: 2,
              bgcolor: theme.palette.primary.main,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <IconButton onClick={handleCloseDetails}>
                <CloseIcon sx={{ color: theme.palette.grey[100] }} />
              </IconButton>
              <Typography variant="h5" sx={{ color: theme.palette.grey[100] }}>
                Customer Details
              </Typography>
            </Box>

            {selectedCustomer ? (
              <Box>
                <Typography variant="h6" sx={{ color: theme.palette.grey[100] }}>
                  Name: {selectedCustomer.firstName} {selectedCustomer.lastName}
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.grey[100] }}>
                  Phone: {selectedCustomer.phoneNumber}
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.grey[100] }}>
                  Unit: {selectedCustomer.unitNumber}
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.grey[100] }}>
                  Invoices:
                </Typography>
                <ul>
                  {invoices
                    .filter((invoice) => invoice.customerId === selectedCustomer.customerId)
                    .map((inv) => (
                      <li key={inv.id}>
                        <IconButton
                          component={Link}
                          to={`/get-invoice/${inv.id}`}
                          sx={{ color: theme.palette.greenAccent.main }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        Invoice #{inv.invoiceNumber.substring(0, 9)} - Amount: ${inv.invoiceAmount} - Paid: ${inv.amountPaid} - Date:{" "}
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </li>
                    ))}
                </ul>
              </Box>
            ) : (
              <Typography variant="body1" sx={{ color: theme.palette.grey[100] }}>
                Click a customer to view details
              </Typography>
            )}
          </Paper>
        </Grid>
      )}
    </Box>
  );
}