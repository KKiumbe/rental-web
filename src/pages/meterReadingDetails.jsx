import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Fade,
  IconButton,
  Modal,
  TextField,
  Snackbar,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import EditIcon from "@mui/icons-material/Edit";
import { useAuthStore } from "../store/authStore";
import TitleComponent from "../components/title";
import { getTheme } from "../store/theme";
import axios from "axios";
import { format } from "date-fns";

const MeterReadingDetails = () => {
  const { id } = useParams();
  const [reading, setReading] = useState(null);
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anomalyModalOpen, setAnomalyModalOpen] = useState(false);
  const [valuesModalOpen, setValuesModalOpen] = useState(false);
  const [anomalyDetails, setAnomalyDetails] = useState({
    reviewed: false,
    reviewNotes: "",
    resolved: false,
    action: "",
  });
  const [readingValues, setReadingValues] = useState({
    reading: "",
    consumption: "",
    meterPhotoUrl: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");

  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const theme = getTheme();
  const BASEURL = import.meta.env.VITE_BASE_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const fetchReadingDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try normal reading endpoint first
        try {
          const response = await axios.get(`${BASEURL}/meter-reading/normal/${id}`, {
            params: { tenantId: currentUser?.tenantId },
            withCredentials: true,
          });
          setReading(response.data.data);
          setIsAbnormal(false);
          setReadingValues({
            reading: response.data.data.reading.toString(),
            consumption: response.data.data.consumption.toString(),
            meterPhotoUrl: response.data.data.meterPhotoUrl || "",
          });
        } catch (normalErr) {
          // If normal reading fails with 404, try abnormal endpoint
          if (normalErr.response?.status === 404) {
            const response = await axios.get(`${BASEURL}/meter-reading/abnormal/${id}`, {
              params: { tenantId: currentUser?.tenantId },
              withCredentials: true,
            });
            setReading(response.data.data);
            setIsAbnormal(true);
            setReadingValues({
              reading: response.data.data.reading.toString(),
              consumption: response.data.data.consumption.toString(),
              meterPhotoUrl: response.data.data.meterPhotoUrl || "",
            });
            setAnomalyDetails({
              reviewed: response.data.data.reviewed || false,
              reviewNotes: response.data.data.reviewNotes || "",
              resolved: response.data.data.resolved || false,
              action: response.data.data.action || "",
            });
          } else {
            throw normalErr;
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch meter reading details.");
        console.error("Error fetching meter reading details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.tenantId) {
      fetchReadingDetails();
    }
  }, [id, currentUser, BASEURL, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleAnomalyModalOpen = () => {
    setAnomalyModalOpen(true);
    setSnackbarOpen(false);
  };

  const handleValuesModalOpen = () => {
    setValuesModalOpen(true);
    setSnackbarOpen(false);
  };

  const handleModalClose = () => {
    setAnomalyModalOpen(false);
    setValuesModalOpen(false);
    setSnackbarOpen(false);
  };

  const handleAnomalyInputChange = (field) => (e) => {
    setAnomalyDetails((prev) => ({
      ...prev,
      [field]: field === "reviewNotes" || field === "action" ? e.target.value : e.target.checked,
    }));
  };

  const handleValuesInputChange = (field) => (e) => {
    setReadingValues((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const validateReadingValues = () => {
    const errors = {};
    if (!readingValues.reading || isNaN(parseFloat(readingValues.reading)) || parseFloat(readingValues.reading) < 0) {
      errors.reading = "Reading must be a non-negative number";
    }
    if (
      !readingValues.consumption ||
      isNaN(parseFloat(readingValues.consumption)) ||
      parseFloat(readingValues.consumption) < 0
    ) {
      errors.consumption = "Consumption must be a non-negative number";
    }
    return errors;
  };

  const handleUpdateAnomaly = async () => {
    setUpdateLoading(true);
    try {
      const response = await axios.put(
        `${BASEURL}/meter-reading/abnormal/${id}`,
        anomalyDetails,
        { withCredentials: true }
      );
      setReading((prev) => ({
        ...prev,
        reviewed: response.data.data.reviewed,
        reviewNotes: response.data.data.reviewNotes,
        resolved: response.data.data.resolved,
        action: response.data.data.action,
      }));
      setAnomalyModalOpen(false);
      setSnackbarMessage("Anomaly details updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update anomaly details.";
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      console.error("Error updating anomaly details:", error);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUpdateValues = async () => {
    const validationErrors = validateReadingValues();
    if (Object.keys(validationErrors).length > 0) {
      setSnackbarMessage(validationErrors.reading || validationErrors.consumption);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    setUpdateLoading(true);
    try {
      const payload = {
        reading: parseFloat(readingValues.reading),
        consumption: parseFloat(readingValues.consumption),
        meterPhotoUrl: readingValues.meterPhotoUrl || null,
      };
      const endpoint = isAbnormal
        ? `${BASEURL}/meter-reading/abnormal/${id}/values`
        : `${BASEURL}/meter-reading/normal/${id}/values`;
      const response = await axios.put(endpoint, payload, { withCredentials: true });
      setReading((prev) => ({
        ...prev,
        reading: response.data.data.reading,
        consumption: response.data.data.consumption,
        meterPhotoUrl: response.data.data.meterPhotoUrl,
      }));
      setValuesModalOpen(false);
      setSnackbarMessage("Meter reading values updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update meter reading values.";
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      console.error("Error updating meter reading values:", error);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Calculate how many times the consumption exceeds the average
  const consumptionFactor =
    isAbnormal && reading?.averageConsumption > 0
      ? (reading.consumption / reading.averageConsumption).toFixed(2)
      : null;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress size={60} thickness={4} sx={{ color: theme.palette.greenAccent.main }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3, bgcolor: theme.palette.primary.main }}>
        <TitleComponent title="Meter Reading Details" />
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2, bgcolor: theme.palette.grey[300] }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!reading) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3, bgcolor: theme.palette.primary.main }}>
        <TitleComponent title="Meter Reading Details" />
        <Typography variant="h6" color={theme.palette.grey[100]} align="center">
          No meter reading data available.
        </Typography>
      </Box>
    );
  }

  return (
    <Fade in={!loading}>
      <Box
        sx={{
          maxWidth: 800,
          mx: "auto",
          p: 3,
          mt: 2,
          position: "relative",
          bgcolor: theme.palette.primary.main,
        }}
      >
        <IconButton
          onClick={handleBack}
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

        <TitleComponent title="Meter Reading Details" />

        {isAbnormal && (
          <Alert
            severity="warning"
            sx={{
              mb: 2,
              borderRadius: 2,
              bgcolor: theme.palette.grey[300],
              color: theme.palette.grey[900],
            }}
          >
            This meter reading is flagged as abnormal.
            {consumptionFactor && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Consumption is {consumptionFactor} times the average ({reading.averageConsumption} m³).
              </Typography>
            )}
          </Alert>
        )}

        <Card
          sx={{
            mb: 3,
            borderRadius: 2,
            boxShadow: 3,
            bgcolor: theme.palette.primary.main,
            color: theme.palette.grey[100],
          }}
        >
          <CardHeader
            avatar={<WaterDropIcon sx={{ color: theme.palette.greenAccent.main }} />}
            title="Meter Reading Information"
            titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
            action={
              <Box>
                <IconButton
                  onClick={handleValuesModalOpen}
                  sx={{ color: theme.palette.greenAccent.main }}
                  title="Edit Reading Values"
                  aria-label="Edit reading values"
                >
                  <EditIcon />
                </IconButton>
                {isAbnormal && (
                  <IconButton
                    onClick={handleAnomalyModalOpen}
                    sx={{ color: theme.palette.greenAccent.main }}
                    title="Edit Anomaly Details"
                    aria-label="Edit anomaly details"
                  >
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
            }
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Reading ID
                </Typography>
                <Typography variant="body1">{reading.id}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Type
                </Typography>
                <Chip
                  label={reading.type}
                  sx={{
                    bgcolor: isAbnormal ? "#f44336" : theme.palette.greenAccent.main,
                    color: "#fff",
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Customer
                </Typography>
                <Typography variant="body1">{reading.customerName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Reading
                </Typography>
                <Typography variant="body1">{reading.reading} m³</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Consumption
                </Typography>
                <Typography variant="body1">{reading.consumption} m³</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Average Consumption
                </Typography>
                <Typography variant="body1">
                  {reading.averageConsumption != null ? `${reading.averageConsumption} m³` : "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Period
                </Typography>
                <Typography variant="body1">
                  {reading.period
                    ? format(new Date(reading.period), "MMM yyyy", { timeZone: "Africa/Nairobi" })
                    : "N/A"}
                </Typography>
              </Grid>
              {reading.meterPhotoUrl && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                    Meter Photo
                  </Typography>
                  <Typography variant="body1">
                    <Button
                      component="a"
                      href={reading.meterPhotoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: theme.palette.greenAccent.main }}
                    >
                      View Photo
                    </Button>
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Read By
                </Typography>
                <Typography variant="body1">{reading.readByName || "N/A"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Created At
                </Typography>
                <Typography variant="body1">
                  {reading.createdAt
                    ? format(new Date(reading.createdAt), "dd MMM yyyy, HH:mm:ss", {
                        timeZone: "Africa/Nairobi",
                      })
                    : "N/A"}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {isAbnormal && (
          <Card
            sx={{
              mb: 3,
              borderRadius: 2,
              boxShadow: 3,
              bgcolor: theme.palette.primary.main,
              color: theme.palette.grey[100],
            }}
          >
            <CardHeader
              avatar={<WaterDropIcon sx={{ color: theme.palette.greenAccent.main }} />}
              title="Anomaly Details"
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
              sx={{ bgcolor: theme.palette.grey[300] }}
            />
            <CardContent>
              <Grid container spacing={2}>
                {reading.action && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                      Action
                    </Typography>
                    <Typography variant="body1">{reading.action}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                    Reviewed
                  </Typography>
                  <Chip
                    label={reading.reviewed ? "Yes" : "No"}
                    sx={{
                      bgcolor: reading.reviewed ? theme.palette.greenAccent.main : theme.palette.grey[300],
                      color: reading.reviewed ? "#fff" : theme.palette.grey[100],
                    }}
                    size="small"
                  />
                </Grid>
                {reading.reviewNotes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                      Review Notes
                    </Typography>
                    <Typography variant="body1">{reading.reviewNotes}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                    Resolved
                  </Typography>
                  <Chip
                    label={reading.resolved ? "Yes" : "No"}
                    sx={{
                      bgcolor: reading.resolved ? theme.palette.greenAccent.main : theme.palette.grey[300],
                      color: reading.resolved ? "#fff" : theme.palette.grey[100],
                    }}
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Anomaly Details Modal */}
        <Modal
          open={anomalyModalOpen}
          onClose={handleModalClose}
          aria-labelledby="edit-anomaly-modal"
          sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Box
            sx={{
              bgcolor: theme.palette.primary.main,
              borderRadius: 2,
              p: 3,
              width: 400,
              boxShadow: 24,
              color: theme.palette.grey[100],
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Edit Anomaly Details
            </Typography>
            <TextField
              label="Review Notes"
              value={anomalyDetails.reviewNotes}
              onChange={handleAnomalyInputChange("reviewNotes")}
              fullWidth
              multiline
              rows={4}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: theme.palette.grey[100] } }}
              InputProps={{ style: { color: theme.palette.grey[100] } }}
            />
            <TextField
              label="Action"
              value={anomalyDetails.action}
              onChange={handleAnomalyInputChange("action")}
              fullWidth
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: theme.palette.grey[100] } }}
              InputProps={{ style: { color: theme.palette.grey[100] } }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={anomalyDetails.reviewed}
                  onChange={handleAnomalyInputChange("reviewed")}
                  sx={{ color: theme.palette.greenAccent.main }}
                />
              }
              label="Reviewed"
              sx={{ mb: 2, color: theme.palette.grey[100] }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={anomalyDetails.resolved}
                  onChange={handleAnomalyInputChange("resolved")}
                  sx={{ color: theme.palette.greenAccent.main }}
                />
              }
              label="Resolved"
              sx={{ mb: 2, color: theme.palette.grey[100] }}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleUpdateAnomaly}
                disabled={updateLoading}
                sx={{
                  bgcolor: theme.palette.greenAccent.main,
                  color: "#fff",
                  "&:hover": { bgcolor: theme.palette.greenAccent.main, opacity: 0.9 },
                }}
              >
                {updateLoading ? <CircularProgress size={24} /> : "Save Changes"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleModalClose}
                sx={{
                  borderColor: theme.palette.grey[300],
                  color: theme.palette.grey[100],
                  "&:hover": { borderColor: theme.palette.grey[300], opacity: 0.9 },
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Reading Values Modal */}
        <Modal
          open={valuesModalOpen}
          onClose={handleModalClose}
          aria-labelledby="edit-values-modal"
          sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Box
            sx={{
              bgcolor: theme.palette.primary.main,
              borderRadius: 2,
              p: 3,
              width: 400,
              boxShadow: 24,
              color: theme.palette.grey[100],
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Edit Meter Reading Values
            </Typography>
            <TextField
              label="Reading (m³)"
              value={readingValues.reading}
              onChange={handleValuesInputChange("reading")}
              fullWidth
              type="number"
              sx={{ mb: 2 }}
              error={isNaN(parseFloat(readingValues.reading)) && readingValues.reading !== ""}
              helperText={
                isNaN(parseFloat(readingValues.reading)) && readingValues.reading !== ""
                  ? "Must be a valid number"
                  : ""
              }
              inputProps={{ step: "0.01" }}
              InputLabelProps={{ style: { color: theme.palette.grey[100] } }}
              InputProps={{ style: { color: theme.palette.grey[100] } }}
            />
            <TextField
              label="Consumption (m³)"
              value={readingValues.consumption}
              onChange={handleValuesInputChange("consumption")}
              fullWidth
              type="number"
              sx={{ mb: 2 }}
              error={isNaN(parseFloat(readingValues.consumption)) && readingValues.consumption !== ""}
              helperText={
                isNaN(parseFloat(readingValues.consumption)) && readingValues.consumption !== ""
                  ? "Must be a valid number"
                  : ""
              }
              inputProps={{ step: "0.01" }}
              InputLabelProps={{ style: { color: theme.palette.grey[100] } }}
              InputProps={{ style: { color: theme.palette.grey[100] } }}
            />
            <TextField
              label="Meter Photo URL"
              value={readingValues.meterPhotoUrl}
              onChange={handleValuesInputChange("meterPhotoUrl")}
              fullWidth
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: theme.palette.grey[100] } }}
              InputProps={{ style: { color: theme.palette.grey[100] } }}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleUpdateValues}
                disabled={
                  updateLoading ||
                  isNaN(parseFloat(readingValues.reading)) ||
                  isNaN(parseFloat(readingValues.consumption))
                }
                sx={{
                  bgcolor: theme.palette.greenAccent.main,
                  color: "#fff",
                  "&:hover": { bgcolor: theme.palette.greenAccent.main, opacity: 0.9 },
                }}
              >
                {updateLoading ? <CircularProgress size={24} /> : "Save Changes"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleModalClose}
                sx={{
                  borderColor: theme.palette.grey[300],
                  color: theme.palette.grey[100],
                  "&:hover": { borderColor: theme.palette.grey[300], opacity: 0.9 },
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Modal>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

        <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 3 }}>
          <Button
            variant="outlined"
            sx={{
              borderColor: theme.palette.greenAccent.main,
              color: theme.palette.greenAccent.main,
              borderRadius: 20,
              px: 4,
              "&:hover": {
                borderColor: theme.palette.greenAccent.main,
                bgcolor: theme.palette.greenAccent.main,
                color: "#fff",
              },
            }}
            onClick={() => navigate("/water-readings")}
            aria-label="Back to water readings"
          >
            Back to Water Readings
          </Button>
        </Box>
      </Box>
    </Fade>
  );
};

export default MeterReadingDetails;