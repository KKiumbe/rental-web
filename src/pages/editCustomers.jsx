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
} from '@mui/material';
import axios from 'axios';
import { getTheme } from '../store/theme';
import TitleComponent from '../components/title';

const CustomerEditScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = getTheme();
  const BASEURL = import.meta.env.VITE_BASE_URL || 'https://taqa.co.ke/api';
  const [loading, setLoading] = useState(true);
  const [originalData, setOriginalData] = useState(null);
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    secondaryPhoneNumber: '',
    nationalId: '',
    status: '',
    closingBalance: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Format number with commas only for numbers >= 1000
  const formatNumberWithCommas = (number) => {
    if (!number && number !== 0) return '';
    
    const num = Number(number);
  
    if (isNaN(num)) return ''; // Safeguard in case input is not a number
  
    // Format with commas, no decimals
    return num.toLocaleString('en-US', {
      maximumFractionDigits: 0, // no decimals
      minimumFractionDigits: 0
    });
  };
  

  // Remove commas and non-numeric characters for state and backend
  const cleanNumberInput = (value) => {
    if (!value) return '';
    // Remove all non-numeric characters except decimal point and minus sign
    const cleaned = value.replace(/[^0-9.-]/g, '');
    // Ensure only one decimal point and valid number format
    const parts = cleaned.split('.');
    if (parts.length > 2) return parts[0] + '.' + parts[1];
    return cleaned;
  };

  // Fetch customer data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const customerResponse = await axios.get(`${BASEURL}/customer-details/${id}`, {
          withCredentials: true,
        });
        const fetchedData = customerResponse.data;

        // Normalize data
        const normalizedData = {
          firstName: fetchedData.firstName || '',
          lastName: fetchedData.lastName || '',
          email: fetchedData.email || '',
          phoneNumber: fetchedData.phoneNumber || '',
          secondaryPhoneNumber: fetchedData.secondaryPhoneNumber || '',
          nationalId: fetchedData.nationalId || '',
          status: fetchedData.status || '',
          closingBalance:
            fetchedData.closingBalance !== null && fetchedData.closingBalance !== undefined
              ? fetchedData.closingBalance.toString()
              : '',
        };

        setCustomerData(normalizedData);
        setOriginalData(normalizedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbar({
          open: true,
          message: 'Error fetching data: ' + error.message,
          severity: 'error',
        });
        setLoading(false);
      }
    };
    fetchData();
  }, [id, BASEURL]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'closingBalance') {
      const cleanedValue = cleanNumberInput(value);
      setCustomerData((prev) => ({
        ...prev,
        [name]: cleanedValue,
      }));
    } else {
      setCustomerData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Get changed fields and convert types
  const getChangedFields = () => {
    const changedFields = {};
    for (const key in customerData) {
      if (customerData[key] !== originalData[key]) {
        if (key === 'closingBalance') {
          changedFields[key] = customerData[key] ? parseFloat(customerData[key]) : null;
        } else {
          changedFields[key] = customerData[key];
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
      console.error('Error updating customer:', error);
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Error updating customer: ' + (error.response?.data?.message || error.message),
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
    <Container sx={{ maxWidth: 900, minWidth: 600, ml: 10 }}>
      <Paper elevation={3} sx={{ p: 4, mt: 4, minWidth: 800 }}>
        <Typography variant="h4" gutterBottom>
          <TitleComponent title={`Edit ${customerData?.firstName}'s Details`} />
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
              label="Secondary Phone Number"
              name="secondaryPhoneNumber"
              value={customerData.secondaryPhoneNumber}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="National ID"
              name="nationalId"
              value={customerData.nationalId}
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
              <MenuItem value="PENDING">Pending</MenuItem>
            </TextField>
            <TextField
              label="Closing Balance"
              name="closingBalance"
              type="text"
              value={formatNumberWithCommas(customerData.closingBalance)}
              onChange={handleChange}
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