import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Snackbar,
  IconButton,
  Paper,
  Divider,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { getTheme } from "../../store/theme";
import { format } from "date-fns";


export default function CreateWaterReading() {
  const [form, setForm] = useState({ previousReading: "", currentReading: "" });
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [units, setUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [latestReading, setLatestReading] = useState(null);
  const [latestReadingLoading, setLatestReadingLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [errors, setErrors] = useState({ currentReading: "" });

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const BASEURL = import.meta.env.VITE_BASE_URL || "http://localhost:5000/api";
  const theme = getTheme();

  // Fetch buildings (units + customers are embedded in the response)
  const fetchBuildings = useCallback(async () => {
    try {
      setBuildingsLoading(true);
      const response = await axios.get(`${BASEURL}/buildings`, {
        params: { page: 1, limit: 100 },
        withCredentials: true,
      });
      const data = response.data?.buildings || response.data?.data || [];
      setBuildings(data);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setSnackbarMessage("Failed to fetch buildings");
        setSnackbarOpen(true);
      }
    } finally {
      setBuildingsLoading(false);
    }
  }, [navigate, BASEURL]);

  // Fetch the latest water reading for the selected unit
  const fetchLatestReading = useCallback(async (unitId) => {
    try {
      setLatestReadingLoading(true);
      setLatestReading(null);
      const response = await axios.get(`${BASEURL}/water-readings/unit/latest`, {
        params: { unitId },
        withCredentials: true,
      });
      const data = response.data?.data || response.data || null;
      setLatestReading(data);
      // Pre-fill previous reading field with the latest meter reading value
      if (data?.reading !== undefined && data?.reading !== null) {
        setForm((prev) => ({ ...prev, previousReading: String(data.reading) }));
      }
    } catch (err) {
      if (err.response?.status === 404) {
        // No previous reading — that's fine, leave field empty
        setLatestReading(null);
      } else if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setSnackbarMessage("Failed to fetch latest reading");
        setSnackbarOpen(true);
      }
    } finally {
      setLatestReadingLoading(false);
    }
  }, [navigate, BASEURL]);

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!selectedUnitId) {
      newErrors.unit = "Please select a unit";
    }
    const prev = form.previousReading !== "" ? parseFloat(form.previousReading) : null;
    const curr = parseFloat(form.currentReading);
    if (form.currentReading === "" || isNaN(curr) || curr < 0) {
      newErrors.currentReading = "Current reading must be a non-negative number";
    } else if (prev !== null && !isNaN(prev) && curr < prev) {
      newErrors.currentReading = "Current reading cannot be less than previous reading";
    }
    if (form.previousReading !== "" && (isNaN(parseFloat(form.previousReading)) || parseFloat(form.previousReading) < 0)) {
      newErrors.previousReading = "Previous reading must be a non-negative number";
    }
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        unitId: selectedUnitId,
        reading: parseFloat(form.currentReading),
        ...(form.previousReading !== "" && { previousReading: parseFloat(form.previousReading) }),
      };
      console.log("Submitting payload:", payload);
      const response = await axios.post(`${BASEURL}/water-reading`, payload, {
        withCredentials: true,
      });

      setSnackbarMessage(response.data.message || "Reading created successfully");
      setSnackbarOpen(true);
      setForm({ previousReading: "", currentReading: "" });
      setSelectedBuildingId("");
      setSelectedUnitId("");
      setLatestReading(null);
      setErrors({ currentReading: "" });
      setTimeout(() => navigate("/water-readings"), 2000);
    } catch (error) {
      console.error("Submission error:", error.response?.data);
      setSnackbarMessage(
        error.response?.data?.message || "Failed to create water reading"
      );
      setSnackbarOpen(true);
    } finally {
      setFormLoading(false);
    }
  };

  // Fetch buildings on mount if authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    fetchBuildings();
  }, [currentUser, navigate, fetchBuildings]);

  // Pull units from the already-fetched buildings array when building selection changes
  useEffect(() => {
    if (selectedBuildingId) {
      const building = buildings.find((b) => b.id === selectedBuildingId);
      setUnits(building?.units || []);
      setSelectedUnitId("");
      setForm({ previousReading: "", currentReading: "" });
      setLatestReading(null);
    } else {
      setUnits([]);
      setSelectedUnitId("");
      setForm({ previousReading: "", currentReading: "" });
      setLatestReading(null);
    }
  }, [selectedBuildingId, buildings]);

  // Fetch latest reading when unit is selected
  useEffect(() => {
    if (selectedUnitId) {
      setForm({ previousReading: "", currentReading: "" });
      fetchLatestReading(selectedUnitId);
    } else {
      setForm({ previousReading: "", currentReading: "" });
      setLatestReading(null);
    }
  }, [selectedUnitId, fetchLatestReading]);

  return (
    <Box sx={{ p: 3, bgcolor: theme.palette.primary.main, minHeight: "100vh" }}>
      <IconButton
        onClick={() => navigate("/water-readings")}
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

      <Typography variant="h4" sx={{ mb: 3, color: theme.palette.grey[100], textAlign: "center" }}>
        Create New Water Reading
      </Typography>

      <Paper
        sx={{
          maxWidth: 600,
          mx: "auto",
          p: 3,
          bgcolor: theme.palette.primary.main,
          borderRadius: 1,
          boxShadow: 24,
        }}
      >
        {formLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <CircularProgress size={24} sx={{ color: theme.palette.greenAccent.main }} />
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormControl
              fullWidth
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            >
              <InputLabel>Building *</InputLabel>
              <Select
                value={selectedBuildingId}
                onChange={(e) => setSelectedBuildingId(e.target.value)}
                label="Building *"
                disabled={buildingsLoading}
              >
                <MenuItem value="">
                  <em>{buildingsLoading ? "Loading buildings..." : "Select a building"}</em>
                </MenuItem>
                {buildings.map((building) => (
                  <MenuItem key={building.id} value={building.id}>
                    {building.name || building.buildingName || "Unnamed"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl
              fullWidth
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
              error={!!errors.unit}
            >
              <InputLabel>Unit *</InputLabel>
              <Select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                label="Unit *"
                disabled={formLoading || !selectedBuildingId}
              >
                <MenuItem value="">
                  <em>
                    {units.length === 0 ? "No units available" : "Select a unit"}
                  </em>
                </MenuItem>
                {units.map((unit) => {
                  const customer = unit?.customer || unit?.customers?.[0] || unit?.CustomerUnit?.[0]?.customer;
                  return (
                    <MenuItem
                      key={unit.id}
                      value={unit.id}
                      sx={{
                        color:
                          unit.status === "VACANT" || unit.status === "MAINTENANCE"
                            ? "grey.500"
                            : "inherit",
                      }}
                    >
                      {unit.unitNumber}{" "}
                      {unit.status === "OCCUPIED" || unit.status === "OCCUPIED_PENDING_PAYMENT"
                        ? customer
                          ? `(${customer.firstName} ${customer.lastName})`
                          : "(Occupied)"
                        : unit.status === "VACANT"
                        ? "(Vacant)"
                        : "(Maintenance)"}
                    </MenuItem>
                  );
                })}
              </Select>
              {errors.unit && (
                <Typography color="error" variant="caption">
                  {errors.unit}
                </Typography>
              )}
            </FormControl>

            {/* Previous reading info card */}
            {latestReadingLoading && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <CircularProgress size={16} sx={{ color: theme.palette.greenAccent.main }} />
                <Typography variant="caption" sx={{ color: theme.palette.grey[400] }}>
                  Fetching previous reading...
                </Typography>
              </Box>
            )}

            {!latestReadingLoading && selectedUnitId && form.customerId && (
              <Alert
                severity={latestReading ? "info" : "warning"}
                sx={{ mb: 2, fontSize: "0.82rem" }}
              >
                {latestReading ? (
                  <>
                    <strong>Last Reading:</strong> {latestReading.reading} m³ &nbsp;|&nbsp;
                    <strong>Consumption:</strong> {latestReading.consumption ?? "—"} m³ &nbsp;|&nbsp;
                    <strong>Period:</strong>{" "}
                    {latestReading.period
                      ? format(new Date(latestReading.period), "MMM yyyy")
                      : "—"}
                  </>
                ) : (
                  "No previous reading found for this unit. Enter 0 as the previous reading if this is the first reading."
                )}
              </Alert>
            )}

            <Divider sx={{ mb: 2, borderColor: theme.palette.grey[700] }} />

            <TextField
              fullWidth
              label="Previous Reading (m³) — optional"
              name="previousReading"
              type="number"
              value={form.previousReading}
              onChange={handleFormChange}
              error={!!errors.previousReading}
              helperText={errors.previousReading || "Auto-filled from last recorded reading. Override if needed."}
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
              inputProps={{ step: "0.01", min: 0 }}
            />

            <TextField
              fullWidth
              label="Current Reading (m³) *"
              name="currentReading"
              type="number"
              value={form.currentReading}
              onChange={handleFormChange}
              error={!!errors.currentReading}
              helperText={
                errors.currentReading ||
                (form.previousReading !== "" && form.currentReading !== "" &&
                !isNaN(form.previousReading) && !isNaN(form.currentReading)
                  ? `Consumption: ${(parseFloat(form.currentReading) - parseFloat(form.previousReading)).toFixed(2)} m³`
                  : "The meter reading taken today")
              }
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
              inputProps={{ step: "0.01", min: 0 }}
            />

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  bgcolor: theme.palette.greenAccent.main,
                  color: "#fff",
                  "&:hover": { bgcolor: theme.palette.greenAccent.main, opacity: 0.9 },
                }}
                disabled={formLoading}
                fullWidth
              >
                {formLoading ? "Creating..." : "Create Reading"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate("/water-readings")}
                sx={{
                  color: theme.palette.grey[300],
                  borderColor: theme.palette.grey[300],
                  "&:hover": { borderColor: theme.palette.grey[300], opacity: 0.9 },
                }}
                fullWidth
              >
                Cancel
              </Button>
            </Box>
          </form>
        )}
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}