import { useEffect, useState } from "react";
import { TextField, Button, Paper, Typography, MenuItem, Grid, Box, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthStore, useThemeStore } from "../store/authStore";
import { getTheme } from "../store/theme";

export default function AddCustomer() {
  const navigate = useNavigate();
  const { darkMode } = useThemeStore();
  const theme = getTheme(darkMode ? "dark" : "light");
  //const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";
  const BASEURL = import.meta.env.VITE_BASE_URL
  const currentUser = useAuthStore((state) => state.currentUser);




    
  
    useEffect(() => {
      if (!currentUser) {
        navigate("/login");
      }
    }, [currentUser]);
  

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    secondaryPhoneNumber: '',
    gender: 'Male',
    county: '',
    town: '',
    location: '',
    estateName: '',
    building: '',
    houseNumber: '',
    category: '',
    monthlyCharge: 300,
    garbageCollectionDay: 'MONDAY',
    closingBalance: 0,
    status: 'ACTIVE',
    collected: false,
    trashBagsIssued: false,
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: name === "collected" || name === "trashBagsIssued" ? value === "yes" : value,
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccessMessage("");

  if (!currentUser?.tenantId) {
    setError("Tenant ID is missing. Please log in again.");
    return;
  }

  console.log(`Submitting customer for tenant ID: ${currentUser.tenantId}`);

  const customerData = { ...formData, tenantId: currentUser.tenantId };

  if (!customerData.firstName || !customerData.lastName || !customerData.phoneNumber || 
      !customerData.monthlyCharge || !customerData.garbageCollectionDay || 
      customerData.closingBalance === '') {
    setError("Please fill in all required fields.");
    return;
  }

  try {
    await axios.post(`${BASEURL}/customers`, customerData, { withCredentials: true });

    console.log("Customer created successfully");
    setSuccessMessage("Customer created successfully!");

    setTimeout(() => {
      navigate("/");
    }, 2000); // Redirect after success
  } catch (err) {
    console.error("Error adding customer:", err);

    if (err.response) {
      const { status, data } = err.response;

      if (status === 400) {
        setError(data?.message || "Invalid input. Please check your details.");
      } else if (status === 401) {
        setError("Unauthorized. Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError("Something went wrong on our end. Please try again later.");
      }
    } else {
      setError("Network error. Please check your connection.");
    }
  }
};


 return (
    <Paper
      sx={{
        width: "70%",
        padding: 3,
        margin: "auto",
       
        mt: 5,
        //backgroundColor: theme.palette.primary.main, // Background color from theme
        boxShadow: theme.shadows[3],
        color: theme.palette.grey[100], // Text color from theme
      }}
    >
     <Typography variant="h5" align="center" sx={{ color: theme.palette.primary.contrastText }}>
  Add Customer
</Typography>

{/* Display alerts here */}
{successMessage && (
  <Alert severity="success" sx={{ mt: 2 }}>
    {successMessage}
  </Alert>
)}

{error && (
  <Alert severity="error" sx={{ mt: 2 }}>
    {error}
  </Alert>
)}

      <form onSubmit={handleSubmit}  >
        <Grid container spacing={2}>
          {/* Name Fields */}
          <Grid item xs={6}>
            <TextField label="First Name *" name="firstName" value={formData.firstName} onChange={handleChange} fullWidth required  sx={{
                '& .MuiInputBase-root': { color: theme.palette.grey[100] },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
              }} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Last Name *" name="lastName" value={formData.lastName} onChange={handleChange} fullWidth required   sx={{
                '& .MuiInputBase-root': { color: theme.palette.grey[100] },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
              }}/>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={6}>
            <TextField label="Phone Number *" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} fullWidth required   sx={{
                '& .MuiInputBase-root': { color: theme.palette.grey[100] },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
              }}/>
          </Grid>
          <Grid item xs={6}>
            <TextField label="Secondary Phone" name="secondaryPhoneNumber" value={formData.secondaryPhoneNumber} onChange={handleChange} fullWidth  sx={{
                '& .MuiInputBase-root': { color: theme.palette.grey[100] },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
              }} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Email" name="email" value={formData.email} onChange={handleChange} fullWidth  sx={{
                '& .MuiInputBase-root': { color: theme.palette.grey[100] },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
              }} />
          </Grid>

          {/* Personal Details */}
          <Grid item xs={6}>
            <TextField select label="Gender" name="gender" value={formData.gender} onChange={handleChange} fullWidth  sx={{
                '& .MuiInputBase-root': { color: theme.palette.grey[100] },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
              }}>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </TextField>
          </Grid>

          {/* Address Details */}
          <Grid item xs={6}>
            <TextField label="County" name="county" value={formData.county} onChange={handleChange} fullWidth  sx={{
                '& .MuiInputBase-root': { color: theme.palette.grey[100] },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
              }} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Town" name="town" value={formData.town} onChange={handleChange} fullWidth  sx={{
                '& .MuiInputBase-root': { color: theme.palette.grey[100] },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
              }} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Location" name="location" value={formData.location} onChange={handleChange} fullWidth  sx={{
                '& .MuiInputBase-root': { color: theme.palette.grey[100] },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
              }}/>
          </Grid>
          <Grid item xs={6}>
            <TextField label="Estate Name" name="estateName" value={formData.estateName} onChange={handleChange} fullWidth  sx={{
                '& .MuiInputBase-root': { color: theme.palette.grey[100] },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
              }} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Building" name="building" value={formData.building} onChange={handleChange} fullWidth   sx={{
                '& .MuiInputBase-root': { color: theme.palette.grey[100] },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
              }}/>
          </Grid>
          <Grid item xs={6}>
            <TextField label="House Number" name="houseNumber" value={formData.houseNumber} onChange={handleChange} fullWidth  sx={{
                '& .MuiInputBase-root': { color: theme.palette.grey[100] },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
              }}/>
          </Grid>

          {/* Billing & Collection Details */}
          <Grid item xs={6}>
            <TextField label="Category" name="category" value={formData.category} onChange={handleChange} fullWidth  sx={{
                '& .MuiInputBase-root': { color: theme.palette.grey[100] },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
              }} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Monthly Charge *" name="monthlyCharge" value={formData.monthlyCharge} onChange={handleChange} fullWidth required  sx={{
                '& .MuiInputBase-root': { color: theme.palette.grey[100] },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
              }} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Garbage Collection Day *" name="garbageCollectionDay" value={formData.garbageCollectionDay} onChange={handleChange} fullWidth required  sx={{
                '& .MuiInputBase-root': { color: theme.palette.grey[100] },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
              }} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Closing Balance *" name="closingBalance" value={formData.closingBalance} onChange={handleChange} fullWidth required   sx={{
                '& .MuiInputBase-root': { color: theme.palette.grey[100] },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
              }}/>
          </Grid>
          <Grid item xs={6}>
          <TextField
  select
  label="Trash Bags Issued"
  name="trashBagsIssued"
  value={formData.trashBagsIssued ? "yes" : "no"}
  onChange={handleChange}
  fullWidth
  required
  sx={{
    '& .MuiInputBase-root': { color: theme.palette.grey[100] },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
  }}
