import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  MenuItem,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import axios from 'axios';
import { getTheme } from '../store/theme';
import TitleComponent from '../components/title';

const CustomerEditScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();

const theme = getTheme();
const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";
  const [loading, setLoading] = useState(true);
  const [originalData, setOriginalData] = useState(null);
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    county: '',
    town: '',
    status: '', // Will be normalized to "ACTIVE" or "INACTIVE"
    location: '',
    estateName: '',
    building: '',
    houseNumber: '',
    category: '',
    monthlyCharge: '', // Will be converted to float
    garbageCollectionDay: '',
    collected: false, // Boolean with default false
    closingBalance: '', // Will be converted to float
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch customer data on mount and normalize values
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await axios.get(`${BASEURL}/customer-details/${id}`, {
          withCredentials: true,
        });
        const fetchedData = response.data;

        // Normalize data
        const normalizedData = {
          ...fetchedData,
          gender: fetchedData.gender === null ? '' : fetchedData.gender,
          status: fetchedData.status || '', // Keep as-is from API ("ACTIVE" or "INACTIVE")
          collected: fetchedData.collected ?? false, // Default to false if null/undefined
          monthlyCharge: fetchedData.monthlyCharge !== null && fetchedData.monthlyCharge !== undefined ? fetchedData.monthlyCharge.toString() : '', // Convert float to string for TextField
          closingBalance: fetchedData.closingBalance !== null && fetchedData.closingBalance !== undefined ? fetchedData.closingBalance.toString() : '', // Convert float to string for TextField
        };

        setCustomerData(normalizedData);
        setOriginalData(normalizedData);
        setLoading(false);
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Error fetching customer data',
          severity: 'error',
        });
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id, BASEURL]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCustomerData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Get changed fields and convert types as needed
  const getChangedFields = () => {
    const changedFields = {};
    for (const key in customerData) {
      if (customerData[key] !== originalData[key]) {
        if (key === 'monthlyCharge' || key === 'closingBalance') {
          changedFields[key] = customerData[key] ? parseFloat(customerData[key]) : null; // Convert to float
        } else if (key === 'collected') {
          changedFields[key] = customerData[key]; // Boolean as-is
        } else {
          changedFields[key] = customerData[key]; // Other fields as strings
        }
      }
    }
    return changedFields;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const changedData = getChangedFields();
      if (Object.keys(changedData).length === 0) {
        setSnackbar({
          open: true,
          message: 'No changes detected',
          severity: 'info',
        });
        setLoading(false);
        return;
      }
      await axios.put(`${BASEURL}/customers/${id}`, changedData, {
        withCredentials: true,
      });
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Customer changes saved successfully!',
        severity: 'success',
      });
      setTimeout(() => {
        navigate('/customers');
      }, 2000);
    } catch (error) {
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Error updating customer: ' + error.message,
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
    if (snackbar.severity === 'success') {
      navigate('/customers');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ maxWidth: 900, minWidth: 600 }}>
      <Paper elevation={3} sx={{ p: 4, mt: 4, ml: 50, minWidth: 800 }}>
        <Typography variant="h4" gutterBottom>
        <TitleComponent title={`Edit ${customerData?.firstName}'s Details `} />

        </Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <TextField
              label="First Name"
              name="firstName"
              value={customerData.firstName}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Last Name"
              name="lastName"
              value={customerData.lastName}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={customerData.email}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Phone Number"
              name="phoneNumber"
              value={customerData.phoneNumber}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              select
              label="Gender"
              name="gender"
              value={customerData.gender || ''}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="">Not Specified</MenuItem>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
            <TextField
              label="County"
              name="county"
              value={customerData.county}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Town"
              name="town"
              value={customerData.town}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              select
              label="Status"
              name="status"
              value={customerData.status || ''}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </TextField>
            <TextField
              label="Location"
              name="location"
              value={customerData.location}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Estate Name"
              name="estateName"
              value={customerData.estateName}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Building"
              name="building"
              value={customerData.building}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="House Number"
              name="houseNumber"
              value={customerData.houseNumber}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Category"
              name="category"
              value={customerData.category}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Monthly Charge"
              name="monthlyCharge"
              type="number"
              step="0.01" // Allow decimal input
              value={customerData.monthlyCharge}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Garbage Collection Day"
              name="garbageCollectionDay"
              value={customerData.garbageCollectionDay}
              onChange={handleChange}
              required
              fullWidth
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="collected"
                  checked={customerData.collected}
                  onChange={handleChange}
                />
              }
              label="Collected"
            />
            <TextField
              label="Closing Balance"
              name="closingBalance"
              type="number"
              step="0.01" // Allow decimal input
              value={customerData.closingBalance}
              onChange={handleChange}
              required
              fullWidth
            />
          </Box>
          <Box sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mr: 2, backgroundColor: theme.palette.greenAccent.main }}
            >
              {loading ? 'Updating...' : 'Update Customer'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate('/customers')}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CustomerEditScreen;