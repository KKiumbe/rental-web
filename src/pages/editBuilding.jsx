import React, { useEffect, useState, Component } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Snackbar,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Divider,
  Grid,
} from '@mui/material';
import TitleComponent from '../components/title';
import { getTheme } from '../store/theme';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Typography color="error" sx={{ p: 2 }}>
          Error rendering page: {this.state.error?.message || 'Unknown error'}
        </Typography>
      );
    }
    return this.props.children;
  }
}

const EditBuildingScreen = () => {
  const navigate = useNavigate();
  const { buildingId } = useParams();
  const currentUser = useAuthStore((state) => state.currentUser);
  const theme = getTheme();
  const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://taqa.co.ke/api';

  const [form, setForm] = useState({
    name: '',
    address: '',
    unitCount: '',
    gasRate: '',
    waterRate: '',
    allowWaterBillingWithAverages: false,
    allowGasBillingWithAverages: false,
    billWater: false,
    billGas: false,
    billServiceCharge: false,
    billGarbage: false,
    billSecurity: false,
    billAmenities: false,
    billBackupGenerator: false,
  });
  const [landlordName, setLandlordName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [errors, setErrors] = useState({});

  // Redirect to login if no user
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Fetch building data
  const fetchBuilding = async () => {
    try {
      setFetching(true);
      const response = await axios.get(`${BASE_URL}/buildings/${buildingId}`, {
        withCredentials: true,
      });
      const building = response.data;
      setForm({
        name: building.name || '',
        address: building.address || '',
        unitCount: building.unitCount ? building.unitCount.toString() : '',
        gasRate: building.gasRate ? building.gasRate.toString() : '',
        waterRate: building.waterRate ? building.waterRate.toString() : '',
        allowWaterBillingWithAverages: building.allowWaterBillingWithAverages || false,
        allowGasBillingWithAverages: building.allowGasBillingWithAverages || false,
        billWater: building.billWater || false,
        billGas: building.billGas || false,
        billServiceCharge: building.billServiceCharge || false,
        billGarbage: building.billGarbage || false,
        billSecurity: building.billSecurity || false,
        billAmenities: building.billAmenities || false,
        billBackupGenerator: building.billBackupGenerator || false,
      });
      setLandlordName(building.landlord?.name || 'Unknown');
    } catch (error) {
      console.error('Error fetching building:', error);
      setSnackbarMessage(error.response?.data?.message || 'Failed to load building');
      setSnackbarOpen(true);
      navigate('/properties');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (currentUser && buildingId) {
      fetchBuilding();
    }
  }, [currentUser, buildingId]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = 'Building name is required';
    if (form.unitCount && (isNaN(form.unitCount) || form.unitCount < 0)) {
      newErrors.unitCount = 'Must be a non-negative number';
    }
    if (form.gasRate && (isNaN(form.gasRate) || form.gasRate < 0)) {
      newErrors.gasRate = 'Must be a non-negative number';
    }
    if (form.waterRate && (isNaN(form.waterRate) || form.waterRate < 0)) {
      newErrors.waterRate = 'Must be a non-negative number';
    }
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        address: form.address || null,
        unitCount: form.unitCount ? parseInt(form.unitCount) : null,
        gasRate: form.gasRate ? parseFloat(form.gasRate) : null,
        waterRate: form.waterRate ? parseFloat(form.waterRate) : null,
        allowWaterBillingWithAverages: form.allowWaterBillingWithAverages,
        allowGasBillingWithAverages: form.allowGasBillingWithAverages,
        billWater: form.billWater,
        billGas: form.billGas,
        billServiceCharge: form.billServiceCharge,
        billGarbage: form.billGarbage,
        billSecurity: form.billSecurity,
        billAmenities: form.billAmenities,
        billBackupGenerator: form.billBackupGenerator,
      };

      const response = await axios.put(`${BASE_URL}/buildings/${buildingId}`, payload, {
        withCredentials: true,
      });
      setSnackbarMessage(response.data.message);
      setSnackbarOpen(true);
      setTimeout(() => {
        navigate('/properties');
      }, 2000);
      setErrors({});
    } catch (error) {
      console.error('Error updating building:', error);
      setSnackbarMessage(error.response?.data?.message || 'Failed to update building');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  if (fetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: theme?.palette?.background?.paper, minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ ml: 5 }}>
        <TitleComponent title="Edit Building" />
      </Typography>

      <ErrorBoundary>
        <Box sx={{ ml: 5, mr: 5, maxWidth: 600 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Edit Building
            </Typography>
            <form onSubmit={handleSubmit}>
              {/* Landlord (Read-only) */}
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Landlord
              </Typography>
              <TextField
                fullWidth
                label="Landlord"
                value={landlordName}
                variant="outlined"
                size="small"
                margin="normal"
                disabled
              />
              <Divider sx={{ my: 2 }} />

              {/* Property Details */}
              <Typography variant="subtitle1" gutterBottom>
                Property Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Building Name *"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    error={!!errors.name}
                    helperText={errors.name}
                    variant="outlined"
                    size="small"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Unit Count"
                    name="unitCount"
                    type="number"
                    value={form.unitCount}
                    onChange={handleChange}
                    error={!!errors.unitCount}
                    helperText={errors.unitCount}
                    variant="outlined"
                    size="small"
                    margin="normal"
                  />
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />

              {/* Address */}
              <Typography variant="subtitle1" gutterBottom>
                Address
              </Typography>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={form.address}
                onChange={handleChange}
                variant="outlined"
                size="small"
                margin="normal"
              />
              <Divider sx={{ my: 2 }} />

              {/* Billing Rate for Water & Gas */}
              <Typography variant="subtitle1" gutterBottom>
                Billing Rate for Water & Gas
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Water Rate ($)"
                    name="waterRate"
                    type="number"
                    value={form.waterRate}
                    onChange={handleChange}
                    error={!!errors.waterRate}
                    helperText={errors.waterRate}
                    variant="outlined"
                    size="small"
                    margin="normal"
                    inputProps={{ step: '0.01' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Gas Rate ($)"
                    name="gasRate"
                    type="number"
                    value={form.gasRate}
                    onChange={handleChange}
                    error={!!errors.gasRate}
                    helperText={errors.gasRate}
                    variant="outlined"
                    size="small"
                    margin="normal"
                    inputProps={{ step: '0.01' }}
                  />
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />

              {/* Billable Items */}
              <Typography variant="subtitle1" gutterBottom>
                Billable Items
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="billWater"
                        checked={form.billWater}
                        onChange={handleChange}
                      />
                    }
                    label="Bill Water"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="billGas"
                        checked={form.billGas}
                        onChange={handleChange}
                      />
                    }
                    label="Bill Gas"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="billServiceCharge"
                        checked={form.billServiceCharge}
                        onChange={handleChange}
                      />
                    }
                    label="Bill Service Charge"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="billGarbage"
                        checked={form.billGarbage}
                        onChange={handleChange}
                      />
                    }
                    label="Bill Garbage"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="billSecurity"
                        checked={form.billSecurity}
                        onChange={handleChange}
                      />
                    }
                    label="Bill Security"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="billAmenities"
                        checked={form.billAmenities}
                        onChange={handleChange}
                      />
                    }
                    label="Bill Amenities"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="billBackupGenerator"
                        checked={form.billBackupGenerator}
                        onChange={handleChange}
                      />
                    }
                    label="Bill Backup Generator"
                  />
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />

              {/* Allow Billing Using Previous Averages */}
              <Typography variant="subtitle1" gutterBottom>
                Allow Billing Using Previous Averages
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="allowWaterBillingWithAverages"
                        checked={form.allowWaterBillingWithAverages}
                        onChange={handleChange}
                      />
                    }
                    label="Allow Water Billing with Averages"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="allowGasBillingWithAverages"
                        checked={form.allowGasBillingWithAverages}
                        onChange={handleChange}
                      />
                    }
                    label="Allow Gas Billing with Averages"
                  />
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />

              {/* Submit and Cancel Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Updating...' : 'Update Building'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/properties')}
                  fullWidth
                >
                  Cancel
                </Button>
              </Box>
            </form>
          </Paper>
        </Box>
      </ErrorBoundary>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default EditBuildingScreen;