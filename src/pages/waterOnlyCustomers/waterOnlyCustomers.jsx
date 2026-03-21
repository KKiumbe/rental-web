import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useTheme } from "@mui/material/styles";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { format, parseISO } from "date-fns";
import AddIcon from "@mui/icons-material/Add";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import TitleComponent from "../../components/title";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// ─── StatCard (copied from customers.jsx) ──────────────────────────────────
const StatCard = ({ icon, label, value, color }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 160,
        p: 2.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        gap: 2,
        bgcolor: theme?.palette?.background?.paper,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${color}18`,
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Paper>
  );
};

// ─── Initial dialog form state ─────────────────────────────────────────────
const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  previousReading: 0,
  currentReading: 0,
  closingBalance: 0,
  status: "ACTIVE",
};

// ─── Main page ─────────────────────────────────────────────────────────────
const WaterOnlyCustomers = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // List state
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [dialogError, setDialogError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // ── Open dialog from ?add=true query param ──────────────────────────────
  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // ── Fetch customers ─────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/water-only-customers`, {
        withCredentials: true,
      });
      setCustomers(res.data.data);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      setSnackbar({
        open: true,
        message: err.response?.data?.message ?? "Failed to load customers",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ── Derived stat card values ─────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: customers.length,
      active: customers.filter((c) => c.status === "ACTIVE").length,
      inactive: customers.filter((c) => c.status === "INACTIVE").length,
      pending: customers.filter((c) => c.status === "PENDING").length,
    }),
    [customers]
  );

  // ── Dialog helpers ───────────────────────────────────────────────────────
  const openDialog = () => {
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setDialogError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setDialogError("");
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ── Client-side validation ───────────────────────────────────────────────
  const validate = () => {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = "First name is required";
    if (!form.lastName.trim()) errors.lastName = "Last name is required";
    if (!form.phoneNumber.trim()) errors.phoneNumber = "Phone number is required";

    const prev = parseFloat(form.previousReading);
    const curr = parseFloat(form.currentReading);
    const bal = parseFloat(form.closingBalance);

    if (isNaN(prev) || prev < 0) errors.previousReading = "Must be a non-negative number";
    if (isNaN(curr) || curr < 0) errors.currentReading = "Must be a non-negative number";
    else if (!isNaN(prev) && curr < prev)
      errors.currentReading = "Must be ≥ previous reading";
    if (isNaN(bal)) errors.closingBalance = "Must be a number";

    return errors;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setDialogError("");
    setSubmitting(true);
    try {
      await axios.post(
        `${BASE_URL}/water-only-customers`,
        {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phoneNumber: form.phoneNumber.trim(),
          previousReading: parseFloat(form.previousReading),
          currentReading: parseFloat(form.currentReading),
          closingBalance: parseFloat(form.closingBalance),
          status: form.status,
        },
        { withCredentials: true }
      );
      closeDialog();
      await fetchCustomers();
      setSnackbar({ open: true, message: "Water customer added successfully", severity: "success" });
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      const msg = err.response?.data?.message ?? "An error occurred";
      if (msg.toLowerCase().includes("already exists")) {
        setFieldErrors((prev) => ({ ...prev, phoneNumber: msg }));
      } else {
        setDialogError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── DataGrid columns ─────────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      field: "name",
      headerName: "Name",
      flex: 1.5,
      minWidth: 160,
      renderCell: ({ row }) => {
        const initials =
          ((row.firstName?.[0] ?? "") + (row.lastName?.[0] ?? "")).toUpperCase() || "?";
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: 14,
                bgcolor: theme.palette.primary.main,
              }}
            >
              {initials}
            </Avatar>
            <Typography variant="body2">
              {row.firstName} {row.lastName}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "phoneNumber",
      headerName: "Phone Number",
      flex: 1,
      minWidth: 130,
    },
    {
      field: "previousReading",
      headerName: "Prev. Reading",
      flex: 1,
      minWidth: 120,
      renderCell: ({ value }) => value != null ? `${value} m³` : '—',
    },
    {
      field: "currentReading",
      headerName: "Curr. Reading",
      flex: 1,
      minWidth: 120,
      renderCell: ({ value }) => value != null ? `${value} m³` : '—',
    },
    {
      field: "consumption",
      headerName: "Consumption",
      flex: 1,
      minWidth: 120,
      // valueGetter needed so CSV export works (renderCell alone doesn't affect export)
      valueGetter: (value, row) => row.currentReading - row.previousReading,
      renderCell: ({ row }) => `${row.currentReading - row.previousReading} m³`,
    },
    {
      field: "closingBalance",
      headerName: "Balance",
      flex: 1,
      minWidth: 110,
      renderCell: ({ value }) => {
        const color =
          value > 0
            ? theme.palette.error.main
            : value < 0
            ? theme.palette.success.main
            : theme.palette.text.primary;
        return (
          <Typography variant="body2" sx={{ color, fontWeight: 600 }}>
            {value != null ? Number(value).toLocaleString() : '—'}
          </Typography>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 110,
      renderCell: ({ value }) => {
        const colorMap = {
          ACTIVE: theme.palette.success.main,
          INACTIVE: theme.palette.text.secondary,
          PENDING: theme.palette.warning.main,
        };
        return (
          <Chip
            label={value}
            size="small"
            sx={{
              bgcolor: `${colorMap[value]}22`,
              color: colorMap[value],
              fontWeight: 600,
              fontSize: 11,
            }}
          />
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Created",
      flex: 1,
      minWidth: 120,
      renderCell: ({ value }) => {
        try {
          return format(parseISO(value), "dd MMM yyyy");
        } catch {
          return value;
        }
      },
    },
  ], [theme]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* Page header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 3 }}>
        <TitleComponent title="Water Only Customers" />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openDialog}
          sx={{ height: 40 }}
        >
          Add Water Customer
        </Button>
      </Box>

      {/* Stat cards */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", px: 3, mb: 3 }}>
        <StatCard label="Total Customers" value={stats.total} color="#1976d2" icon={<PeopleAltIcon />} />
        <StatCard label="Active" value={stats.active} color="#388e3c" icon={<CheckCircleOutlineIcon />} />
        <StatCard label="Inactive" value={stats.inactive} color="#757575" icon={<PauseCircleOutlineIcon />} />
        <StatCard label="Pending" value={stats.pending} color="#f57c00" icon={<HourglassEmptyIcon />} />
      </Box>

      {/* DataGrid */}
      <Box sx={{ px: 3 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <DataGrid
              rows={customers}
              columns={columns}
              getRowId={(row) => row.id}
              autoHeight
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: false } }}
              pageSizeOptions={[25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              sx={{
                border: "none",
                "& .MuiDataGrid-columnHeaders": {
                  bgcolor: theme.palette.background.paper,
                },
              }}
            />
          </Paper>
        )}
      </Box>

      {/* Add Customer Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Water Customer</DialogTitle>
        <DialogContent dividers>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {dialogError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                required
                fullWidth
                value={form.firstName}
                onChange={(e) => handleFormChange("firstName", e.target.value)}
                error={!!fieldErrors.firstName}
                helperText={fieldErrors.firstName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                required
                fullWidth
                value={form.lastName}
                onChange={(e) => handleFormChange("lastName", e.target.value)}
                error={!!fieldErrors.lastName}
                helperText={fieldErrors.lastName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number"
                required
                fullWidth
                value={form.phoneNumber}
                onChange={(e) => handleFormChange("phoneNumber", e.target.value)}
                error={!!fieldErrors.phoneNumber}
                helperText={fieldErrors.phoneNumber}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={form.status}
                  label="Status"
                  onChange={(e) => handleFormChange("status", e.target.value)}
                >
                  <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                  <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                  <MenuItem value="PENDING">PENDING</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Previous Reading (m³)"
                type="number"
                fullWidth
                value={form.previousReading}
                onChange={(e) => handleFormChange("previousReading", e.target.value)}
                error={!!fieldErrors.previousReading}
                helperText={fieldErrors.previousReading}
                inputProps={{ min: 0, step: "any" }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Current Reading (m³)"
                type="number"
                fullWidth
                value={form.currentReading}
                onChange={(e) => handleFormChange("currentReading", e.target.value)}
                error={!!fieldErrors.currentReading}
                helperText={fieldErrors.currentReading}
                inputProps={{ min: 0, step: "any" }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Closing Balance"
                type="number"
                fullWidth
                value={form.closingBalance}
                onChange={(e) => handleFormChange("closingBalance", e.target.value)}
                error={!!fieldErrors.closingBalance}
                helperText={fieldErrors.closingBalance ?? "Negative = credit"}
                inputProps={{ step: "any" }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {submitting ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Shared Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WaterOnlyCustomers;
