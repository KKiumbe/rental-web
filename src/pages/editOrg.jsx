import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Snackbar,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import TitleComponent from "../components/title";
import { useAuthStore } from "../store/authStore";

const EditOrganization = () => {
  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  const [tenant, setTenant] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    alternativePhoneNumber: "",
    county: "",
    town: "",
    address: "",
    building: "",
    street: "",
    website: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch initial tenant data
  useEffect(() => {
    const fetchTenantDetails = async () => {
      try {
        const response = await axios.get(`${BASEURL}/tenants/${currentUser.tenantId}`, {
          withCredentials: true,
        });
        setTenant(response.data.tenant);
      } catch (err) {
        setSnackbar({
          open: true,
          message: "Failed to load organization details for editing.",
          severity: "error",
        });
      }
    };

    if (currentUser?.tenantId) {
      fetchTenantDetails();
    }
  }, [currentUser]);

  const handleFieldChange = (field, value) => {
    setTenant((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setLogoFile(file);
    } else {
      setSnackbar({
        open: true,
        message: "Please select a valid image file.",
        severity: "error",
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Update tenant details
      await axios.put(
        `${BASEURL}/tenants/${currentUser.tenantId}`,
        tenant,
        { withCredentials: true }
      );

      // Update logo if a new file is selected
      if (logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);
        await axios.put(
          `${BASEURL}/logo-upload/${currentUser.tenantId}`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }

      setSnackbar({
        open: true,
        message: "Organization updated successfully!",
        severity: "success",
      });
      setTimeout(() => navigate("/org-details"), 1000);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to update organization. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        ml: { xs: 0, md: 2, lg: 4 },

        display: "flex",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
      }}
    >
      <Card
        sx={{
          maxWidth: 900,
          width: "100%",
          boxShadow: theme.shadows[3],
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: theme.palette.text.primary }}
            >
              <TitleComponent title="Edit Organization Profile" />
            </Typography>
          </Box>
          <Divider sx={{ mb: 4, bgcolor: theme.palette.grey[300] }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Organization Name"
                value={tenant.name || ""}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                variant="outlined"
                sx={{ bgcolor: theme.palette.background.paper }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={tenant.email || ""}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                variant="outlined"
                sx={{ bgcolor: theme.palette.background.paper }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={tenant.phoneNumber || ""}
                onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
                variant="outlined"
                sx={{ bgcolor: theme.palette.background.paper }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Alternative Phone Number"
                value={tenant.alternativePhoneNumber || ""}
                onChange={(e) => handleFieldChange("alternativePhoneNumber", e.target.value)}
                variant="outlined"
                sx={{ bgcolor: theme.palette.background.paper }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="County"
                value={tenant.county || ""}
                onChange={(e) => handleFieldChange("county", e.target.value)}
                variant="outlined"
                sx={{ bgcolor: theme.palette.background.paper }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Town"
                value={tenant.town || ""}
                onChange={(e) => handleFieldChange("town", e.target.value)}
                variant="outlined"
                sx={{ bgcolor: theme.palette.background.paper }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={tenant.address || ""}
                onChange={(e) => handleFieldChange("address", e.target.value)}
                variant="outlined"
                sx={{ bgcolor: theme.palette.background.paper }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Building"
                value={tenant.building || ""}
                onChange={(e) => handleFieldChange("building", e.target.value)}
                variant="outlined"
                sx={{ bgcolor: theme.palette.background.paper }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Street"
                value={tenant.street || ""}
                onChange={(e) => handleFieldChange("street", e.target.value)}
                variant="outlined"
                sx={{ bgcolor: theme.palette.background.paper }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                value={tenant.website || ""}
                onChange={(e) => handleFieldChange("website", e.target.value)}
                variant="outlined"
                sx={{ bgcolor: theme.palette.background.paper }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, color: theme.palette.text.secondary, fontWeight: "medium" }}
              >
                Update Logo
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  border: `1px dashed ${theme.palette.grey[400]}`,
                  borderRadius: "8px",
                  p: 2,
                  bgcolor: theme.palette.grey[100],
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ flexGrow: 1 }}
                />
                {logoFile && (
                  <Typography variant="body2" sx={{ ml: 2, color: theme.palette.text.secondary }}>
                    {logoFile.name}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                bgcolor: theme.palette.primary.main,
                "&:hover": { bgcolor: theme.palette.primary.dark },
                textTransform: "none",
                px: 3,
                py: 1,
                fontSize: "1rem",
              }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/organization")}
              disabled={loading}
              sx={{
                color: theme.palette.grey[700],
                borderColor: theme.palette.grey[400],
                textTransform: "none",
                px: 3,
                py: 1,
                fontSize: "1rem",
                "&:hover": { borderColor: theme.palette.grey[500] },
              }}
            >
              Cancel
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            bgcolor: snackbar.severity === "error" ? theme.palette.error.light : theme.palette.success.light,
            color: theme.palette.text.primary,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditOrganization;