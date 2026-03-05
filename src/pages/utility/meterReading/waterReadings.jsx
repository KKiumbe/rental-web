import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  Tooltip,
  InputAdornment,
  alpha,
  Snackbar,
  Alert,
} from "@mui/material";
import { DataGrid, GridToolbarContainer, GridToolbarExport } from "@mui/x-data-grid";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { debounce } from "lodash";
import { useAuthStore } from "../../../store/authStore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { getTheme } from "../../../store/theme";
import { format, subHours } from "date-fns";

export default function WaterReadingsList() {
  const [normalReadings,    setNormalReadings]    = useState([]);
  const [abnormalReadings,  setAbnormalReadings]  = useState([]);
  const [loading,           setLoading]           = useState(false);
  const [errorMessage,      setErrorMessage]      = useState("");
  const [openSnackbar,      setOpenSnackbar]      = useState(false);
  const [searchQuery,       setSearchQuery]       = useState("");
  const [paginationModel,   setPaginationModel]   = useState({ page: 0, pageSize: 20 });
  const [normalRowCount,    setNormalRowCount]    = useState(0);
  const [abnormalRowCount,  setAbnormalRowCount]  = useState(0);
  const [tabValue,          setTabValue]          = useState(0);

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate    = useNavigate();
  const BASEURL     = import.meta.env.VITE_BASE_URL || "http://localhost:5000/api";
  const theme       = getTheme();

  const isDark        = theme.palette.mode === "dark";
  const surfaceBg     = isDark ? "#141824" : "#f4f6fb";
  const cardBg        = isDark ? "#1c2030" : "#ffffff";
  const borderColor   = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const headerBg      = isDark ? "#181d2e" : "#f0f3f9";
  const textPrimary   = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const accentGreen   = theme.palette.greenAccent.main;
  const accentBlue    = theme.palette.blueAccent?.main || "#1976d2";
  const accentOrange  = "#ff9800";

  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // ── Data fetchers ────────────────────────────────────────────────
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
      } catch (err) {
        if (err.response?.status === 401) { navigate("/login"); return; }
        const msg = err.response?.data?.message || "Failed to fetch water readings.";
        setErrorMessage(msg);
        setOpenSnackbar(true);
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

  const fetchReadingsByPhone = useCallback(
    async (page, pageSize, phone, isAbnormal = false) => {
      setLoading(true);
      setErrorMessage("");
      try {
        const res = await axios.get(`${BASEURL}/water-readings/search-by-phone`, {
          params: { phone, page: page + 1, limit: pageSize, type: isAbnormal ? "abnormal" : "normal" },
          withCredentials: true,
        });
        const { data: rows = [], totalCount = 0 } = res.data || {};
        if (isAbnormal) { setAbnormalReadings(rows); setAbnormalRowCount(totalCount); }
        else            { setNormalReadings(rows);   setNormalRowCount(totalCount); }
        if (!rows.length) setErrorMessage(`No ${isAbnormal ? "abnormal" : "normal"} readings found for this phone.`);
      } catch (err) {
        if (err.response?.status === 401) { navigate("/login"); return; }
        setErrorMessage(err.response?.data?.message || "Failed to search by phone.");
        setOpenSnackbar(true);
        if (isAbnormal) { setAbnormalReadings([]); setAbnormalRowCount(0); }
        else            { setNormalReadings([]);   setNormalRowCount(0); }
      } finally {
        setLoading(false);
      }
    },
    [navigate, BASEURL]
  );

  const fetchReadingsByName = useCallback(
    async (page, pageSize, query, isAbnormal = false) => {
      setLoading(true);
      setErrorMessage("");
      try {
        const [firstName, ...rest] = query.trim().split(" ");
        const lastName = rest.length > 0 ? rest.join(" ") : undefined;
        const res = await axios.get(`${BASEURL}/water-readings/search-by-name`, {
          params: { firstName, lastName, page: page + 1, limit: pageSize, type: isAbnormal ? "abnormal" : "normal" },
          withCredentials: true,
        });
        const { data: rows = [], totalCount = 0 } = res.data || {};
        if (isAbnormal) { setAbnormalReadings(rows); setAbnormalRowCount(totalCount); }
        else            { setNormalReadings(rows);   setNormalRowCount(totalCount); }
        if (!rows.length) setErrorMessage(`No ${isAbnormal ? "abnormal" : "normal"} readings found for this name.`);
      } catch (err) {
        if (err.response?.status === 401) { navigate("/login"); return; }
        setErrorMessage(err.response?.data?.message || "Failed to search by name.");
        setOpenSnackbar(true);
        if (isAbnormal) { setAbnormalReadings([]); setAbnormalRowCount(0); }
        else            { setNormalReadings([]);   setNormalRowCount(0); }
      } finally {
        setLoading(false);
      }
    },
    [navigate, BASEURL]
  );

  const debouncedSearch = useMemo(
    () =>
      debounce((query, page, pageSize, isAbnormal) => {
        const q = query.trim();
        if (!q) { fetchAllWaterReadings(page, pageSize); return; }
        const isPhone = /^\d+$/.test(q);
        if (isPhone) fetchReadingsByPhone(page, pageSize, q, isAbnormal);
        else         fetchReadingsByName(page, pageSize, q, isAbnormal);
      }, 300),
    [fetchAllWaterReadings, fetchReadingsByPhone, fetchReadingsByName]
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    debouncedSearch(e.target.value, paginationModel.page, paginationModel.pageSize, tabValue === 1);
  };

  const handleSearch = () => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    debouncedSearch(searchQuery, 0, paginationModel.pageSize, tabValue === 1);
  };

  const handleTabChange = (_, newVal) => {
    setTabValue(newVal);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    setSearchQuery("");
    fetchAllWaterReadings(0, paginationModel.pageSize);
  };

  useEffect(() => {
    if (!currentUser) return;
    if (!searchQuery) fetchAllWaterReadings(paginationModel.page, paginationModel.pageSize);
    return () => debouncedSearch.cancel();
  }, [paginationModel, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Row mappers ──────────────────────────────────────────────────
  const normalRows = useMemo(() =>
    normalReadings.map((r) => ({
      id:             r.id,
      customerName:   r.customerName || `${r.customer?.firstName || "Unknown"} ${r.customer?.lastName || ""}`,
      phoneNumber:    r.customer?.phoneNumber || r.Customer?.phoneNumber || "N/A",
      unitId:         r.customer?.unitId || r.Customer?.unitId || "N/A",
      reading:        r.reading,
      consumption:    r.consumption,
      period:         r.period ? format(new Date(r.period), "MMM yyyy") : "N/A",
      readBy:         r.User ? `${r.User.firstName} ${r.User.lastName}` : "N/A",
      meterPhotoUrl:  r.meterPhotoUrl || null,
      abnormalReading:r.type === "abnormal",
      createdAt:      r.createdAt,
    })),
    [normalReadings]
  );

  const abnormalRows = useMemo(() =>
    abnormalReadings.map((r) => ({
      id:             r.id,
      customerName:   r.customerName || `${r.Customer?.firstName || "Unknown"} ${r.Customer?.lastName || ""}`,
      phoneNumber:    r.Customer?.phoneNumber || r.customer?.phoneNumber || "N/A",
      unitId:         r.Customer?.unitId || r.customer?.unitId || "N/A",
      reading:        r.reading,
      consumption:    r.consumption,
      period:         r.period ? format(new Date(r.period), "MMM yyyy") : "N/A",
      readBy:         r.User ? `${r.User.firstName} ${r.User.lastName}` : "N/A",
      meterPhotoUrl:  r.meterPhotoUrl || null,
      reviewed:       r.reviewed,
      resolved:       r.resolved,
      reviewNotes:    r.reviewNotes || "N/A",
      createdAt:      r.createdAt,
    })),
    [abnormalReadings]
  );

  // ── Shared column helpers ────────────────────────────────────────
  const actionCol = {
    field: "actions",
    headerName: "Actions",
    width: 90,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        <Tooltip title="View Reading">
          <IconButton
            component={Link}
            to={`/water-reading/${params.row.id}`}
            size="small"
            sx={{ color: accentGreen, "&:hover": { bgcolor: alpha(accentGreen, 0.1) } }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),
  };

  const tenantCol = {
    field: "customerName",
    headerName: "Tenant",
    width: 210,
    renderCell: (params) => (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", py: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {params.value}
        </Typography>
        <Typography variant="caption" sx={{ color: textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {params.row.phoneNumber !== "N/A" ? params.row.phoneNumber : "\u2014"}
        </Typography>
      </Box>
    ),
  };

  const consumptionCol = {
    field: "consumption",
    headerName: "Consumption (m\u00b3)",
    width: 160,
    renderCell: (params) => (
      <Typography variant="body2" sx={{ fontWeight: 700, color: accentBlue }}>
        {params.value ?? "\u2014"}
      </Typography>
    ),
  };

  const readingCol = {
    field: "reading",
    headerName: "Reading (m\u00b3)",
    width: 140,
    renderCell: (params) => (
      <Typography variant="body2" sx={{ fontWeight: 600, color: textPrimary }}>
        {params.value ?? "\u2014"}
      </Typography>
    ),
  };

  const periodCol = {
    field: "period",
    headerName: "Period",
    width: 120,
    renderCell: (params) => (
      <Chip
        label={params.value || "\u2014"}
        size="small"
        sx={{ bgcolor: alpha(accentBlue, 0.1), color: accentBlue, fontWeight: 600, fontSize: "0.7rem", height: 22 }}
      />
    ),
  };

  const dateCol = {
    field: "createdAt",
    headerName: "Date",
    width: 165,
    renderCell: (params) => {
      if (!params?.value) return <Typography variant="caption" sx={{ color: textSecondary }}>N/A</Typography>;
      try {
        const d = subHours(new Date(params.value), 1);
        return (
          <Box>
            <Typography variant="body2">{format(d, "dd MMM yyyy")}</Typography>
            <Typography variant="caption" sx={{ color: textSecondary }}>{format(d, "HH:mm")}</Typography>
          </Box>
        );
      } catch { return "Invalid Date"; }
    },
  };

  const meterPhotoCol = {
    field: "meterPhotoUrl",
    headerName: "Photo",
    width: 90,
    sortable: false,
    renderCell: (params) =>
      params.value ? (
        <Tooltip title="View meter photo">
          <IconButton
            component="a"
            href={params.value}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{ color: accentBlue, "&:hover": { bgcolor: alpha(accentBlue, 0.1) } }}
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <Typography variant="caption" sx={{ color: textSecondary }}>\u2014</Typography>
      ),
  };

  // ── Column sets ──────────────────────────────────────────────────
  const normalColumns = [
    actionCol,
    tenantCol,
    { field: "unitId", headerName: "Unit", width: 100 },
    readingCol,
    consumptionCol,
    periodCol,
    { field: "readBy", headerName: "Read By", width: 160 },
    meterPhotoCol,
    {
      field: "abnormalReading",
      headerName: "Abnormal",
      width: 110,
      renderCell: (params) =>
        params.value ? (
          <Chip label="Yes" size="small" sx={{ bgcolor: alpha(accentOrange, 0.12), color: accentOrange, border: `1px solid ${accentOrange}`, fontWeight: 700, fontSize: "0.68rem" }} />
        ) : (
          <Chip label="No"  size="small" sx={{ bgcolor: alpha(accentGreen, 0.12), color: accentGreen, border: `1px solid ${accentGreen}`, fontWeight: 700, fontSize: "0.68rem" }} />
        ),
    },
    dateCol,
  ];

  const abnormalColumns = [
    actionCol,
    tenantCol,
    { field: "unitId", headerName: "Unit", width: 100 },
    readingCol,
    consumptionCol,
    periodCol,
    { field: "readBy", headerName: "Read By", width: 160 },
    meterPhotoCol,
    {
      field: "reviewed",
      headerName: "Reviewed",
      width: 115,
      renderCell: (params) =>
        params.value ? (
          <Chip label="Yes" size="small" sx={{ bgcolor: alpha(accentGreen, 0.12), color: accentGreen, border: `1px solid ${accentGreen}`, fontWeight: 700, fontSize: "0.68rem" }} />
        ) : (
          <Chip label="No"  size="small" sx={{ bgcolor: alpha(accentOrange, 0.12), color: accentOrange, border: `1px solid ${accentOrange}`, fontWeight: 700, fontSize: "0.68rem" }} />
        ),
    },
    {
      field: "resolved",
      headerName: "Resolved",
      width: 115,
      renderCell: (params) =>
        params.value ? (
          <Chip label="Yes" size="small" sx={{ bgcolor: alpha(accentGreen, 0.12), color: accentGreen, border: `1px solid ${accentGreen}`, fontWeight: 700, fontSize: "0.68rem" }} />
        ) : (
          <Chip label="Pending" size="small" sx={{ bgcolor: alpha("#f44336", 0.12), color: "#f44336", border: "1px solid #f44336", fontWeight: 700, fontSize: "0.68rem" }} />
        ),
    },
    {
      field: "reviewNotes",
      headerName: "Review Notes",
      width: 240,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: params.value === "N/A" ? textSecondary : textPrimary, fontStyle: params.value === "N/A" ? "italic" : "normal" }}>
          {params.value}
        </Typography>
      ),
    },
    dateCol,
  ];

  // ── Derived values ───────────────────────────────────────────────
  const isAbnormalTab  = tabValue === 1;
  const activeRows     = isAbnormalTab ? abnormalRows   : normalRows;
  const activeRowCount = isAbnormalTab ? abnormalRowCount : normalRowCount;
  const activeColumns  = isAbnormalTab ? abnormalColumns : normalColumns;
  const totalPages     = Math.ceil(activeRowCount / paginationModel.pageSize) || 1;

  const dataGridSx = {
    border: "none",
    color: textPrimary,
    flex: 1,
    "& .MuiDataGrid-columnHeaders": {
      bgcolor: headerBg,
      borderBottom: `1px solid ${borderColor}`,
      minHeight: "44px !important",
      maxHeight: "44px !important",
    },
    "& .MuiDataGrid-columnHeaderTitle": {
      fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", color: textSecondary,
    },
    "& .MuiDataGrid-row": {
      borderBottom: `1px solid ${borderColor}`,
      transition: "background 0.15s ease",
      "&:hover": { bgcolor: isDark ? alpha("#fff", 0.035) : alpha("#000", 0.018) },
    },
    "& .MuiDataGrid-cell": {
      borderBottom: "none", display: "flex", alignItems: "center", fontSize: "0.85rem", overflow: "hidden",
    },
    "& .MuiDataGrid-footerContainer": {
      bgcolor: headerBg, borderTop: `1px solid ${borderColor}`, color: textPrimary, minHeight: 48,
    },
    "& .MuiCheckbox-root": { color: textSecondary },
    "& .MuiDataGrid-columnSeparator": { color: borderColor },
    "& .MuiTablePagination-root": { color: textPrimary },
    "& .MuiTablePagination-selectIcon": { color: textSecondary },
    "& .MuiTablePagination-actions button": { color: textSecondary },
    "& .MuiDataGrid-virtualScroller": {
      "&::-webkit-scrollbar": { width: 6, height: 6 },
      "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
      "&::-webkit-scrollbar-thumb": {
        bgcolor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.14)",
        borderRadius: 3,
      },
    },
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: surfaceBg, p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>

      {/* Page Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 46, height: 46, borderRadius: 2,
              bgcolor: alpha(accentBlue, 0.12),
              border: `1px solid ${alpha(accentBlue, 0.2)}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <WaterDropIcon sx={{ color: accentBlue, fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: textPrimary, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              Water Readings
            </Typography>
            <Typography variant="caption" sx={{ color: textSecondary }}>
              {activeRowCount.toLocaleString()} {isAbnormalTab ? "abnormal" : "normal"} records
            </Typography>
          </Box>
        </Box>
        <Button
          component={Link}
          to="/water-readings/create"
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
          sx={{
            bgcolor: accentGreen, color: "#fff", textTransform: "none", fontWeight: 600, borderRadius: 1.5, px: 2,
            boxShadow: `0 2px 10px ${alpha(accentGreen, 0.35)}`,
            "&:hover": { bgcolor: theme.palette.greenAccent.dark || accentGreen, boxShadow: `0 4px 18px ${alpha(accentGreen, 0.45)}` },
          }}
        >
          Create Reading
        </Button>
      </Box>

      {/* Summary Stats */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {[
          { label: "Normal Readings",   value: normalRowCount.toLocaleString(),   color: accentGreen },
          { label: "Abnormal Readings", value: abnormalRowCount.toLocaleString(), color: accentOrange },
          { label: "Page",              value: `${paginationModel.page + 1} / ${totalPages}`, color: accentBlue },
        ].map((s) => (
          <Paper
            key={s.label}
            elevation={0}
            sx={{
              px: 2.5, py: 1.5, borderRadius: 2,
              border: `1px solid ${borderColor}`, bgcolor: cardBg, minWidth: 150,
              display: "flex", flexDirection: "column", gap: 0.25,
            }}
          >
            <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {s.label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: s.color, lineHeight: 1.3 }}>
              {s.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Search Toolbar */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2 }, borderRadius: 2,
          border: `1px solid ${borderColor}`, bgcolor: cardBg,
          display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap",
        }}
      >
        <TextField
          placeholder="Search by name or phone\u2026"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: textSecondary, fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: "1 1 240px", maxWidth: 380,
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              bgcolor: isDark ? alpha("#fff", 0.04) : alpha("#000", 0.02),
              "& fieldset": { borderColor },
              "&:hover fieldset": { borderColor: accentGreen },
              "&.Mui-focused fieldset": { borderColor: accentGreen, borderWidth: 1.5 },
            },
            "& .MuiInputBase-input": { color: textPrimary, fontSize: "0.875rem" },
          }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          size="small"
          sx={{
            bgcolor: accentGreen, color: "#fff", textTransform: "none", fontWeight: 600,
            borderRadius: 1.5, px: 2.5, boxShadow: "none",
            "&:hover": { bgcolor: theme.palette.greenAccent.dark || accentGreen, boxShadow: "none" },
          }}
        >
          Search
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => { setSearchQuery(""); fetchAllWaterReadings(0, paginationModel.pageSize); }}
          sx={{
            borderColor, color: textSecondary, textTransform: "none", fontWeight: 500, borderRadius: 1.5,
            "&:hover": { borderColor: accentGreen, color: accentGreen, bgcolor: alpha(accentGreen, 0.06) },
          }}
        >
          Clear
        </Button>
      </Paper>

      {/* Data Table Card */}
      <Paper
        elevation={0}
        sx={{
          flex: 1, borderRadius: 2, border: `1px solid ${borderColor}`, bgcolor: cardBg,
          overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 540,
        }}
      >
        {/* Tabs */}
        <Box sx={{ borderBottom: `1px solid ${borderColor}`, bgcolor: headerBg }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              px: 2,
              "& .MuiTab-root": {
                color: textSecondary, textTransform: "none", fontWeight: 600, fontSize: "0.85rem",
                minHeight: 44, px: 2,
              },
              "& .MuiTab-root.Mui-selected": { color: accentGreen },
              "& .MuiTabs-indicator": { backgroundColor: accentGreen, height: 2 },
            }}
          >
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Normal
                  <Chip
                    label={normalRowCount.toLocaleString()}
                    size="small"
                    sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, bgcolor: alpha(accentGreen, 0.12), color: accentGreen }}
                  />
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <WarningAmberIcon sx={{ fontSize: 15 }} />
                  Abnormal
                  <Chip
                    label={abnormalRowCount.toLocaleString()}
                    size="small"
                    sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, bgcolor: alpha(accentOrange, 0.12), color: accentOrange }}
                  />
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* Table header bar */}
        <Box
          sx={{
            px: 2.5, py: 1.25, bgcolor: cardBg,
            borderBottom: `1px solid ${borderColor}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: textPrimary, letterSpacing: "0.02em" }}>
            {isAbnormalTab ? "Abnormal" : "Normal"} Readings
          </Typography>
          {!loading && (
            <Chip
              label={`${activeRowCount.toLocaleString()} records`}
              size="small"
              sx={{
                bgcolor: isAbnormalTab ? alpha(accentOrange, 0.12) : alpha(accentGreen, 0.12),
                color: isAbnormalTab ? accentOrange : accentGreen,
                fontWeight: 600, fontSize: "0.7rem", height: 22,
              }}
            />
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 2, py: 10 }}>
            <CircularProgress size={44} thickness={4} sx={{ color: accentBlue }} />
            <Typography variant="body2" sx={{ color: textSecondary }}>Loading water readings\u2026</Typography>
          </Box>
        ) : errorMessage && activeRows.length === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 1.5, py: 10 }}>
            <ErrorOutlineIcon sx={{ color: "#f44336", fontSize: 48 }} />
            <Typography variant="body1" sx={{ color: "#f44336", fontWeight: 600 }}>{errorMessage}</Typography>
            <Button
              variant="outlined" size="small"
              onClick={() => fetchAllWaterReadings(paginationModel.page, paginationModel.pageSize)}
              sx={{ borderColor: accentGreen, color: accentGreen, textTransform: "none", mt: 1, borderRadius: 1.5, "&:hover": { bgcolor: alpha(accentGreen, 0.08) } }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <DataGrid
            rows={activeRows}
            columns={activeColumns}
            getRowId={(row) => row.id}
            paginationMode="server"
            rowCount={activeRowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 50]}
            disableRowSelectionOnClick
            rowHeight={62}
            components={{
              Toolbar: () => (
                <GridToolbarContainer sx={{ px: 2, py: 0.5, borderBottom: `1px solid ${borderColor}` }}>
                  <GridToolbarExport sx={{ color: textSecondary, fontSize: "0.8rem", textTransform: "none" }} />
                </GridToolbarContainer>
              ),
            }}
            sx={dataGridSx}
          />
        )}
      </Paper>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => { setOpenSnackbar(false); setErrorMessage(""); }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity="error" sx={{ width: "100%" }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
