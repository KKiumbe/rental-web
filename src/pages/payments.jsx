import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
} from "@mui/x-data-grid";
import {
  CircularProgress,
  Typography,
  Box,
  TextField,
  Button,
  Snackbar,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import TitleComponent from "../components/title";
import { getTheme } from "../store/theme";

// Flatten nested payment response
const flattenPayments = (payments) => {
  return payments.map((payment) => {
    const receipt = payment.receipt || {};
    const receiptInvoices = receipt.receiptInvoices || [];
    const firstInvoice = receiptInvoices[0]?.invoice || {};

    return {
      id: payment.id,
      tenantId: payment.tenantId,
      amount: payment.amount,
      modeOfPayment: payment.modeOfPayment,
      transactionId: payment.transactionId,
      firstName: payment.firstName,
      receipted: payment.receipted,
      ref: payment.ref,
      createdAt: payment.createdAt,
      receiptId: receipt.id || null,
      receiptNumber: receipt.receiptNumber || "N/A",
      invoiceId: firstInvoice.id || null,
      invoiceNumber: firstInvoice.invoiceNumber || "N/A",
    };
  });
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("name");
  const [modeFilter, setModeFilter] = useState("all");
  const [showUnreceiptedOnly, setShowUnreceiptedOnly] = useState(false);

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
    if (currentUser) {
      fetchPayments(paginationModel.page, paginationModel.pageSize, modeFilter, showUnreceiptedOnly);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && !searchQuery) {
      fetchPayments(paginationModel.page, paginationModel.pageSize, modeFilter, showUnreceiptedOnly);
    }
  }, [paginationModel, modeFilter, showUnreceiptedOnly, currentUser]);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setOpenSnackbar(false);
    setError(null);
  };

  const fetchPayments = async (page, pageSize, mode = "all", unreceiptedOnly = false) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = unreceiptedOnly ? `${BASEURL}/payments/unreceipted` : `${BASEURL}/payments`;
      const params = { page: page + 1, limit: pageSize };
      if (mode !== "all") params.mode = mode;

      const response = await axios.get(endpoint, { params, withCredentials: true });
      const { payments: fetchedPayments, total } = response.data;
      const flattenedData = flattenPayments(fetchedPayments || []);
      setPayments(flattenedData);
      setRowCount(total || 0);
      console.log(`this is the payment object ${JSON.stringify(fetchedPayments)}`);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "User not found"
          : err.response?.data?.error || "Failed to fetch payments."
      );
      setOpenSnackbar(true);
      setPayments([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentsByName = async (page, pageSize, query) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BASEURL}/payments/search-by-name`, {
        params: { name: query, page: page + 1, limit: pageSize },
        withCredentials: true,
      });
      const { payments: fetchedPayments, total } = response.data;
      const flattenedData = flattenPayments(fetchedPayments || []);
      setPayments(flattenedData);
      setRowCount(total || 0);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "User not found"
          : err.response?.data?.error || "Failed to search payments by name."
      );
      setOpenSnackbar(true);
      setPayments([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentByTransactionId = async (page, pageSize, query) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BASEURL}/searchTransactionById`, {
        params: { transactionId: query, page: page + 1, limit: pageSize },
        withCredentials: true,
      });
      const { transaction } = response.data;
      const flattenedData = flattenPayments([transaction]);
      setPayments(flattenedData);
      setRowCount(1);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "User not found"
          : err.response?.data?.error || "Failed to search payment by transaction ID."
      );
      setOpenSnackbar(true);
      setPayments([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentsByRef = async (page, pageSize, query) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BASEURL}/payments/search-by-phone`, {
        params: { ref: query, page: page + 1, limit: pageSize },
        withCredentials: true,
      });
      const { payments: fetchedPayments, total } = response.data;
      const flattenedData = flattenPayments(fetchedPayments || []);
      setPayments(flattenedData);
      setRowCount(total || 0);

      console.log(`this is the payment object ${JSON.stringify(fetchedPayments)}`);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "User not found"
          : err.response?.data?.error || "Failed to search payments by ref number."
      );
      setOpenSnackbar(true);
      setPayments([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPress = (id) => navigate(`/payments/${id}`);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
    setSearchQuery("");
    setPayments([]);
    setRowCount(0);
  };

  const handleModeFilterChange = (e) => {
    setModeFilter(e.target.value);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleSearch = () => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery === "") {
      fetchPayments(0, paginationModel.pageSize, modeFilter, showUnreceiptedOnly);
    } else {
      switch (searchType) {
        case "name":
          fetchPaymentsByName(0, paginationModel.pageSize, trimmedQuery);
          break;
        case "transactionId":
          fetchPaymentByTransactionId(0, paginationModel.pageSize, trimmedQuery);
          break;
        case "ref":
          fetchPaymentsByRef(0, paginationModel.pageSize, trimmedQuery);
          break;
        default:
          break;
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleFilterUnreceipted = () => {
    setShowUnreceiptedOnly((prev) => {
      const newValue = !prev;
      fetchPayments(0, paginationModel.pageSize, modeFilter, newValue);
      return newValue;
    });
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const columns = [
    {
      field: "view",
      headerName: "View",
      width: 100,
      renderCell: (params) => (
        <IconButton
          component={Link}
          to={`/payments/${params.row.id}`}
          sx={{ color: theme.palette.greenAccent.main }}
        >
          <VisibilityIcon />
        </IconButton>
      ),
    },
    { field: "amount", headerName: "Amount (KES)", width: 150 },
    { field: "modeOfPayment", headerName: "Mode of Payment", width: 180 },
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
    },
    { field: "transactionId", headerName: "Transaction ID", width: 200 },
    { field: "firstName", headerName: "Customer Name", width: 180 },
    { field: "ref", headerName: "Reference Number", width: 180 },
    {
      field: "receipted",
      headerName: "Status",
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Receipted" : "Not Receipted"}
          sx={{
            bgcolor: params.value ? theme.palette.greenAccent.main : "#ff9800",
            color: "#fff",
          }}
          size="small"
        />
      ),
    },
    {
      field: "receiptNumber",
      headerName: "Receipt Number",
      width: 180,
      renderCell: (params) =>
        params.row.receiptId ? (
          <Link
            to={`/receipts/${params.row.receiptId}`}
            style={{ textDecoration: "none", color: theme.palette.greenAccent.main }}
          >
            {params.value}
          </Link>
        ) : (
          "N/A"
        ),
    },
    {
      field: "invoiceNumber",
      headerName: "Paid Invoice",
      width: 200,
      renderCell: (params) =>
        params.row.invoiceId ? (
          <Link
            to={`/get-invoice/${params.row.invoiceId}`}
            style={{ textDecoration: "none", color: theme.palette.greenAccent.main }}
          >
            {params.value}
          </Link>
        ) : (
          "N/A"
        ),
    },
    
    
    

    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      renderCell: (params) =>
        !params.row.receipted && (
          <IconButton
            onClick={() => handleEditPress(params.row.id)}
            sx={{ color: theme.palette.greenAccent.main }}
            aria-label="Edit payment"
          >
            <EditIcon />
          </IconButton>
        ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <TitleComponent title="Payments" />

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="search-type-label">Search By</InputLabel>
          <Select
            labelId="search-type-label"
            value={searchType}
            label="Search By"
            onChange={handleSearchTypeChange}
            sx={{
              "& .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.grey[300] },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.greenAccent.main },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.greenAccent.main },
              "& .MuiInputLabel-root": { color: theme.palette.grey[100] },
              "& .MuiSelect-select": { color: theme.palette.grey[100] },
            }}
          >
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="transactionId">Transaction ID</MenuItem>
            <MenuItem value="ref">Reference Number</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label={`Search by ${searchType === "name" ? "Name" : searchType === "transactionId" ? "Transaction ID" : "Reference Number"}`}
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          sx={{
            width: 400,
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
            color: theme.palette.grey[100],
            "&:hover": { bgcolor: theme.palette.greenAccent.dark },
            width: 150,
          }}
        >
          Search
        </Button>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="mode-filter-label">Payment Mode</InputLabel>
          <Select
            labelId="mode-filter-label"
            value={modeFilter}
            label="Payment Mode"
            onChange={handleModeFilterChange}
            sx={{
              "& .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.grey[300] },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.greenAccent.main },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.greenAccent.main },
              "& .MuiInputLabel-root": { color: theme.palette.grey[100] },
              "& .MuiSelect-select": { color: theme.palette.grey[100] },
            }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="CASH">Cash</MenuItem>
            <MenuItem value="MPESA">M-Pesa</MenuItem>
            <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant={showUnreceiptedOnly ? "contained" : "outlined"}
          onClick={handleFilterUnreceipted}
          sx={{
            bgcolor: showUnreceiptedOnly ? "#ff9800" : "transparent",
            color: showUnreceiptedOnly ? theme.palette.grey[100] : "#ff9800",
            borderColor: "#ff9800",
            "&:hover": { bgcolor: showUnreceiptedOnly ? "#f57c00" : "#ff980033" },
          }}
        >
          {showUnreceiptedOnly ? "Show All Payments" : "Show Unreceipted Only"}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <CircularProgress size={70} sx={{ color: theme.palette.greenAccent.main }} />
        </Box>
      ) : (
        <DataGrid
          rows={payments}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50]}
          disableSelectionOnClick
          sx={{
            bgcolor: theme.palette.background.paper,
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: theme.palette.primary.main,
              color: theme.palette.grey[100],
            },
            "& .MuiDataGrid-cell": { color: theme.palette.grey[100] },
            ml: "auto",
            mr: "auto",
            maxWidth: "100%",
          }}
          components={{
            Toolbar: () => (
              <GridToolbarContainer>
                <GridToolbarExport />
              </GridToolbarContainer>
            ),
          }}
        />
      )}
      {!loading && (
        <Typography sx={{ textAlign: "center", mt: 2, color: theme.palette.grey[100] }}>
          Page {paginationModel.page + 1} of {Math.ceil(rowCount / paginationModel.pageSize) || 1}
        </Typography>
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Payments;