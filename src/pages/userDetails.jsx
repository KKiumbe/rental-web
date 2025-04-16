import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Snackbar,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { useParams } from "react-router-dom";
import TitleComponent from "../components/title";
import { useAuthStore } from "../store/authStore";
//const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";
const UserDetails = () => {
  const { id } = useParams();
  
  const theme = useTheme();
  const { currentUser } = useAuthStore();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState("");
  const [phoneNumberConfirm, setPhoneNumberConfirm] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const isCurrentUser = currentUser && currentUser.id === id;
  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${BASEURL}/users/${id}`, {
          withCredentials: true,
        });
        setUser(response.data.user);
        setRoles(response.data.user.role || []);
      } catch (err) {
        setError("Failed to fetch user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleUpdateField = async (field, value) => {
    if (isCurrentUser) return;

    if (field === "phoneNumber" && value !== phoneNumberConfirm) {
      setSnackbarMessage("Phone number and confirmation do not match.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      await axios.put(
        `${BASEURL}/update-user`,
        { id: user.id, [field]: value },
        { withCredentials: true }
      );
      setUser((prev) => ({ ...prev, [field]: value }));
      setPhoneNumberConfirm("");
      setSnackbarMessage(
        field === "phoneNumber"
          ? "Phone number updated successfully! The user will be logged out."
          : `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`
      );
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage(`Failed to update ${field}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleAssignRole = async () => {
    if (isCurrentUser) return;

    if (!newRole) {
      setSnackbarMessage("Please select a role to assign.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    try {
      await axios.post(
        `${BASEURL}/assign-roles`,
        { userId: user.id, role: [newRole] }, // Changed 'roles' to 'role' to match backend
        { withCredentials: true }
      );
      if (!roles.includes(newRole)) {
        setRoles([...roles, newRole]);
      }
      setNewRole("");
      setSnackbarMessage("Role assigned successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage("Failed to assign role");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleRemoveRole = async (roleToRemove) => {
    if (isCurrentUser) return;

    try {
      await axios.put(
        `${BASEURL}/remove-roles`,
        { userId: user.id, rolesToRemove: [roleToRemove] },
        { withCredentials: true }
      );
      setRoles(roles.filter((role) => role !== roleToRemove));
      setSnackbarMessage("Role removed successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage("Failed to remove role");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  return (
    <Box
      sx={{
        p: 4,
      ml:30,
        display: "flex",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      {loading ? (
        <CircularProgress size={60} sx={{ mt: 10, color: theme.palette.primary.main }} />
      ) : error ? (
        <Typography variant="h6" sx={{ mt: 10, color: theme.palette.redAccent.main }}>
          {error}
        </Typography>
      ) : (
        <Card sx={{ maxWidth: 900, width: "100%", ml: -20 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
              <TitleComponent title={`User Details`} />
            </Typography>
            {isCurrentUser && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Note: You cannot edit your own details here.
              </Typography>
            )}
            <Divider sx={{ mb: 3, bgcolor: theme.palette.grey[500] }} />

            {/* User Info Section */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={user.firstName || ""}
                  onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                  variant="outlined"
                  disabled={isCurrentUser}
                />
                {!isCurrentUser && (
                  <Button
                    variant="contained"
                    sx={{ mt: 1, bgcolor: theme.palette.greenAccent.main, "&:hover": { bgcolor: theme.palette.greenAccent.dark } }}
                    onClick={() => handleUpdateField("firstName", user.firstName)}
                  >
                    Save
                  </Button>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={user.lastName || ""}
                  onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                  variant="outlined"
                  disabled={isCurrentUser}
                />
                {!isCurrentUser && (
                  <Button
                    variant="contained"
                    sx={{ mt: 1, bgcolor: theme.palette.greenAccent.main, "&:hover": { bgcolor: theme.palette.greenAccent.dark } }}
                    onClick={() => handleUpdateField("lastName", user.lastName)}
                  >
                    Save
                  </Button>
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  value={user.email || ""}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  variant="outlined"
                  disabled={isCurrentUser}
                />
                {!isCurrentUser && (
                  <Button
                    variant="contained"
                    sx={{ mt: 1, bgcolor: theme.palette.greenAccent.main, "&:hover": { bgcolor: theme.palette.greenAccent.dark } }}
                    onClick={() => handleUpdateField("email", user.email)}
                  >
                    Save
                  </Button>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number (Used for Login)"
                  value={user.phoneNumber || ""}
                  onChange={(e) => setUser({ ...user, phoneNumber: e.target.value })}
                  variant="outlined"
                  disabled={isCurrentUser}
                  helperText={!isCurrentUser ? "Changing this will log out the user." : ""}
                />
              </Grid>
              {!isCurrentUser && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm Phone Number"
                    value={phoneNumberConfirm}
                    onChange={(e) => setPhoneNumberConfirm(e.target.value)}
                    variant="outlined"
                    helperText="Please retype the new phone number to confirm."
                  />
                  <Button
                    variant="contained"
                    sx={{ mt: 1, bgcolor: theme.palette.greenAccent.main, "&:hover": { bgcolor: theme.palette.greenAccent.dark } }}
                    onClick={() => handleUpdateField("phoneNumber", user.phoneNumber)}
                  >
                    Save
                  </Button>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="County"
                  value={user.county || ""}
                  onChange={(e) => setUser({ ...user, county: e.target.value })}
                  variant="outlined"
                  disabled={isCurrentUser}
                />
                {!isCurrentUser && (
                  <Button
                    variant="contained"
                    sx={{ mt: 1, bgcolor: theme.palette.greenAccent.main, "&:hover": { bgcolor: theme.palette.greenAccent.dark } }}
                    onClick={() => handleUpdateField("county", user.county)}
                  >
                    Save
                  </Button>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Town"
                  value={user.town || ""}
                  onChange={(e) => setUser({ ...user, town: e.target.value })}
                  variant="outlined"
                  disabled={isCurrentUser}
                />
                {!isCurrentUser && (
                  <Button
                    variant="contained"
                    sx={{ mt: 1, bgcolor: theme.palette.greenAccent.main, "&:hover": { bgcolor: theme.palette.greenAccent.dark } }}
                    onClick={() => handleUpdateField("town", user.town)}
                  >
                    Save
                  </Button>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Gender"
                  value={user.gender || ""}
                  disabled
                  variant="outlined"
                />
              </Grid>
            </Grid>

            {/* Roles Section */}
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: "medium", color: theme.palette.greenAccent.main }}
            >
              Assigned Roles
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
              {roles.length > 0 ? (
                roles.map((role, index) => (
                  <Chip
                    key={index}
                    label={role}
                    onDelete={!isCurrentUser ? () => handleRemoveRole(role) : undefined}
                    sx={{ bgcolor: theme.palette.greenAccent.main, color: theme.palette.common.white }}
                  />
                ))
              ) : (
                <Typography variant="body2" color={theme.palette.grey[500]}>
                  No roles assigned yet.
                </Typography>
              )}
            </Box>

            <TextField
              select
              fullWidth
              label="Select Role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              variant="outlined"
              sx={{ mb: 2, bgcolor: theme.palette.background.default }}
              disabled={isCurrentUser}
            >
              <MenuItem value="customer_manager">Customer Manager</MenuItem>
              <MenuItem value="accountant">Accountant</MenuItem>
              <MenuItem value="collector">Garbage Collector</MenuItem>
              <MenuItem value="DEFAULT_ROLE">View Only</MenuItem>
              <MenuItem value="support_agent">Support</MenuItem>
              <MenuItem value="billing_clerk">Billing Clerk</MenuItem>
              <MenuItem value="collection_supervisor">Collection Manager</MenuItem>
            </TextField>

            <Button
              variant="contained"
              sx={{
                bgcolor: theme.palette.greenAccent.main,
                "&:hover": { bgcolor: theme.palette.greenAccent.dark },
              }}
              onClick={handleAssignRole}
              disabled={isCurrentUser}
            >
              Assign Role
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserDetails;