import React, { useEffect, useState, Component } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Snackbar,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress,
} from '@mui/material';
import TitleComponent from '../components/title';
import { getTheme } from '../store/theme';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import PropTypes from 'prop-types';

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

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

const AddUnitScreen = () => {
  const navigate = useNavigate();
  const { buildingId } = useParams();
  const currentUser = useAuthStore((state) => state.currentUser);
  const theme = getTheme();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [unitForm, setUnitForm] = useState({
    buildingId: buildingId || '',
    unitNumber: '',
    monthlyCharge: '',
    depositAmount: '',
    garbageCharge: '',
    serviceCharge: '',
    status: 'VACANT',
  });
  const [buildings, setBuildings] = useState([]);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [errors, setErrors] = useState({ unit: {} });

  // Redirect to login if no user
  useEffect(() => {
    if (!currentUser) {
      console.log('No current user, redirecting to /login');
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Fetch building details by buildingId or all buildings if no buildingId
  const fetchBuilding = async () => {
    setBuildingsLoading(true);
    try {
      if (buildingId) {
        console.log(`Fetching building with ID: ${buildingId}`);
        const response = await axios.get(`${BASE_URL}/buildings/${buildingId}`, {
          withCredentials: true,
        });
        const building = response.data;
        if (!building?.id) {
          throw new Error('Building data is invalid or missing');
        }
        const formattedBuilding = {
          id: building.id,
          buildingName: building.name || building.buildingName || 'Unnamed',
          landlord: {
            name: building.landlord?.name || 'Unknown',
          },
        };
        setBuildings([formattedBuilding]);
        setUnitForm((prev) => ({ ...prev, buildingId: building.id }));
      } else {
        console.log('No buildingId provided, fetching all buildings');
        const response = await axios.get(`${BASE_URL}/buildings`, {
          params: { minimal: true },
          withCredentials: true,
        });
        const buildingsData = Array.isArray(response.data.buildings)
          ? response.data.buildings.map((b) => ({
              id: b.id,
              buildingName: b.name || b.buildingName || 'Unnamed',
              landlord: { name: b.landlord?.name || 'Unknown' },
            }))
          : [];
        setBuildings(buildingsData);
      }
    } catch (error) {
      console.error('Error fetching building(s):', error);
      setSnackbarMessage(
        error.response?.data?.message || `Failed to load ${buildingId ? 'building' : 'buildings'}`
      );
      setSnackbarOpen(true);
      if (buildingId) {
        console.log('Redirecting to /properties due to building fetch error');
        navigate('/properties');
      }
    } finally {
      setBuildingsLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered for fetchBuilding, buildingId:', buildingId);
    fetchBuilding();
  }, [buildingId]);

  // Validate unit form
  const validateUnitForm = () => {
    const newErrors = {};
    if (!unitForm.buildingId) newErrors.buildingId = 'Building is required';
    if (!unitForm.unitNumber.trim()) newErrors.unitNumber = 'Unit number is required';
    if (!unitForm.monthlyCharge || isNaN(unitForm.monthlyCharge) || Number(unitForm.monthlyCharge) < 0) {
      newErrors.monthlyCharge = 'Must be a non-negative number';
    }
    if (!unitForm.depositAmount || isNaN(unitForm.depositAmount) || Number(unitForm.depositAmount) < 0) {
      newErrors.depositAmount = 'Must be a non-negative number';
    }
    if (unitForm.garbageCharge && (isNaN(unitForm.garbageCharge) || Number(unitForm.garbageCharge) < 0)) {
      newErrors.garbageCharge = 'Must be a non-negative number';
    }
    if (unitForm.serviceCharge && (isNaN(unitForm.serviceCharge) || Number(unitForm.serviceCharge) < 0)) {
      newErrors.serviceCharge = 'Must be a non-negative number';
    }
    return newErrors;
  };

  // Handle unit form submission
  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting unit form:', unitForm);
    const validationErrors = validateUnitForm();
    if (Object.keys(validationErrors).length > 0) {
      console.log('Validation errors:', validationErrors);
      setErrors({ unit: validationErrors });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...unitForm,
        monthlyCharge: Number(unitForm.monthlyCharge),
        depositAmount: Number(unitForm.depositAmount),
        garbageCharge: unitForm.garbageCharge ? Number(unitForm.garbageCharge) : 0,
        serviceCharge: unitForm.serviceCharge ? Number(unitForm.serviceCharge) : 0,
      };
      console.log('Sending unit creation request:', payload);
      const response = await axios.post(`${BASE_URL}/create-unit`, payload, {
        withCredentials: true,
      });
      console.log('Unit creation response:', response.data);
      setSnackbarMessage(response.data.message || 'Unit created successfully');
      setSnackbarOpen(true);
      setTimeout(() => {
        console.log('Navigating to /properties after successful unit creation');
          navigate(-1);
      }, 2000);
      setUnitForm({
        buildingId: buildingId || '',
        unitNumber: '',
        monthlyCharge: '',
        depositAmount: '',
        garbageCharge: '',
        serviceCharge: '',
        status: 'VACANT',
      });
      setErrors({ unit: {} });
    } catch (error) {
      console.error('Error creating unit:', error);
      setSnackbarMessage(error.response?.data?.message || 'Failed to create unit');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleUnitChange = (e) => {
    const { name, value } = e.target;
    console.log(`Form input changed: ${name} = ${value}`);
    setUnitForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ unit: { ...prev.unit, [name]: '' } }));
  };

  return (
    <Box sx={{ bgcolor: theme?.palette?.background?.paper, minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ ml: 5 }}>
        <TitleComponent title="Create Unit" />
      </Typography>

      <ErrorBoundary>
        <Box sx={{ ml: 5, mr: 5, maxWidth: 600 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Create New Unit
            </Typography>
            {buildingsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : buildings.length === 0 && buildingId ? (
              <Typography color="error" sx={{ p: 2 }}>
                Building not found. Redirecting to properties...
              </Typography>
            ) : (
              <form onSubmit={handleUnitSubmit}>
                <FormControl
                  fullWidth
                  variant="outlined"
                  size="small"
                  error={!!errors.unit.buildingId}
                  sx={{ mb: 2 }}
                  disabled={!!buildingId}
                >
                  <InputLabel>Building</InputLabel>
                  <Select
                    name="buildingId"
                    value={unitForm.buildingId}
                    onChange={handleUnitChange}
                    label="Building"
                  >
                    <MenuItem value="">
                      <em>Select a building</em>
                    </MenuItem>
                    {buildings.map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        {b.buildingName} (Landlord: {b.landlord?.name || 'Unknown'})
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.unit.buildingId && (
                    <Typography color="error" variant="caption">
                      {errors.unit.buildingId}
                    </Typography>
                  )}
                </FormControl>
                <TextField
                  fullWidth
                  label="Unit Number"
                  name="unitNumber"
                  value={unitForm.unitNumber}
                  onChange={handleUnitChange}
                  error={!!errors.unit.unitNumber}
                  helperText={errors.unit.unitNumber}
                  variant="outlined"
                  size="small"
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Monthly Charge (Ksh)"
                  name="monthlyCharge"
                  type="number"
                  value={unitForm.monthlyCharge}
                  onChange={handleUnitChange}
                  error={!!errors.unit.monthlyCharge}
                  helperText={errors.unit.monthlyCharge}
                  variant="outlined"
                  size="small"
                  margin="normal"
                  inputProps={{ step: '1' }}
                />
                <TextField
                  fullWidth
                  label="Deposit Amount (ksh)"
                  name="depositAmount"
                  type="number"
                  value={unitForm.depositAmount}
                  onChange={handleUnitChange}
                  error={!!errors.unit.depositAmount}
                  helperText={errors.unit.depositAmount}
                  variant="outlined"
                  size="small"
                  margin="normal"
                  inputProps={{ step: '1' }}
                />
                <TextField
                  fullWidth
                  label="Garbage Charge (ksh)"
                  name="garbageCharge"
                  type="number"
                  value={unitForm.garbageCharge}
                  onChange={handleUnitChange}
                  error={!!errors.unit.garbageCharge}
                  helperText={errors.unit.garbageCharge}
                  variant="outlined"
                  size="small"
                  margin="normal"
                  inputProps={{ step: '1' }}
                />
                <TextField
                  fullWidth
                  label="Service Charge (ksh)"
                  name="serviceCharge"
                  type="number"
                  value={unitForm.serviceCharge}
                  onChange={handleUnitChange}
                  error={!!errors.unit.serviceCharge}
                  helperText={errors.unit.serviceCharge}
                  variant="outlined"
                  size="small"
                  margin="normal"
                  inputProps={{ step: '1' }}
                />
                <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={unitForm.status}
                    onChange={handleUnitChange}
                    label="Status"
                  >
                    <MenuItem value="VACANT">Vacant</MenuItem>
                    <MenuItem value="OCCUPIED">Occupied</MenuItem>
                    <MenuItem value="OCCUPIED_PENDING_PAYMENT">Occupied (Pending Payment)</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading || buildingsLoading}
                    fullWidth
                  >
                    {loading ? 'Creating...' : 'Create Unit'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      console.log('Cancel button clicked, navigating to /properties');
                      navigate('/properties');
                    }}
                    fullWidth
                  >
                    Cancel
                  </Button>
                </Box>
              </form>
            )}
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

AddUnitScreen.propTypes = {
  buildingId: PropTypes.string,
};

export default AddUnitScreen;