import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  IconButton,
  Box,
  Alert,
  TextField,
  Button,
  CircularProgress,
  Typography,
  useTheme,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/authStore";
import TitleComponent from "../components/title";
import axios from "axios";

// Function to flatten the nested receipt response with defensive checks
const flattenReceipts = (receipts) => {
  if (!Array.isArray(receipts)) return [];

  return receipts.map((receipt) => {
    const payment = receipt.payment || {};
    const customer = receipt.customer || {};
    const firstInvoice = receipt.receiptInvoices?.[0]?.invoice || {};

    return {
      id: receipt.id || "",
      tenantId: receipt.tenantId || null,
      receiptNumber: receipt.receiptNumber || "N/A",
      amount: receipt.amount || 0,
      modeOfPayment: receipt.modeOfPayment || "N/A",
      paidBy: receipt.paidBy || "N/A",
      transactionCode: receipt.transactionCode || null,
      phoneNumber: receipt.phoneNumber || null,
      paymentId: receipt.paymentId || "",
      customerId: receipt.customerId || "",
      createdAt: receipt.createdAt || null,
      paymentFirstName: payment.firstName || "N/A",
      paymentTransactionId: payment.transactionId || null,
      paymentCreatedAt: payment.createdAt || null,
      customerFirstName: customer.firstName || "N/A",
      customerLastName: customer.lastName || "N/A",
      customerPhoneNumber: customer.phoneNumber || "N/A",
      customerClosingBalance: customer.closingBalance !== undefined ? customer.closingBalance : "N/A",
      invoiceId: firstInvoice.id || "",
      invoiceNumber: firstInvoice.invoiceNumber || "N/A",
      invoiceAmount: firstInvoice.invoiceAmount || "N/A",
      invoiceStatus: firstInvoice.status || "N/A",
      invoiceCreatedAt: firstInvoice.createdAt || null,
    };
  });
};

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser = useAuthStore((state) => state.currentUser);
 
  const navigate = useNavigate();
  const theme = useTheme();
  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const fetchAllReceipts = async (page, pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BASEURL}/receipts`, {
        params: { page: page + 1, limit: pageSize },
        withCredentials: true,
      });
      const { receipts: fetchedReceipts, total } = response.data;
      const flattenedData = flattenReceipts(fetchedReceipts || []);
      setReceipts(flattenedData);
      setRowCount(total || 0);
      console.log("Flattened Receipts:", JSON.stringify(flattenedData, null, 2));
    } catch (err) {
      let errorMessage = "Failed to fetch receipts.";
      if (err.code === "ERR_NETWORK") {
        errorMessage = "Network error: Is the backend server running on localhost:5000?";
      } else if (err.response) {
        errorMessage = err.response.data?.error || `Error ${err.response.status}: ${err.response.statusText}`;
      }
      setError(errorMessage);
      console.error("Error fetching receipts:", err);
      setReceipts([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceiptsByPhone = async (page, pageSize, query) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BASEURL}/search-by-phone`, {
        params: { phone: query, page: page + 1, limit: pageSize },
        withCredentials: true,
      });
      const { receipts: fetchedReceipts, total } = response.data;
      const flattenedData = flattenReceipts(fetchedReceipts || []);
      setReceipts(flattenedData);
      setRowCount(total || 0);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to search receipts by phone.");
      console.error("Error fetching receipts by phone:", err);
      setReceipts([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceiptsByName = async (page, pageSize, query) => {
    setLoading(true);
    setError(null);
    try {
      const [firstName, ...lastNameParts] = query.trim().split(" ");
      const lastName = lastNameParts.length > 0 ? lastNameParts.join(" ") : undefined;
      const response = await axios.get(`${BASEURL}/search-by-name`, {
        params: { firstName, lastName, page: page + 1, limit: pageSize },
        withCredentials: true,
      });
      const { receipts: fetchedReceipts, total } = response.data;
      const flattenedData = flattenReceipts(fetchedReceipts || []);
      setReceipts(flattenedData);
      setRowCount(total || 0);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to search receipts by name.");
      console.error("Error fetching receipts by name:", err);
      setReceipts([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    if (!searchQuery) {
      fetchAllReceipts(paginationModel.page, paginationModel.pageSize);
    }
  }, [paginationModel, searchQuery, currentUser]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = () => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery === "") {
      fetchAllReceipts(0, paginationModel.pageSize);
    } else {
      const isPhoneNumber = /^\d+$/.test(trimmedQuery);
      if (isPhoneNumber) {
        fetchReceiptsByPhone(0, paginationModel.pageSize, trimmedQuery);
      } else {
        fetchReceiptsByName(0, paginationModel.pageSize, trimmedQuery);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const columns = [
    {
      field: "view",
      headerName: "View",
      width: 80,
      renderCell: (params) => (
        <IconButton
          component={Link}
          to={`/receipts/${params.row.id}`}
          sx={{ color: theme.palette.greenAccent.main || "#4caf50" }}
        >
          <VisibilityIcon />
        </IconButton>
      ),
    },
    { field: "receiptNumber", headerName: "Receipt Number", width: 150 },
    { field: "amount", headerName: "Amount (KES)", width: 120 },
    { field: "modeOfPayment", headerName: "Payment Mode", width: 120 },
    { field: "paidBy", headerName: "Paid By", width: 120 },
    { 
      field: "transactionCode", 
      headerName: "Transaction Code", 
      width: 150, 
    
    },
    { 
      field: "phoneNumber", 
      headerName: "Receipt Phone", 
      width: 150, 
     
    },
    { field: "customerFirstName", headerName: "First Name", width: 120 },
    { field: "customerLastName", headerName: "Last Name", width: 120 },
    { field: "customerPhoneNumber", headerName: "Customer Phone", width: 150 },
    { field: "customerClosingBalance", headerName: "Closing Balance", width: 120 },
    { 
      field: "paymentFirstName", 
      headerName: "Payer First Name", 
      width: 120, 
     
    },
    { 
      field: "paymentTransactionId", 
      headerName: "Payment Trans. ID", 
      width: 150, 
      
    },
    


    {
      field: "createdAt",
      headerName: "Date",
      width: 200,
      renderCell: (params) => {
        if (!params?.value) return "N/A";
    
        try {
          const date = new Date(params.value);
          date.setHours(date.getHours() - 1); // Subtract 1 hour to correct time
    
          const day = String(date.getDate()).padStart(2, '0');
          const month = date.toLocaleString('default', { month: 'short' });
          const year = date.getFullYear();
    
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
    
          return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
        } catch (error) {
          console.error("Invalid Date:", params.value);
          return "Invalid Date";
        }
      },
    }
,    

    {
      field: "invoiceNumber",
      headerName: "Invoice Number",
      width: 150,
      renderCell: (params) =>
        params?.row?.invoiceId ? (
          <Link to={`/get-invoice/${params.row.invoiceId}`} style={{ textDecoration: "none", color: theme.palette.blueAccent.main || "#1976d2" }}>
            {params.value || "N/A"}
          </Link>
        ) : (
          "N/A"
        ),
    },
    { 
      field: "invoiceAmount", 
      headerName: "Invoice Amount", 
      width: 120, 
    
    },
    { 
      field: "invoiceStatus", 
      headerName: "Invoice Status", 
      width: 120, 
    
    },
    {
      field: "invoiceCreatedAt",
      headerName: "Invoice Date",
      width: 180,
      renderCell: (params) =>
        params?.value
          ? new Date(params.value).toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "N/A",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        bgcolor: theme.palette.background.default,
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "fex-start",
        justifyContent: "flex-start",
      }}
    >
      <Box sx={{ maxWidth: "90%", width: "100%" }}>
        <TitleComponent title="Receipts" />

        <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
          <TextField
            label="Search by Name or Phone"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
            sx={{
              width: "400px",
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: theme.palette.grey[300] || "#e0e0e0" },
                "&:hover fieldset": { borderColor: theme.palette.greenAccent.main || "#4caf50" },
                "&.Mui-focused fieldset": { borderColor: theme.palette.greenAccent.main || "#4caf50" },
              },
              "& .MuiInputLabel-root": { color: theme.palette.text.primary || "#222222" },
              "& .MuiInputBase-input": { color: theme.palette.text.primary || "#222222" },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{
              bgcolor: theme.palette.greenAccent.main || "#4caf50",
              color: theme.palette.grey[100] || "#fff",
              "&:hover": { bgcolor: theme.palette.greenAccent.dark || "#388e3c" },
            }}
          >
            Search
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
            <CircularProgress size={70} sx={{ color: theme.palette.greenAccent.main || "#4caf50" }} />
          </Box>
        ) : (
          <DataGrid
            rows={receipts}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
            paginationMode="server"
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 50]}
            disableSelectionOnClick
            autoHeight
            sx={{
              width: "100%",
              "& .MuiDataGrid-columnHeaders": { bgcolor: theme.palette.grey[300] || "#e0e0e0" },
              "& .MuiDataGrid-footerContainer": {
                bgcolor: theme.palette.primary.main || "#1976d2",
                color: theme.palette.grey[100] || "#fff",
              },
              "& .MuiDataGrid-virtualScroller": { overflowX: "auto" },
            }}
          />
        )}
        {!loading && (
          <Typography sx={{ textAlign: "center", mt: 2, color: theme.palette.text.primary || "#222222" }}>
            Page {paginationModel.page + 1} of {Math.ceil(rowCount / paginationModel.pageSize) || 1}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default Receipts;