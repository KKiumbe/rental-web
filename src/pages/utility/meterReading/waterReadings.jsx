import React, { useEffect, useState, useMemo, useCallback, Component } from "react";
import {
  Paper,
  Typography,
  Grid,
  Box,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Skeleton,
  Tabs,
  Tab,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { debounce } from "lodash";
import { useAuthStore } from "../../../store/authStore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import TitleComponent from "../../../components/title";
import { getTheme } from "../../../store/theme";
import { format, subHours } from "date-fns";
import PropTypes from "prop-types";

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Typography color="error" sx={{ p: 2 }}>
          Error rendering page: {this.state.error?.message || "Unknown error"}
        </Typography>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

export default function WaterReadingsList() {
  const [normalReadings, setNormalReadings] = useState([]);
  const [abnormalReadings, setAbnormalReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [normalRowCount, setNormalRowCount] = useState(0);
  const [abnormalRowCount, setAbnormalRowCount] = useState(0);
  const [pageInput, setPageInput] = useState("");
  const [tabValue, setTabValue] = useState(0); // 0 for normal, 1 for abnormal

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const BASEURL = import.meta.env.VITE_BASE_URL || "http://localhost:5000/api";
  const theme = getTheme();

  // Fetch all water readings (normal and abnormal)
  const fetchAllWaterReadings = useCallback(
    async (page, pageSize) => {
      setLoading(true);
      setErrorMessage("");
      try {
        const res = await axios.get(`${BASEURL}/water-readings`, {
          params: { page: page + 1, limit: pageSize },
          withCredentials: true,
        });
        const { normal = {}, abnormal = {} } = res.data || {};
        setNormalReadings(normal.data || []);
        setNormalRowCount(normal.totalCount || 0);
        setAbnormalReadings(abnormal.data || []);
        setAbnormalRowCount(abnormal.totalCount || 0);
        if (normal.data?.length === 0 && abnormal.data?.length === 0) {
          setErrorMessage("No water readings found.");
        }
      } catch (error) {
        if (error.response?.status === 401) {
          setErrorMessage("Session expired. Please log in again.");
          navigate("/login");
        } else {
          setErrorMessage(error.response?.data?.message || "Failed to fetch water readings.");
        }
        setNormalReadings([]);
        setNormalRowCount(0);
        setAbnormalReadings([]);
        setAbnormalRowCount(0);
      } finally {
        setLoading(false);
      }
    },
    [navigate, BASEURL]
  );

  // Fetch water readings by customer phone number
  const fetchReadingsByPhone = useCallback(
    async (page, pageSize, phone, isAbnormal = false) => {
      setLoading(true);
      setErrorMessage("");
      try {
        const endpoint = `${BASEURL}/water-readings/search-by-phone`;
        const res = await axios.get(endpoint, {
          params: { phone, page: page + 1, limit: pageSize, type: isAbnormal ? "abnormal" : "normal" },
          withCredentials: true,
        });
        const { data: fetchedReadings = [], totalCount = 0 } = res.data || {};
        if (isAbnormal) {
          setAbnormalReadings(fetchedReadings);
          setAbnormalRowCount(totalCount);
        } else {
          setNormalReadings(fetchedReadings);
          setNormalRowCount(totalCount);
        }
        if (fetchedReadings.length === 0) {
          setErrorMessage(`No ${isAbnormal ? "abnormal" : "normal"} water readings found for this phone number.`);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          setErrorMessage("Session expired. Please log in again.");
          navigate("/login");
        } else {
          setErrorMessage(
            error.response?.data?.message ||
            `Failed to search ${isAbnormal ? "abnormal" : "normal"} water readings by phone.`
          );
        }
        if (isAbnormal) {
          setAbnormalReadings([]);
          setAbnormalRowCount(0);
        } else {
          setNormalReadings([]);
          setNormalRowCount(0);
        }
      } finally {
        setLoading(false);
      }
    },
    [navigate, BASEURL]
  );

  // Fetch water readings by customer name
  const fetchReadingsByName = useCallback(
    async (page, pageSize, query, isAbnormal = false) => {
      setLoading(true);
      setErrorMessage("");
      try {
        const endpoint = `${BASEURL}/water-readings/search-by-name`;
        const [firstName, ...lastNameParts] = query.trim().split(" ");
        const lastName = lastNameParts.length > 0 ? lastNameParts.join(" ") : undefined;
        const res = await axios.get(endpoint, {
          params: { firstName, lastName, page: page + 1, limit: pageSize, type: isAbnormal ? "abnormal" : "normal" },
          withCredentials: true,
        });
        const { data: fetchedReadings = [], totalCount = 0 } = res.data || {};
        if (isAbnormal) {
          setAbnormalReadings(fetchedReadings);
          setAbnormalRowCount(totalCount);
        } else {
          setNormalReadings(fetchedReadings);
          setNormalRowCount(totalCount);
        }
        if (fetchedReadings.length === 0) {
          setErrorMessage(`No ${isAbnormal ? "abnormal" : "normal"} water readings found for this name.`);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          setErrorMessage("Session expired. Please log in again.");
          navigate("/login");
        } else {
          setErrorMessage(
            error.response?.data?.message ||
            `Failed to search ${isAbnormal ? "abnormal" : "normal"} water readings by name.`
          );
        }
        if (isAbnormal) {
          setAbnormalReadings([]);
          setAbnormalRowCount(0);
        } else {
          setNormalReadings([]);
          setNormalRowCount(0);
        }
      } finally {
        setLoading(false);
      }
    },
    [navigate, BASEURL]
  );

  // Debounced search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((query, page, pageSize, isAbnormal) => {
        const trimmedQuery = query.trim();
        if (trimmedQuery === "") {
          fetchAllWaterReadings(page, pageSize);
        } else {
          const isPhoneNumber = /^\d+$/.test(trimmedQuery);
          if (isPhoneNumber) {
            fetchReadingsByPhone(page, pageSize, trimmedQuery, isAbnormal);
          } else {
            fetchReadingsByName(page, pageSize, trimmedQuery, isAbnormal);
          }
        }
      }, 300),
    [fetchAllWaterReadings, fetchReadingsByPhone, fetchReadingsByName]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    debouncedSearch(e.target.value, paginationModel.page, paginationModel.pageSize, tabValue === 1);
  };

  // Handle search submit
  const handleSearch = () => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    debouncedSearch(searchQuery, 0, paginationModel.pageSize, tabValue === 1);
  };

  // Handle page input
  const handlePageInputChange = (e) => {
    const value = e.target.value;
    const totalPages = Math.ceil((tabValue === 0 ? normalRowCount : abnormalRowCount) / paginationModel.pageSize);
    if (value === "" || (/^\d+$/.test(value) && value <= totalPages && value > 0)) {
      setPageInput(value);
    }
  };

  const handlePageInputSubmit = () => {
    if (pageInput) {
      const newPage = parseInt(pageInput, 10) - 1;
      setPaginationModel((prev) => ({ ...prev, page: newPage }));
      setPageInput("");
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    setSearchQuery("");
    fetchAllWaterReadings(0, paginationModel.pageSize);
  };

  // Initial fetch and authentication
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    fetchAllWaterReadings(paginationModel.page, paginationModel.pageSize);
    return () => debouncedSearch.cancel();
  }, [currentUser, navigate, paginationModel, fetchAllWaterReadings, debouncedSearch]);

  // Sanitized rows for normal readings
  const normalRows = useMemo(() => {
    return normalReadings.map((reading) => ({
      id: reading.id,
      customerName: reading.customerName || `${reading.customer?.firstName || "Unknown"} ${reading.customer?.lastName || ""}`,
      phoneNumber: reading.customer?.phoneNumber || reading.Customer?.phoneNumber || "N/A",
      unitId: reading.customer?.unitId || reading.Customer?.unitId || "N/A",
      reading: reading.reading,
      consumption: reading.consumption,
      period: reading.period ? format(new Date(reading.period), "MMM yyyy") : "N/A",
      readBy: reading.User ? `${reading.User.firstName} ${reading.User.lastName}` : "N/A",
      meterPhotoUrl: reading.meterPhotoUrl || "N/A",
      abnormalReading: reading.type === "abnormal" ? "Yes" : "No",
      createdAt: reading.createdAt,
    }));
  }, [normalReadings]);

  // Sanitized rows for abnormal readings
  const abnormalRows = useMemo(() => {
    return abnormalReadings.map((reading) => ({
      id: reading.id,
      customerName: reading.customerName || `${reading.Customer?.firstName || "Unknown"} ${reading.Customer?.lastName || ""}`,
      phoneNumber: reading.Customer?.phoneNumber || reading.customer?.phoneNumber || "N/A",
      unitId: reading.Customer?.unitId || reading.customer?.unitId || "N/A",
      reading: reading.reading,
      consumption: reading.consumption,
      period: reading.period ? format(new Date(reading.period), "MMM yyyy") : "N/A",
      readBy: reading.User ? `${reading.User.firstName} ${reading.User.lastName}` : "N/A",
      meterPhotoUrl: reading.meterPhotoUrl || "N/A",
      reviewed: reading.reviewed ? "Yes" : "No",
      resolved: reading.resolved ? "Yes" : "No",
      reviewNotes: reading.reviewNotes || "N/A",
      createdAt: reading.createdAt,
    }));
  }, [abnormalReadings]);

  // Columns for normal readings
  const normalColumns = [
    {
      field: "actions",
      headerName: "View",
      width: 100,
      renderCell: (params) => (
        <IconButton
          component={Link}
          to={`/water-reading/${params.row.id}`}
          sx={{ color: theme.palette.greenAccent.main }}
          aria-label={`View water reading for ${params.row.customerName}`}
        >
          <VisibilityIcon />
        </IconButton>
      ),
    },
    { field: "customerName", headerName: "Customer Name", width: 200 },
    { field: "phoneNumber", headerName: "Phone Number", width: 150 },
    { field: "unitId", headerName: "Unit", width: 120 },
    { field: "reading", headerName: "Reading (m³)", width: 120 },
    { field: "consumption", headerName: "Consumption (m³)", width: 150 },
    {
      field: "period",
      headerName: "Period",
      width: 150,
      renderCell: (params) => (params.value !== "N/A" ? params.value : "N/A"),
    },
    { field: "readBy", headerName: "Read By", width: 150 },
    {
      field: "meterPhotoUrl",
      headerName: "Meter Photo",
      width: 150,
      renderCell: (params) =>
        params.value !== "N/A" ? (
          <Button
            component="a"
            href={params.value}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: theme.palette.greenAccent.main }}
          >
            View
          </Button>
        ) : (
          "N/A"
        ),
    },
    { field: "abnormalReading", headerName: "Abnormal", width: 120 },
    {
      field: "createdAt",
      headerName: "Date",
      width: 200,
      renderCell: (params) => {
        if (!params?.value) return "N/A";
        try {
          const date = new Date(params.value);
          return format(subHours(date, 1), "dd MMM yyyy, HH:mm:ss");
        } catch {
          return "Invalid Date";
        }
      },
    },
  ];

  // Columns for abnormal readings
  const abnormalColumns = [
    {
      field: "actions",
      headerName: "View",
      width: 100,
      renderCell: (params) => (
        <IconButton
          component={Link}
          to={`/water-reading/${params.row.id}`}
          sx={{ color: theme.palette.greenAccent.main }}
          aria-label={`View abnormal reading for ${params.row.customerName}`}
        >
          <VisibilityIcon />
        </IconButton>
      ),
    },
    { field: "customerName", headerName: "Customer Name", width: 200 },
    { field: "phoneNumber", headerName: "Phone Number", width: 150 },
    { field: "unitId", headerName: "Unit", width: 120 },
    { field: "reading", headerName: "Reading (m³)", width: 120 },
    { field: "consumption", headerName: "Consumption (m³)", width: 150 },
    { field: "period", headerName: "Period", width: 150 },
    { field: "readBy", headerName: "Read By", width: 150 },
    {
      field: "meterPhotoUrl",
      headerName: "Meter Photo",
      width: 150,
      renderCell: (params) =>
        params.value !== "N/A" ? (
          <Button
            component="a"
            href={params.value}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: theme.palette.greenAccent.main }}
          >
            View
          </Button>
        ) : (
          "N/A"
        ),
    },
    { field: "reviewNotes", headerName: "Review Notes", width: 250 },
    { field: "reviewed", headerName: "Reviewed", width: 120 },
    { field: "resolved", headerName: "Resolved", width: 120 },
    {
      field: "createdAt",
      headerName: "Date",
      width: 200,
      renderCell: (params) => {
        if (!params?.value) return "N/A";
        try {
          const date = new Date(params.value);
          return format(subHours(date, 1), "dd MMM yyyy, HH:mm:ss");
        } catch {
          return "Invalid Date";
        }
      },
    },
  ];

  const totalPages = Math.ceil((tabValue === 0 ? normalRowCount : abnormalRowCount) / paginationModel.pageSize);
  const currentPage = paginationModel.page + 1;

  return (
    <Box sx={{ p: 3, bgcolor: theme.palette.primary.main, minHeight: "100vh" }}>
      <ErrorBoundary>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            color: theme.palette.greenAccent.main,
            "&:hover": { bgcolor: theme.palette.greenAccent.main + "20" },
          }}
          aria-label="Go back"
        >
          <ArrowBackIcon sx={{ fontSize: 40 }} />
        </IconButton>

        <Grid item xs={12}>
          <Paper
            sx={{
              width: "100%",
              padding: 2,
              bgcolor: theme.palette.primary.main,
              overflow: "hidden",
            }}
          >
            <Typography component="div" sx={{ padding: 3, ml: 5 }}>
              <TitleComponent title="Water Readings" />
            </Typography>

            {/* Tabs for Normal and Abnormal Readings */}
            <Box sx={{ ml: 10, mb: 2 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="Water readings tabs"
                sx={{
                  "& .MuiTab-root": { color: theme.palette.grey[100] },
                  "& .MuiTab-root.Mui-selected": { color: theme.palette.greenAccent.main },
                  "& .MuiTabs-indicator": { backgroundColor: theme.palette.greenAccent.main },
                }}
              >
                <Tab label="Normal Readings" aria-label="Normal readings tab" />
                <Tab label="Abnormal Readings" aria-label="Abnormal readings tab" />
              </Tabs>
            </Box>

            <Box sx={{ display: "flex", gap: 2, marginBottom: 2, ml: 10 }}>
              <TextField
                label={`Search by Name or Phone Number (${tabValue === 0 ? "Normal" : "Abnormal"})`}
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchQuery("");
                  fetchAllWaterReadings(0, paginationModel.pageSize);
                }}
                sx={{
                  color: theme.palette.greenAccent.main,
                  borderColor: theme.palette.greenAccent.main,
                  "&:hover": { borderColor: theme.palette.greenAccent.main, opacity: 0.9 },
                }}
              >
                Clear Search
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                component={Link}
                to="/water-readings/create"
                sx={{
                  bgcolor: theme.palette.greenAccent.main,
                  color: "#fff",
                  "&:hover": { bgcolor: theme.palette.greenAccent.main, opacity: 0.9 },
                }}
              >
                Create Reading
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
              <Box sx={{ ml: 10, width: "100%", maxWidth: 1600 }}>
                <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
                {[...Array(paginationModel.pageSize)].map((_, index) => (
                  <Skeleton key={index} variant="rectangular" height={52} sx={{ mb: 0.5 }} />
                ))}
              </Box>
            ) : errorMessage ? (
              <Typography sx={{ color: theme.palette.error.main, textAlign: "center", mt: 2 }}>
                {errorMessage}
              </Typography>
            ) : (tabValue === 0 ? normalReadings : abnormalReadings).length === 0 ? (
              <Typography sx={{ color: theme.palette.grey[100], textAlign: "center", mt: 2 }}>
                No {tabValue === 1 ? "abnormal" : "normal"} water readings found.
              </Typography>
            ) : (
              <Box sx={{ height: "70%", width: "100%", ml: 10, display: "flex", flexDirection: "column" }}>
                <DataGrid
                  rows={tabValue === 0 ? normalRows : abnormalRows}
                  columns={tabValue === 0 ? normalColumns : abnormalColumns}
                  getRowId={(row) => row.id}
                  paginationMode="server"
                  rowCount={tabValue === 0 ? normalRowCount : abnormalRowCount}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  pageSizeOptions={[10, 20, 50]}
                  checkboxSelection
                  disableRowSelectionOnClick
                  rowBuffer={10}
                  columnBuffer={2}
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
                />
                <Typography
                  sx={{
                    color: theme.palette.greenAccent.main,
                    textAlign: "center",
                    py: 2,
                    bgcolor: theme.palette.primary.main,
                    fontSize: 20,
                  }}
                >
                  Page {currentPage} of {totalPages}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </ErrorBoundary>
    </Box>
  );
}