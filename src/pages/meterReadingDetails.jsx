import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Divider,
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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAuthStore, useThemeStore } from "../store/authStore";
import TitleComponent from "../components/title";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import EditIcon from "@mui/icons-material/Edit";
import { getTheme } from "../store/theme";
import axios from "axios";

const MeterReadingDetails = () => {
  const { id } = useParams();
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anomalyModalOpen, setAnomalyModalOpen] = useState(false);
  const [valuesModalOpen, setValuesModalOpen] = useState(false);
  const [anomalyDetails, setAnomalyDetails] = useState({
    reviewed: false,
    reviewNotes: "",
    resolved: false,
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
  const { darkMode } = useThemeStore();
  const navigate = useNavigate();
  const theme = getTheme(darkMode ? "dark" : "light");
  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const fetchReadingDetails = async () => {
      try {
        const response = await axios.get(`${BASEURL}/meter-reading/${id}`, {
          params: { tenantId: currentUser?.tenantId },
          withCredentials: true,
        });
        setReading(response.data.data);
        setReadingValues({
          reading: response.data.data.reading.toString(),
          consumption: response.data.data.consumption.toString(),
          meterPhotoUrl: response.data.data.meterPhotoUrl || "",
        });
        if (response.data.data.isAbnormal) {
          setAnomalyDetails({
            reviewed: response.data.data.anomalyDetails?.reviewed || false,
            reviewNotes: response.data.data.anomalyDetails?.reviewNotes || "",
            resolved: response.data.data.anomalyDetails?.resolved || false,
          });
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
      [field]: field === "reviewNotes" ? e.target.value : e.target.checked,
    }));
  };

  const handleValuesInputChange = (field) => (e) => {
    setReadingValues((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleUpdateAnomaly = async () => {
    setUpdateLoading(true);
    try {
      const response = await axios.put(
        `${BASEURL}/meter-reading/${id}`,
        anomalyDetails,
        { withCredentials: true }
      );
      setReading((prev) => ({
        ...prev,
        anomalyDetails: { ...prev.anomalyDetails, ...anomalyDetails },
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
    setUpdateLoading(true);
    try {
      const payload = {
        reading: parseFloat(readingValues.reading),
        consumption: parseFloat(readingValues.consumption),
        meterPhotoUrl: readingValues.meterPhotoUrl || null,
      };
      if (isNaN(payload.reading) || isNaN(payload.consumption)) {
        throw new Error("Reading and consumption must be valid numbers.");
      }
      const response = await axios.put(
        `${BASEURL}/meter-reading/${id}/values`,
        payload,
        { withCredentials: true }
      );
      setReading((prev) => ({
        ...prev,
        reading: payload.reading,
        consumption: payload.consumption,
        meterPhotoUrl: payload.meterPhotoUrl,
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
  const consumptionFactor = reading?.isAbnormal && reading?.averageConsumption > 0
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
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
        <TitleComponent title="Meter Reading Details" />
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2, bgcolor: theme.palette.grey[300] }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!reading) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
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
          width: "100%",
          mx: "auto",
          p: 3,
          mt: 2,
          ml: 20,
          position: "relative",
        }}
      >
        <IconButton
          onClick={handleBack}
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            color: theme.palette.greenAccent.main,
            "&:hover": {
              bgcolor: theme.palette.greenAccent.main + "20",
            },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 40 }} />
        </IconButton>

        <TitleComponent title="Meter Reading Details" />

        {reading.isAbnormal && (
          <Alert
            severity="warning"
            sx={{
              mb: 2,
              borderRadius: 2,
              bgcolor: theme.palette.grey[300],
              color: theme.palette.grey[900],
              width: "50%",
              ml: 20,
            }}
          >
            You need to manually intervene and update the meter reading because the consumption has been flagged as abnormal.
            {consumptionFactor && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Consumption is {consumptionFactor} times the average.
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
            width: "50%",
            ml: 20,
          }}
        >
          <CardHeader
            avatar={<WaterDropIcon sx={{ color: theme.palette.greenAccent.main }} />}
            title="Meter Reading Information"
            titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
            action={
              reading.isAbnormal && (
                <Box>
                  <IconButton
                    onClick={handleAnomalyModalOpen}
                    sx={{ color: theme.palette.greenAccent.main }}
                    title="Edit Anomaly Details"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={handleValuesModalOpen}
                    sx={{ color: theme.palette.greenAccent.main }}
                    title="Edit Reading Values"
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
              )
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
                    bgcolor: reading.isAbnormal ? "#f44336" : theme.palette.greenAccent.main,
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
                <Typography variant="body1">{reading.reading} Units</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Consumption
                </Typography>
                <Typography variant="body1">{reading.consumption} Units</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Average Consumption
                </Typography>
                <Typography variant="body1">
                  {reading.averageConsumption != null ? `${reading.averageConsumption} Units` : "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                  Period
                </Typography>
                <Typography variant="body1">
                  {new Date(reading.period).toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}
                </Typography>
              </Grid>
              {reading.meterPhotoUrl && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                    Meter Photo
                  </Typography>
                  <Typography variant="body1">
                    <a href={reading.meterPhotoUrl} target="_blank" rel="noopener noreferrer">
                      View Photo
                    </a>
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
                  {new Date(reading.createdAt).toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {reading.isAbnormal && reading.anomalyDetails && (
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
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                    Anomaly Reason
                  </Typography>
                  <Typography variant="body1">{reading.anomalyDetails.anomalyReason}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                    Reviewed
                  </Typography>
                  <Chip
                    label={reading.anomalyDetails.reviewed ? "Yes" : "No"}
                    sx={{
                      bgcolor: reading.anomalyDetails.reviewed ? theme.palette.greenAccent.main : theme.palette.grey[300],
                      color: reading.anomalyDetails.reviewed ? "#fff" : theme.palette.grey[100],
                    }}
                    size="small"
                  />
                </Grid>
                {reading.anomalyDetails.reviewNotes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                      Review Notes
                    </Typography>
                    <Typography variant="body1">{reading.anomalyDetails.reviewNotes}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                    Action
                  </Typography>
                  <Typography variant="body1">{reading.anomalyDetails.action || "None"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color={theme.palette.grey[100]}>
                    Resolved
                  </Typography>
                  <Chip
                    label={reading.anomalyDetails.resolved ? "Yes" : "No"}
                    sx={{
                      bgcolor: reading.anomalyDetails.resolved ? theme.palette.greenAccent.main : theme.palette.grey[300],
                      color: reading.anomalyDetails.resolved ? "#fff" : theme.palette.grey[100],
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
              bgcolor: theme.palette.background.paper,
              borderRadius: 2,
              p: 3,
              width: 400,
              boxShadow: 24,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: theme.palette.grey[900] }}>
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
            />
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <input
                type="checkbox"
                checked={anomalyDetails.reviewed}
                onChange={handleAnomalyInputChange("reviewed")}
                id="reviewed-checkbox"
              />
              <Typography variant="body1" sx={{ ml: 1, color: theme.palette.grey[900] }}>
                Reviewed
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <input
                type="checkbox"
                checked={anomalyDetails.resolved}
                onChange={handleAnomalyInputChange("resolved")}
                id="resolved-checkbox"
              />
              <Typography variant="body1" sx={{ ml: 1, color: theme.palette.grey[900] }}>
                Resolved
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleUpdateAnomaly}
                disabled={updateLoading}
                sx={{ bgcolor: theme.palette.greenAccent.main, color: theme.palette.grey[100] }}
              >
                {updateLoading ? <CircularProgress size={24} /> : "Save Changes"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleModalClose}
                sx={{ borderColor: theme.palette.grey[300], color: theme.palette.grey[900] }}
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
              bgcolor: theme.palette.background.paper,
              borderRadius: 2,
              p: 3,
              width: 400,
              boxShadow: 24,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: theme.palette.grey[900] }}>
              Edit Meter Reading Values
            </Typography>
            <TextField
              label="Reading (Units)"
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
            />
            <TextField
              label="Consumption (Units)"
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
            />
            <TextField
              label="Meter Photo URL"
              value={readingValues.meterPhotoUrl}
              onChange={handleValuesInputChange("meterPhotoUrl")}
              fullWidth
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleUpdateValues}
                disabled={updateLoading || isNaN(parseFloat(readingValues.reading)) || isNaN(parseFloat(readingValues.consumption))}
                sx={{ bgcolor: theme.palette.greenAccent.main, color: theme.palette.grey[100] }}
              >
                {updateLoading ? <CircularProgress size={24} /> : "Save Changes"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleModalClose}
                sx={{ borderColor: theme.palette.grey[300], color: theme.palette.grey[900] }}
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
          >
            Back to Meter Readings
          </Button>
        </Box>
      </Box>
    </Fade>
  );
};

export default MeterReadingDetails;