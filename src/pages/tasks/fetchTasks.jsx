import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Divider,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";

const FetchTasksScreen = () => {
  const [tasksAssignedToMe, setTasksAssignedToMe] = useState([]);
  const [tasksAssignedByMe, setTasksAssignedByMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASEURL}/fetch-task`, {
        withCredentials: true,
      });
      setTasksAssignedToMe(response.data.assignedToMe || []);
      setTasksAssignedByMe(response.data.assignedByMe || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setSnackbarMessage(
        error.response?.data?.message || "Failed to load tasks. Please try again."
      );
      setSnackbarSeverity("error");
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.post(
        `${BASEURL}/update-task/${taskId}`,
        { status: newStatus },
        { withCredentials: true }
      );
      setSnackbarMessage(`Task status updated to ${newStatus}.`);
      setSnackbarSeverity("success");
      setSnackbarVisible(true);
      fetchTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
      setSnackbarMessage(
        error.response?.data?.message || "Failed to update task status."
      );
      setSnackbarSeverity("error");
      setSnackbarVisible(true);
    }
  };

  const renderTask = (item) => (
    <Box
      key={item.id}
      sx={{
        mb: 3,
        p: 3,
        border: "1px solid",
        borderColor: "grey.300",
        borderRadius: 2,
        bgcolor: "background.paper",
        boxShadow: 1,
        transition: "box-shadow 0.3s",
        "&:hover": {
          boxShadow: 3,
        },
        cursor: "pointer",
        maxWidth: 800,
        mx: "auto",
      }}
      onClick={() => navigate(`/task-details/${item.id}`)} // Updated navigation
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", color: "primary.main" }}
        >
          {item.type.replace(/_/g, " ")}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            bgcolor:
              item.status === "COMPLETED"
                ? "success.light"
                : item.status === "CANCELED"
                ? "error.light"
                : "warning.light",
            color: "text.primary",
            px: 2,
            py: 0.5,
            borderRadius: 1,
            fontWeight: "medium",
          }}
        >
          {item.status.replace(/_/g, " ")}
        </Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" sx={{ mb: 0.5 }}>
          Declared Bags: {item.declaredBags ?? "N/A"}
        </Typography>
        <Typography variant="body1" sx={{ mb: 0.5 }}>
          Remaining Bags: {item.remainingBags ?? "N/A"}
        </Typography>
        <Typography variant="body1">
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELED"].map((status) => (
          <Button
            key={status}
            onClick={(e) => {
              e.stopPropagation();
              updateTaskStatus(item.id, status);
            }}
            variant={item.status === status ? "contained" : "outlined"}
            color={
              status === "COMPLETED"
                ? "success"
                : status === "CANCELED"
                ? "error"
                : "primary"
            }
            sx={{
              px: 2,
              py: 0.75,
              fontSize: "0.875rem",
              textTransform: "none",
            }}
            disabled={status === "COMPLETED" && item.status === status}
          >
            {status.replace(/_/g, " ")}
          </Button>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1200, mx: "auto", mt: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: "bold", mb: 4, textAlign: "center" }}
      >
        My Tasks
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography
            variant="h5"
            sx={{ mt: 4, mb: 3, fontWeight: "medium", color: "primary.main" }}
          >
            Tasks Assigned to Me
          </Typography>
          {tasksAssignedToMe.length === 0 ? (
            <Typography
              sx={{ textAlign: "center", my: 4, color: "text.secondary", fontSize: "1.1rem" }}
            >
              No tasks assigned to you at the moment.
            </Typography>
          ) : (
            <Box sx={{ mb: 6 }}>
              {tasksAssignedToMe.map((item) => renderTask(item))}
            </Box>
          )}
          <Divider sx={{ my: 5 }} />

          <Typography
            variant="h5"
            sx={{ mt: 4, mb: 3, fontWeight: "medium", color: "primary.main" }}
          >
            Tasks Assigned by Me
          </Typography>
          {tasksAssignedByMe.length === 0 ? (
            <Typography
              sx={{ textAlign: "center", my: 4, color: "text.secondary", fontSize: "1.1rem" }}
            >
              You haven't assigned any tasks yet.
            </Typography>
          ) : (
            <Box>
              {tasksAssignedByMe.map((item) => renderTask(item))}
            </Box>
          )}
        </>
      )}

      <Snackbar
        open={snackbarVisible}
        autoHideDuration={4000}
        onClose={() => setSnackbarVisible(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarVisible(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%", fontSize: "0.9rem" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FetchTasksScreen;