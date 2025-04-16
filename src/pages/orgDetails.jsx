import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Grid,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import TitleComponent from "../components/title";
import { useAuthStore } from "../store/authStore";
import { getTheme } from "../store/theme";

const Organization = () => {
  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";
  const theme = useTheme();
  const theme1 = getTheme();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const fetchTenantDetails = async () => {
      try {
        const response = await axios.get(`${BASEURL}/tenants/${currentUser.tenantId}`, {
          withCredentials: true,
        });
        setTenant(response.data.tenant);
      } catch (err) {
        setError("Unable to retrieve organization details at this time.");
        setSnackbar({
          open: true,
          message: "Failed to load organization details. Please try again later.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.tenantId) {
      fetchTenantDetails();
    } else {
      setError("No tenant ID found for the current user.");
      setLoading(false);
    }
  }, [currentUser]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleEditClick = () => {
    navigate("/organization/edit");
  };

  const renderField = (label, value) => (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="subtitle2"
        sx={{ color: theme.palette.text.secondary, fontWeight: "medium" }}
      >
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: theme.palette.text.primary, wordBreak: "break-word" }}
      >
        {value || "Not Provided"}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        width: "100%",
        display: "flex",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        ml: { xs: 0, md: 2, lg: 4 }

      }}
    >
      {loading ? (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mt: 10 }}>
          <CircularProgress size={60} sx={{ color: theme.palette.primary.main }} />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: "center", mt: 10 }}>
          <Typography
            variant="h6"
            sx={{ color: theme.palette.error.main, mb: 2 }}
          >
            {error}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
            sx={{ color: theme.palette.primary.main, borderColor: theme.palette.primary.main }}
          >
            Retry
          </Button>
        </Box>
      ) : (
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
                sx={{
                  fontWeight: "bold",
                  color: theme.palette.text.primary,
                }}
              >
                <TitleComponent title="Organization Profile" />
              </Typography>
              <Button
                variant="contained"
                onClick={handleEditClick}
                sx={{
                  bgcolor: theme1.palette.greenAccent.main,
                  "&:hover": { bgcolor: theme1.palette.primary.dark },
                  textTransform: "none",
                  px: 3,
                  py: 1,
                  fontSize: "1rem",
                }}
              >
                Edit Profile
              </Button>
            </Box>
            <Divider sx={{ mb: 4, bgcolor: theme.palette.grey[300] }} />

            <Grid container spacing={4}>
              {/* Logo Section */}
              <Grid item xs={12} sm={4}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  
                    borderRadius: "8px",
                    p: 2,
                  }}
                >
                  {tenant?.logoUrl ? (
                    <img
                      src={tenant.logoUrl}
                      alt={`${tenant.name} Logo`}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "150px",
                        borderRadius: "8px",
                        objectFit: "contain",
                        border: `1px solid ${theme.palette.grey[300]}`,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: "150px",
                        height: "150px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: theme.palette.grey[200],
                        borderRadius: "8px",
                        border: `1px dashed ${theme.palette.grey[400]}`,
                      }}
                    >
                      <Typography variant="body2" color={theme.palette.grey[600]}>
                        No Logo
                      </Typography>
                    </Box>
                  )}
               
                </Box>
              </Grid>
             
              {/* Details Section */}
              <Grid item xs={12} sm={8}>
                <Grid container spacing={2}>

                <Grid item xs={12} sm={6}>
                    {renderField("Name", tenant?.name)}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {renderField("Status", tenant?.status)}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {renderField("Subscription Plan", tenant?.subscriptionPlan)}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {renderField("Monthly Charge", tenant?.monthlyCharge ? `$${tenant.monthlyCharge}` : null)}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {renderField("Number of Bags", tenant?.numberOfBags)}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {renderField("Allowed Users", tenant?.allowedUsers)}
                  </Grid>
                  <Grid item xs={12}>
                    {renderField("Email", tenant?.email)}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {renderField("Phone Number", tenant?.phoneNumber)}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {renderField("Alternative Phone", tenant?.alternativePhoneNumber)}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {renderField("County", tenant?.county)}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {renderField("Town", tenant?.town)}
                  </Grid>
                  <Grid item xs={12}>
                    {renderField("Address", tenant?.address)}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {renderField("Building", tenant?.building)}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {renderField("Street", tenant?.street)}
                  </Grid>
                  <Grid item xs={12}>
                    {renderField("Website", tenant?.website)}
                  </Grid>
                  <Grid item xs={12}>
                    {renderField("Created At", tenant?.createdAt ? new Date(tenant.createdAt).toLocaleString() : null)}
                  </Grid>
                  <Grid item xs={12}>
                    {renderField("Updated At", tenant?.updatedAt ? new Date(tenant.updatedAt).toLocaleString() : null)}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

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

export default Organization;