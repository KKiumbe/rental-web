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
  Alert,
  Paper,
  alpha,
  Chip,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { getTheme } from "../../store/theme";
import { format } from "date-fns";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import ApartmentIcon from "@mui/icons-material/Apartment";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import SpeedIcon from "@mui/icons-material/Speed";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const DIVISORS = { NORMAL: 1, DIVIDE_1000: 1000, DIVIDE_10000: 10000 };

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
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [meterType, setMeterType] = useState(null); // null = not yet set for this unit

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const BASEURL = import.meta.env.VITE_BASE_URL || "http://localhost:5000/api";
  const theme = getTheme();

  const isDark        = theme.palette.mode === "dark";
  const surfaceBg     = isDark ? "#141824" : "#f4f6fb";
  const cardBg        = isDark ? "#1c2030" : "#ffffff";
  const borderColor   = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const headerBg      = isDark ? "#181d2e" : "#f0f3f9";
  const textPrimary   = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const accentGreen   = theme.palette.greenAccent.main;
  const accentBlue    = theme.palette.blueAccent?.main || "#1976d2";

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 1.5,
      bgcolor: isDark ? alpha("#fff", 0.04) : alpha("#000", 0.02),
      "& fieldset": { borderColor },
      "&:hover fieldset": { borderColor: accentGreen },
      "&.Mui-focused fieldset": { borderColor: accentGreen, borderWidth: 1.5 },
    },
    "& .MuiInputBase-input": { color: textPrimary, fontSize: "0.875rem" },
    "& .MuiInputLabel-root": { color: textSecondary, fontSize: "0.875rem" },
    "& .MuiInputLabel-root.Mui-focused": { color: accentGreen },
    "& .MuiFormHelperText-root": { color: textSecondary },
  };

  const selectSx = {
    borderRadius: 1.5,
    bgcolor: isDark ? alpha("#fff", 0.04) : alpha("#000", 0.02),
    "& .MuiOutlinedInput-notchedOutline": { borderColor },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: accentGreen },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: accentGreen, borderWidth: 1.5 },
    "& .MuiSelect-select": { color: textPrimary, fontSize: "0.875rem" },
    "& .MuiSvgIcon-root": { color: textSecondary },
  };

  // ── Fetchers ─────────────────────────────────────────────────────
  const fetchBuildings = useCallback(async () => {
    try {
      setBuildingsLoading(true);
      const res = await axios.get(`${BASEURL}/buildings`, {
        params: { page: 1, limit: 100 },
        withCredentials: true,
      });
      setBuildings(res.data?.buildings || res.data?.data || []);
    } catch (err) {
      if (err.response?.status === 401) { navigate("/login"); return; }
      showSnackbar("Failed to fetch buildings", "error");
    } finally {
      setBuildingsLoading(false);
    }
  }, [navigate, BASEURL]);

  const fetchLatestReading = useCallback(async (unitId) => {
    try {
      setLatestReadingLoading(true);
      setLatestReading(null);
      const res = await axios.get(`${BASEURL}/water-readings/unit/latest`, {
        params: { unitId },
        withCredentials: true,
      });
      const data = res.data?.latestReading || null;
      setLatestReading(data);
      if (data?.reading != null) {
        setForm((prev) => ({ ...prev, previousReading: String(data.reading) }));
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setLatestReading(null);
      } else if (err.response?.status === 401) {
        navigate("/login");
      } else {
        showSnackbar("Failed to fetch latest reading", "error");
      }
    } finally {
      setLatestReadingLoading(false);
    }
  }, [navigate, BASEURL]);

  // ── Helpers ───────────────────────────────────────────────────────
  const showSnackbar = (msg, severity = "success") => {
    setSnackbarMessage(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errs = {};
    if (!meterType) errs.meterType = "Please select a meter type";
    if (!selectedUnitId) errs.unit = "Please select a unit";
    const prev = form.previousReading !== "" ? parseFloat(form.previousReading) : null;
    const curr = parseFloat(form.currentReading);
    const currM3 = isNaN(curr) ? NaN : curr / divisor;
    if (form.currentReading === "" || isNaN(curr) || curr < 0) {
      errs.currentReading = "Current reading must be a non-negative number";
    } else if (prev !== null && !isNaN(prev) && currM3 < prev) {
      errs.currentReading = "Current reading cannot be less than the previous reading";
    }
    if (form.previousReading !== "" && (isNaN(parseFloat(form.previousReading)) || parseFloat(form.previousReading) < 0)) {
      errs.previousReading = "Previous reading must be a non-negative number";
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setFormLoading(true);
    try {
      const payload = {
        unitId: selectedUnitId,
        reading: parseFloat(form.currentReading) / divisor,   // converted to m³
        meterType,
        ...(form.previousReading !== "" && {
          previousReading: parseFloat(form.previousReading),  // already in m³, no division
        }),
      };
      const res = await axios.post(`${BASEURL}/water-reading`, payload, { withCredentials: true });
      showSnackbar(res.data?.message || "Reading created successfully", "success");
      setSubmitted(true);
    } catch (err) {
      showSnackbar(err.response?.data?.message || "Failed to create water reading", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ previousReading: "", currentReading: "" });
    setSelectedBuildingId("");
    setSelectedUnitId("");
    setLatestReading(null);
    setMeterType(null);
    setErrors({});
    setSubmitted(false);
  };

  // ── Derived ───────────────────────────────────────────────────────
  const divisor = meterType ? (DIVISORS[meterType] ?? 1) : 1;

  const currentM3 =
    form.currentReading !== "" && !isNaN(form.currentReading) && meterType
      ? parseFloat(form.currentReading) / divisor
      : null;

  const previousM3 =
    form.previousReading !== "" && !isNaN(form.previousReading)
      ? parseFloat(form.previousReading)   // always in m³ (auto-filled from API or manually entered)
      : null;

  const consumption =
    currentM3 !== null && previousM3 !== null
      ? (currentM3 - previousM3).toFixed(2)
      : null;

  const selectedUnit = units.find((u) => u.id === selectedUnitId) || null;
  const unitCustomer =
    selectedUnit?.customer ||
    selectedUnit?.customers?.[0] ||
    selectedUnit?.CustomerUnit?.[0]?.customer ||
    null;

  const formReady =
    selectedBuildingId && selectedUnitId && meterType && form.currentReading !== "" && !Object.keys(errors).length;

  // ── Effects ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) { navigate("/login"); return; }
    fetchBuildings();
  }, [currentUser, navigate, fetchBuildings]);

  useEffect(() => {
    if (selectedBuildingId) {
      const building = buildings.find((b) => b.id === selectedBuildingId);
      setUnits(building?.units || []);
    } else {
      setUnits([]);
    }
    setSelectedUnitId("");
    setMeterType(null);
    setForm({ previousReading: "", currentReading: "" });
    setLatestReading(null);
    setErrors({});
  }, [selectedBuildingId, buildings]);

  useEffect(() => {
    if (selectedUnitId) {
      setForm({ previousReading: "", currentReading: "" });
      setErrors({});
      fetchLatestReading(selectedUnitId);
      // Pre-fill meterType from unit data
      const unit = units.find((u) => u.id === selectedUnitId);
      setMeterType(unit?.meterType || null);
    } else {
      setForm({ previousReading: "", currentReading: "" });
      setLatestReading(null);
      setMeterType(null);
    }
  }, [selectedUnitId, fetchLatestReading, units]);

  // ── Render ────────────────────────────────────────────────────────
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
              Create Water Reading
            </Typography>
            <Typography variant="caption" sx={{ color: textSecondary }}>
              Record a new meter reading for a unit
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate("/water-readings")}
          sx={{
            borderColor, color: textSecondary, textTransform: "none", fontWeight: 500, borderRadius: 1.5,
            "&:hover": { borderColor: accentGreen, color: accentGreen, bgcolor: alpha(accentGreen, 0.06) },
          }}
        >
          Back to Readings
        </Button>
      </Box>

      {/* Two-column form layout */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2.5,
          alignItems: "start",
        }}
      >
        {/* ── Left Card: Select Location ── */}
        <Paper
          elevation={0}
          sx={{ borderRadius: 2, border: `1px solid ${borderColor}`, bgcolor: cardBg, overflow: "hidden" }}
        >
          {/* Card header */}
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: headerBg, borderBottom: `1px solid ${borderColor}`, display: "flex", alignItems: "center", gap: 1 }}>
            <ApartmentIcon sx={{ color: accentBlue, fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: textPrimary }}>
              Select Location
            </Typography>
          </Box>

          <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Building selector */}
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel sx={{ color: textSecondary, fontSize: "0.875rem", "&.Mui-focused": { color: accentGreen } }}>
                Building *
              </InputLabel>
              <Select
                value={selectedBuildingId}
                onChange={(e) => setSelectedBuildingId(e.target.value)}
                label="Building *"
                disabled={buildingsLoading}
                sx={selectSx}
              >
                <MenuItem value="">
                  <Typography variant="body2" sx={{ color: textSecondary, fontStyle: "italic" }}>
                    {buildingsLoading ? "Loading buildings\u2026" : "Select a building"}
                  </Typography>
                </MenuItem>
                {buildings.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <ApartmentIcon sx={{ fontSize: 15, color: accentBlue }} />
                      <Typography variant="body2">{b.name || b.buildingName || "Unnamed"}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {buildingsLoading && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75 }}>
                  <CircularProgress size={12} sx={{ color: accentGreen }} />
                  <Typography variant="caption" sx={{ color: textSecondary }}>Loading\u2026</Typography>
                </Box>
              )}
            </FormControl>

            {/* Unit selector */}
            <FormControl fullWidth size="small" variant="outlined" error={!!errors.unit} disabled={!selectedBuildingId}>
              <InputLabel sx={{ color: textSecondary, fontSize: "0.875rem", "&.Mui-focused": { color: accentGreen } }}>
                Unit *
              </InputLabel>
              <Select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                label="Unit *"
                sx={selectSx}
              >
                <MenuItem value="">
                  <Typography variant="body2" sx={{ color: textSecondary, fontStyle: "italic" }}>
                    {!selectedBuildingId ? "Select a building first" : units.length === 0 ? "No units available" : "Select a unit"}
                  </Typography>
                </MenuItem>
                {units.map((unit) => {
                  const customer =
                    unit?.customer ||
                    unit?.customers?.[0] ||
                    unit?.CustomerUnit?.[0]?.customer;
                  const isOccupied = unit.status === "OCCUPIED" || unit.status === "OCCUPIED_PENDING_PAYMENT";
                  const isVacant   = unit.status === "VACANT";
                  return (
                    <MenuItem key={unit.id} value={unit.id}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                        <MeetingRoomIcon sx={{ fontSize: 15, color: isOccupied ? accentGreen : textSecondary }} />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {unit.unitNumber}
                          {isOccupied && customer ? ` \u2014 ${customer.firstName} ${customer.lastName}` : ""}
                        </Typography>
                        <Chip
                          label={isOccupied ? "Occupied" : isVacant ? "Vacant" : "Maintenance"}
                          size="small"
                          sx={{
                            height: 18, fontSize: "0.62rem", fontWeight: 600,
                            bgcolor: isOccupied ? alpha(accentGreen, 0.1) : alpha(textSecondary, 0.08),
                            color: isOccupied ? accentGreen : textSecondary,
                          }}
                        />
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
              {errors.unit && (
                <Typography variant="caption" sx={{ color: "#f44336", mt: 0.5 }}>{errors.unit}</Typography>
              )}
            </FormControl>

            {/* Selected unit info card */}
            {selectedUnit && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.75, borderRadius: 1.5,
                  border: `1px solid ${alpha(accentBlue, 0.2)}`,
                  bgcolor: alpha(accentBlue, 0.04),
                }}
              >
                <Typography variant="caption" sx={{ color: accentBlue, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Selected Unit
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75, mt: 1 }}>
                  {[
                    { label: "Unit", value: selectedUnit.unitNumber || "\u2014" },
                    { label: "Status", value: selectedUnit.status || "\u2014" },
                    { label: "Tenant", value: unitCustomer ? `${unitCustomer.firstName} ${unitCustomer.lastName}` : "Vacant" },
                    { label: "Phone", value: unitCustomer?.phoneNumber || "\u2014" },
                  ].map((row) => (
                    <Box key={row.label}>
                      <Typography variant="caption" sx={{ color: textSecondary, display: "block" }}>{row.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: textPrimary, fontSize: "0.8rem" }}>{row.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}
          </Box>
        </Paper>

        {/* ── Right Card: Reading Details ── */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${borderColor}`,
            bgcolor: cardBg,
            overflow: "hidden",
            opacity: selectedUnitId ? 1 : 0.55,
            pointerEvents: selectedUnitId ? "auto" : "none",
            transition: "opacity 0.2s ease",
          }}
        >
          {/* Card header */}
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: headerBg, borderBottom: `1px solid ${borderColor}`, display: "flex", alignItems: "center", gap: 1 }}>
            <SpeedIcon sx={{ color: accentGreen, fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: textPrimary }}>
              Meter Reading
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}
          >
            {/* Meter Type Selector */}
            <Box>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 0.75 }}>
                Meter Type *
              </Typography>
              <ToggleButtonGroup
                value={meterType}
                exclusive
                onChange={(_, val) => { if (val) { setMeterType(val); setErrors((p) => ({ ...p, meterType: "" })); } }}
                size="small"
                fullWidth
                sx={{
                  "& .MuiToggleButton-root": {
                    borderColor,
                    color: textSecondary,
                    textTransform: "none",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    flex: 1,
                    "&.Mui-selected": {
                      bgcolor: alpha(accentGreen, 0.12),
                      color: accentGreen,
                      borderColor: accentGreen,
                      fontWeight: 700,
                    },
                    "&:hover": { bgcolor: alpha(accentGreen, 0.06) },
                  },
                }}
              >
                <ToggleButton value="NORMAL">Normal</ToggleButton>
                <ToggleButton value="DIVIDE_1000">÷ 1,000</ToggleButton>
                <ToggleButton value="DIVIDE_10000">÷ 10,000</ToggleButton>
              </ToggleButtonGroup>
              {errors.meterType && (
                <Typography variant="caption" sx={{ color: "#f44336", mt: 0.5, display: "block" }}>
                  {errors.meterType}
                </Typography>
              )}
              {!meterType && (
                <Typography variant="caption" sx={{ color: "#ff9800", mt: 0.5, display: "block" }}>
                  Select meter type to continue
                </Typography>
              )}
            </Box>

            {/* Previous reading info */}
            {latestReadingLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
                <CircularProgress size={16} sx={{ color: accentBlue }} />
                <Typography variant="caption" sx={{ color: textSecondary }}>Fetching previous reading\u2026</Typography>
              </Box>
            ) : selectedUnitId ? (
              <Paper
                elevation={0}
                sx={{
                  p: 1.5, borderRadius: 1.5,
                  border: `1px solid ${latestReading ? alpha(accentBlue, 0.2) : alpha("#ff9800", 0.3)}`,
                  bgcolor: latestReading ? alpha(accentBlue, 0.04) : alpha("#ff9800", 0.04),
                  display: "flex", alignItems: "flex-start", gap: 1,
                }}
              >
                <InfoOutlinedIcon sx={{ color: latestReading ? accentBlue : "#ff9800", fontSize: 18, mt: 0.1, flexShrink: 0 }} />
                <Box>
                  {latestReading ? (
                    <>
                      <Typography variant="caption" sx={{ color: textSecondary, display: "block", mb: 0.5 }}>
                        Previous reading on file
                      </Typography>
                      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: textSecondary }}>Reading</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: accentBlue }}>{latestReading.reading} m\u00b3</Typography>
                        </Box>
                        {latestReading.consumption != null && (
                          <Box>
                            <Typography variant="caption" sx={{ color: textSecondary }}>Last Consumption</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: accentGreen }}>{latestReading.consumption} m\u00b3</Typography>
                          </Box>
                        )}
                        {latestReading.period && (
                          <Box>
                            <Typography variant="caption" sx={{ color: textSecondary }}>Period</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: textPrimary }}>
                              {format(new Date(latestReading.period), "MMM yyyy")}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </>
                  ) : (
                    <Typography variant="caption" sx={{ color: "#ff9800" }}>
                      No previous reading found for this unit. Enter 0 as the previous reading if this is the first reading.
                    </Typography>
                  )}
                </Box>
              </Paper>
            ) : null}

            {/* Previous reading field */}
            <TextField
              fullWidth
              label="Previous Reading (m\u00b3) \u2014 optional"
              name="previousReading"
              type="number"
              value={form.previousReading}
              onChange={handleFormChange}
              error={!!errors.previousReading}
              helperText={errors.previousReading || "Auto-filled from last recorded reading. Override if needed."}
              variant="outlined"
              size="small"
              inputProps={{ step: "0.01", min: 0 }}
              InputProps={{
                endAdornment: <InputAdornment position="end"><Typography variant="caption" sx={{ color: textSecondary }}>m\u00b3</Typography></InputAdornment>,
              }}
              sx={fieldSx}
            />

            {/* Current reading field */}
            <TextField
              fullWidth
              label={meterType && meterType !== "NORMAL" ? "Current Reading (raw meter value) *" : "Current Reading (m³) *"}
              name="currentReading"
              type="number"
              value={form.currentReading}
              onChange={handleFormChange}
              error={!!errors.currentReading}
              helperText={
                errors.currentReading ||
                (consumption !== null
                  ? `Consumption: ${consumption} m\u00b3`
                  : "The meter reading taken today")
              }
              variant="outlined"
              size="small"
              inputProps={{ step: "0.01", min: 0 }}
              InputProps={{
                endAdornment: <InputAdornment position="end"><Typography variant="caption" sx={{ color: textSecondary }}>{meterType && meterType !== "NORMAL" ? "raw" : "m\u00b3"}</Typography></InputAdornment>,
              }}
              sx={{
                ...fieldSx,
                "& .MuiFormHelperText-root": {
                  color: consumption !== null && !errors.currentReading ? accentGreen : textSecondary,
                  fontWeight: consumption !== null && !errors.currentReading ? 600 : 400,
                },
              }}
            />

            {/* Consumption summary preview */}
            {formReady && consumption !== null && !submitted && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.75, borderRadius: 1.5,
                  border: `1px solid ${alpha(accentGreen, 0.25)}`,
                  bgcolor: alpha(accentGreen, 0.05),
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Consumption Summary
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: accentGreen, lineHeight: 1.2, mt: 0.25 }}>
                    {consumption} m³
                  </Typography>
                  <Typography variant="caption" sx={{ color: textSecondary }}>
                    {divisor > 1
                      ? `${form.currentReading} ÷ ${divisor.toLocaleString()} = ${currentM3?.toFixed(3)} m³ − ${previousM3?.toFixed(3)} m³`
                      : `${previousM3?.toFixed(3)} → ${currentM3?.toFixed(3)} m³`}
                  </Typography>
                </Box>
                <WaterDropIcon sx={{ color: alpha(accentGreen, 0.35), fontSize: 36 }} />
              </Paper>
            )}

            {/* Success state */}
            {submitted ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2, borderRadius: 1.5, textAlign: "center",
                    border: `1px solid ${alpha(accentGreen, 0.3)}`,
                    bgcolor: alpha(accentGreen, 0.06),
                  }}
                >
                  <CheckCircleIcon sx={{ color: accentGreen, fontSize: 36, mb: 0.5 }} />
                  <Typography variant="body1" sx={{ fontWeight: 700, color: accentGreen }}>Reading Recorded</Typography>
                  <Typography variant="caption" sx={{ color: textSecondary }}>{snackbarMessage}</Typography>
                </Paper>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleReset}
                    sx={{
                      borderColor: accentGreen, color: accentGreen, textTransform: "none", fontWeight: 600,
                      borderRadius: 1.5,
                      "&:hover": { bgcolor: alpha(accentGreen, 0.06) },
                    }}
                  >
                    Record Another
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate("/water-readings")}
                    sx={{
                      bgcolor: accentGreen, color: "#fff", textTransform: "none", fontWeight: 600,
                      borderRadius: 1.5, boxShadow: `0 2px 10px ${alpha(accentGreen, 0.35)}`,
                      "&:hover": { bgcolor: theme.palette.greenAccent.dark || accentGreen },
                    }}
                  >
                    View All Readings
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", gap: 1.5, pt: 0.5 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={formLoading || !selectedUnitId || !meterType}
                  fullWidth
                  sx={{
                    bgcolor: accentGreen, color: "#fff", textTransform: "none", fontWeight: 600,
                    borderRadius: 1.5, boxShadow: `0 2px 10px ${alpha(accentGreen, 0.35)}`,
                    "&:hover": { bgcolor: theme.palette.greenAccent.dark || accentGreen, boxShadow: `0 4px 18px ${alpha(accentGreen, 0.45)}` },
                    "&.Mui-disabled": { bgcolor: alpha(accentGreen, 0.35), color: "#fff" },
                  }}
                >
                  {formLoading ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={16} sx={{ color: "#fff" }} />
                      <span>Creating\u2026</span>
                    </Box>
                  ) : (
                    "Create Reading"
                  )}
                </Button>
                <Tooltip title="Cancel and go back">
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/water-readings")}
                    fullWidth
                    sx={{
                      borderColor, color: textSecondary, textTransform: "none", fontWeight: 500,
                      borderRadius: 1.5,
                      "&:hover": { borderColor: "#f44336", color: "#f44336", bgcolor: alpha("#f44336", 0.04) },
                    }}
                  >
                    Cancel
                  </Button>
                </Tooltip>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
