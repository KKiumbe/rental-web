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
  Paper,
  TextField,
  Button,
  Snackbar,
  IconButton,
} from "@mui/material";
import TitleComponent from "../components/title";
import { getTheme } from "../store/theme";
import { Link, useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import { useAuthStore } from "../store/authStore";




const CustomersScreen = () => {
  const [customers, setCustomers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Pagination State
  const [page, setPage] = useState(0); // MUI uses 0-based index
  const [pageSize, setPageSize] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const theme = getTheme();

 
  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const fetchCustomers = async (page, pageSize) => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASEURL}/customers`, {
        params: { page: page + 1, limit: pageSize }, // Backend uses 1-based index
        withCredentials: true,
      });

      const { customers, total } = response.data;
      setCustomers(customers);
      setTotalCustomers(total);
      setSearchResults(customers);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setError("Failed to fetch customers");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(page, pageSize);
  }, [page, pageSize]);

  const handleSearch = async () => {
    setIsSearching(true);
    if (!searchQuery.trim()) {
      setSearchResults(customers);
      setIsSearching(false);
      return;
    }

    try {
      const isPhoneNumber = /^\d+$/.test(searchQuery);
      const response = await axios.get(`${BASEURL}/search-customers`, {
        params: {
          phone: isPhoneNumber ? searchQuery : undefined,
          name: !isPhoneNumber ? searchQuery : undefined,
        },
        withCredentials: true,
      });

      setSearchResults(response.data);
    } catch (error) {
      console.error("Error searching customers:", error);
      setSnackbarMessage("Error searching customers.");
      setSnackbarOpen(true);
    } finally {
      setIsSearching(false);
    }
  };

  const columns = [
    {
      field: "actions",
      headerName: "View",
      width: 100,
      renderCell: (params) => (
        <IconButton component={Link} to={`/customer-details/${params.row.id}`} sx={{ color: theme?.palette?.primary }} // fallback to green
>
          <VisibilityIcon />
        </IconButton>
      ),
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 100,
      renderCell: (params) => (
        <IconButton component={Link} to={`/customer-edit/${params.row.id}`}  sx={{ color: theme?.palette?.primary}} // fallback to green
>
          <EditIcon />
        </IconButton>
      ),
    },
    { field: "firstName", headerName: "First Name", width: 150 },
    { field: "lastName", headerName: "Last Name", width: 150 },
    { field: "closingBalance", headerName: "Closing Balance", width: 100 },
    { field: "monthlyCharge", headerName: "Monthly Charge", width: 100 },
    { field: "phoneNumber", headerName: "Phone Number", width: 150 },
  
    { field: "garbageCollectionDay", headerName: "Collection Day", width: 150 },
    { field: "collected", headerName: "Collected", width: 100, type: "boolean" },
    { field: "trashBagsIssued", headerName: "Trash Bags Issued", width: 150, type: "boolean" },
    { field: "estateName", headerName: "Estate Name", width: 150 },
    { field: "building", headerName: "Building", width: 150 },
    { field: "houseNumber", headerName: "House Number", width: 150 },
    { field: "category", headerName: "Category", width: 150 },
  ];

  return (
    <Box sx={{ bgcolor: theme?.palette?.background?.paper, minHeight: "100vh" }}>
      <Typography component="div" variant="h5" gutterBottom sx={{ padding: 3, ml: 5 }}>
        <TitleComponent title="Customers" />
      </Typography>

      {/* Search Bar */}
      <Box sx={{ display: "flex", gap: 2, marginBottom: 2, ml: 10 }}>
  {/* Search Input */}

  <TextField
  label="Search by Name or Phone"
  variant="outlined"
  size="small"
  sx={{
    width: "400px",
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: theme?.palette?.grey[300] },
      "&:hover fieldset": { borderColor: theme?.palette?.greenAccent.main },
      "&.Mui-focused fieldset": { borderColor: theme?.palette?.greenAccent.main },
    },
    "& .MuiInputLabel-root": { color: theme?.palette?.grey[100] },

  }}
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>


  <Button variant="contained" color="primary" onClick={handleSearch} disabled={isSearching}  sx={{width: "400px",
      "& .MuiOutlinedInput-root": {
        "& fieldset": { borderColor: theme?.palette?.grey[300] },
        "&:hover fieldset": { borderColor: theme?.palette?.greenAccent.main },
        "&.Mui-focused fieldset": { borderColor: theme?.palette?.greenAccent.main },
      },
      "& .MuiInputLabel-root": { color: theme?.palette?.grey[100] },
      "& .MuiInputBase-input": { color: theme?.palette?.grey[100] },}}>
    {isSearching ? "Searching..." : "Search"}
  </Button>

  {/* Page Number Input */}
  <TextField
    label="Page Number"
    type="number"
    variant="outlined"
    size="small"
    sx={{ width: "100px" }}
    value={page + 1} // Display 1-based index
    onChange={(e) => {
      const newPage = Math.max(1, parseInt(e.target.value, 10) || 1) - 1; // Convert to 0-based index
      setPage(newPage);
    }}
  />
</Box>


      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", ml: 20 }}>
          <CircularProgress size={30} />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Paper sx={{ width: "90%", overflow: "auto", height: 500 }}>
          <DataGrid
            rows={searchResults}
            columns={columns}
            getRowId={(row) => row.id}
            pageSize={pageSize}
            rowCount={totalCustomers}
            paginationMode="server"
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            rowsPerPageOptions={[10, 20, 50]}
            checkboxSelection
            disableSelectionOnClick
            sx={{ minWidth: 900, marginLeft: "auto", ml: 10, maxWidth: 1400 }}
            components={{
              Toolbar: () => (
                <GridToolbarContainer>
                  <GridToolbarExport />
                </GridToolbarContainer>
              ),
            }}
          />
        </Paper>
      )}

      {/* Snackbar for search errors */}
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
    </Box>
  );
};

export default CustomersScreen;