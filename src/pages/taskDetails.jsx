import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Divider,
  Snackbar,
  Alert,
  Button,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getTheme } from "../store/theme";

const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";

const TaskDetailsScreen = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [taskDetails, setTaskDetails] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
    const theme = getTheme();
  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASEURL}/fetch-task-details/${taskId}`, {
        withCredentials: true,
      });
      const { taskDetails, assignees, customers } = response.data;
      setTaskDetails(taskDetails || null);
      setAssignees(assignees || []);
      setCustomers(customers || []);
    } catch (error) {
      console.error("Error fetching task details:", error);
      setSnackbarMessage(
        error.response?.data?.message || "Failed to load task details. Please try again."
      );
      setSnackbarSeverity("error");
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (newStatus) => {
    try {
      await axios.post(
        `${BASEURL}/update-task/${taskId}`,
        { status: newStatus },
        { withCredentials: true }
      );
      setSnackbarMessage(`Task status updated to ${newStatus}.`);
      setSnackbarSeverity("success");
      setSnackbarVisible(true);
      fetchTaskDetails();
    } catch (error) {
      console.error("Error updating task status:", error);
      setSnackbarMessage(
        error.response?.data?.message || "Failed to update task status."
      );
      setSnackbarSeverity("error");
      setSnackbarVisible(true);
    }
  };

  // DataGrid columns for customers
  const customerColumns = [
    {
      field: "name",
      headerName: "Name",
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: "medium" }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "phoneNumber",
      headerName: "Phone Number",
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value.startsWith("0") ? params.value : `0${params.value}`}
        </Typography>
      ),
    },
    {
      field: "trashBagsIssued",
      headerName: "Trash Bags Issued",
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">{params.value ? "Yes" : "No"}</Typography>
      ),
    },
    {
      field: "bagsIssued",
      headerName: "Bags Issued",
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">{params.value || "None"}</Typography>
      ),
    },
  ];

  // Map customers to DataGrid rows
  const customerRows = customers.map((customer) => ({
    id: customer.customerId, // DataGrid requires unique 'id' field
    name: customer.name,
    phoneNumber: customer.phoneNumber,
    trashBagsIssued: customer.trashBagsIssued,
    bagsIssued: customer.bagsIssued,
  }));

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, ml: 20, mr: 2 }}>
      <Button
        variant="outlined"
        onClick={() => navigate("/tasks")}
        sx={{ mb: 2, textTransform: "none", color: theme.palette.greenAccent.main }}
      >
        Back to Tasks
      </Button>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: "bold", mb: 4, textAlign: "center" }}
      >
        Task Details
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : !taskDetails ? (
        <Typography
          sx={{ textAlign: "center", my: 4, color: "text.secondary", fontSize: "1.1rem" }}
        >
          Task not found.
        </Typography>
      ) : (
        <>
          {/* Task Information */}
          <Box
            sx={{
              mb: 4,
              p: 3,
              border: "1px solid",
              borderColor: "grey.300",
              borderRadius: 2,
              bgcolor: "background.paper",
              boxShadow: 1,
              maxWidth: 800,
              mx: "auto",
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: "medium", color:theme.palette.primary.contrastText , mb: 2 }}
            >
              {taskDetails.type.replace(/_/g, " ")}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography
                variant="body1"
                sx={{
                  bgcolor:
                    taskDetails.status === "COMPLETED"
                      ? "success.light"
                      : taskDetails.status === "CANCELED"
                      ? "error.light"
                      : "warning.light",
                 
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  fontWeight: "medium",
                }}
              >
                {taskDetails.status.replace(/_/g, " ")}
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ mb: 0.5 }}>
              Declared Bags: {taskDetails.declaredBags ?? "N/A"}
            </Typography>
            <Typography variant="body1" sx={{ mb: 0.5 }}>
              Created: {new Date(taskDetails.createdAt).toLocaleDateString()}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Updated: {new Date(taskDetails.updatedAt).toLocaleDateString()}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELED"].map((status) => (
                <Button
                  key={status}
                  onClick={() => updateTaskStatus(status)}
                  variant={taskDetails.status === status ? "contained" : "outlined"}
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
                  disabled={status === "COMPLETED" && taskDetails.status === status}
                >
                  {status.replace(/_/g, " ")}
                </Button>
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Assignees */}
          <Typography
            variant="h5"
            sx={{ mt: 4, mb: 3, fontWeight: "medium",  }}
          >
            Assignees
          </Typography>
          {assignees.length === 0 ? (
            <Typography
              sx={{ textAlign: "center", my: 4, color: "text.secondary", fontSize: "1.1rem" }}
            >
              No assignees for this task.
            </Typography>
          ) : (
            <Box sx={{ mb: 4, maxWidth: 800, mx: "auto" }}>
              {assignees.map((assignee) => (
                <Box
                  key={assignee.assigneeId}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: "1px solid",
                    borderColor: "grey.300",
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    boxShadow: 1,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                    {assignee.name}
                  </Typography>
                  <Typography variant="body2">
                    Phone: {assignee.phoneNumber}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          <Divider sx={{ my: 4 }} />

          {/* Customers */}
          <Typography
            variant="h5"
            sx={{ mt: 4, mb: 3, fontWeight: "medium", }}
          >
            Customers
          </Typography>
          {customers.length === 0 ? (
            <Typography
              sx={{ textAlign: "center", my: 4, color: "text.secondary", fontSize: "1.1rem" }}
            >
              No customers associated with this task.
            </Typography>
          ) : (
            <Box sx={{ maxWidth: 1000, mx: "auto", mb: 4 }}>
              <DataGrid
                rows={customerRows}
                columns={customerColumns}
                autoHeight
                disableSelectionOnClick
                sx={{
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  boxShadow: 1,
                  "& .MuiDataGrid-cell": {
                    py: 1,
                  },
                  "& .MuiDataGrid-columnHeader": {
                    bgcolor: "primary.light",
                    color: "primary.contrastText",
                  },
                }}
                pageSize={10}
                rowsPerPageOptions={[10]}
              />
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

export default TaskDetailsScreen;