>
  <MenuItem value="yes">Yes</MenuItem>
  <MenuItem value="no">No</MenuItem>
</TextField>

          </Grid>
          <Grid item xs={6}>
          <Grid item xs={6}>

          <TextField
  select
  label="Collected"
  name="collected"
  value={formData.collected ? "yes" : "no"}
  onChange={handleChange}
  fullWidth
  required
  sx={{
    '& .MuiInputBase-root': { color: theme.palette.grey[100] },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
  }}
>
  <MenuItem value="yes">Yes</MenuItem>
  <MenuItem value="no">No</MenuItem>
</TextField>

 
</Grid>

          </Grid>
          <Grid item xs={6}>
            <TextField select label="Status" name="status" value={formData.status} onChange={handleChange} fullWidth  sx={{
                '& .MuiInputBase-root': { color: theme.palette.grey[100] },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
              }}>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {/* Buttons */}
        <Box mt={3} display="flex" justifyContent="space-between">
          <Button
            variant="outlined"
            sx={{ color: theme.palette.grey[300], borderColor: theme.palette.grey[300] }}
            onClick={() => navigate("/")}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            type="submit"
            sx={{ backgroundColor:  theme.palette.greenAccent.main, color: "#fff" }}
          >
            Add Customer
          </Button>
        </Box>
      </form>
    </Paper>
  );
}