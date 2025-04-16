import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { getTheme } from "../store/theme";

const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";

const GarbageCollectionDays = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const AssignTaskScreen = () => {
  const [assigneeId, setAssigneeId] = useState("");
  const [collectionDay, setCollectionDay] = useState("");
  const [declaredBags, setDeclaredBags] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null); // For collection day dropdown

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const theme = getTheme();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${BASEURL}/users`, {
        withCredentials: true,
      });

      setUsers(response.data.users || []);
      console.log("Fetched users:", response.data.users);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch users.";
      setSnackbarMessage(message);
      setSnackbarVisible(true);
    }
  };

  const assignTask = async () => {
    if (!assigneeId || !collectionDay || !declaredBags) {
      setSnackbarMessage("All fields are required.");
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        assigneeId,
        collectionDay,
        declaredBags: parseInt(declaredBags),
      };

      await axios.post(`${BASEURL}/create-trashbag-task`, payload, {
        withCredentials: true,
      });
      setSnackbarMessage("Task assigned successfully.");
      setSnackbarVisible(true);
      setTimeout(() => navigate("/tasks"), 1500); // Navigate after snackbar
    } catch (error) {
      console.error("Error assigning task:", error);
      setSnackbarMessage("Failed to assign task.");
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (day) => {
    if (day) setCollectionDay(day);
    setAnchorEl(null);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: "auto", mt: 4 , ml: {
        xs: 10, // margin-left for extra small screens (8px)
        sm: 20, // margin-left for small screens (16px)
        md: 30, // margin-left for medium screens (20px)
        lg: 40, // margin-left for large screens (20px)
      },}}>
      <Typography variant="h5" gutterBottom>
        Assign task to issue garbage bags 
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          {/* Select Assignee */}
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
            Select Assignee
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="assignee-select-label">Assignee</InputLabel>
            <Select
              labelId="assignee-select-label"
              value={assigneeId}
              label="Assignee"
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} - {user.phoneNumber}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Collection Day */}
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
            Collection Day
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              onClick={handleMenuOpen}
              sx={{ textTransform: "none", width: "100%", justifyContent: "flex-start" }}
            >
              {collectionDay || "Select a day"}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => handleMenuClose()}
            >
              {GarbageCollectionDays.map((day) => (
                <MenuItem
                  key={day}
                  onClick={() => handleMenuClose(day)}
                  sx={{
                    backgroundColor: collectionDay === day ? "#007BFF" : "inherit",
                    color: collectionDay === day ? "white" : "inherit",
                    "&:hover": {
                      backgroundColor: collectionDay === day ? "#0056b3" : "#f0f0f0",
                    },
                  }}
                >
                  {day}
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Declared Bags */}
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
            Total Bags
          </Typography>
          <TextField
            fullWidth
            label="Enter number of declared bags"
            type="number"
            value={declaredBags}
            onChange={(e) => setDeclaredBags(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{ inputProps: { min: 0 } }}
          />

          {/* Assign Task Button */}
          <Button
            variant="contained"
            onClick={assignTask}
            fullWidth
            sx={{ mt: 2, py: 1.5 }}
          >
            Assign Task
          </Button>
        </Paper>
      )}

      {/* Snackbar for Feedback */}
      <Snackbar
        open={snackbarVisible}
        autoHideDuration={3000}
        onClose={() => setSnackbarVisible(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarVisible(false)}
          severity={snackbarMessage.includes("successfully") ? "success" : "error"}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AssignTaskScreen;