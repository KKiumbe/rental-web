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
import { useNavigate } from 'react-router-dom';
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

const CreatePropertyAndUnitsScreen = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const theme = getTheme();
  const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://taqa.co.ke/api';

  const [formType, setFormType] = useState('');
  const [buildingForm, setBuildingForm] = useState({
    landlordId: '',
    name: '',
    address: '',
    unitCount: '',
    managementRate: '',
    gasRate: '',
    waterRate: '',
  });
  const [unitForm, setUnitForm] = useState({
    buildingId: '',
    unitNumber: '',
    monthlyCharge: '',
    depositAmount: '',
    garbageCharge: '',
    serviceCharge: '',
    status: 'VACANT',
  });
  const [buildings, setBuildings] = useState([]);
  const [landlords, setLandlords] = useState([]);
  const [landlordSearch, setLandlordSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [landlordsLoading, setLandlordsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [errors, setErrors] = useState({ building: {}, unit: {} });

  // Redirect to login if no user
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Fetch buildings for unit form
  const fetchBuildings = async () => {
    try {
      setBuildingsLoading(true);
      const response = await axios.get(`${BASE_URL}/buildings`, {
        params: { minimal: true },
        withCredentials: true,
      });
      setBuildings(response.data.buildings || []);
    } catch (error) {
      console.error('Error fetching buildings:', error);
      setSnackbarMessage('Failed to load buildings');
      setSnackbarOpen(true);
    } finally {
      setBuildingsLoading(false);
    }
  };

  // Fetch landlords for building form
  const fetchLandlords = async () => {
    try {
      setLandlordsLoading(true);
      const response = await axios.get(`${BASE_URL}/landlords`, {
        withCredentials: true,
      });
      setLandlords(response.data.landlords || []);
    } catch (error) {
      console.error('Error fetching landlords:', error);
      setSnackbarMessage('Failed to load landlords');
      setSnackbarOpen(true);
    } finally {
      setLandlordsLoading(false);
    }
  };

  useEffect(() => {
    if (formType === 'unit' && buildings.length === 0) {
      fetchBuildings();
    } else if (formType === 'building' && landlords.length === 0) {
      fetchLandlords();
    }
  }, [formType]);

  // Validate building form
  const validateBuildingForm = () => {
    const newErrors = {};
    if (!buildingForm.landlordId) newErrors.landlordId = 'Landlord is required';
    if (!buildingForm.name) newErrors.name = 'Building name is required';
    if (buildingForm.unitCount && (isNaN(buildingForm.unitCount) || buildingForm.unitCount < 0)) {
      newErrors.unitCount = 'Must be a non-negative number';
    }
    if (buildingForm.managementRate && (isNaN(buildingForm.managementRate) || buildingForm.managementRate < 0)) {
      newErrors.managementRate = 'Must be a non-negative number';
    }
    if (buildingForm.gasRate && (isNaN(buildingForm.gasRate) || buildingForm.gasRate < 0)) {
      newErrors.gasRate = 'Must be a non-negative number';
    }
    if (buildingForm.waterRate && (isNaN(buildingForm.waterRate) || buildingForm.waterRate < 0)) {
      newErrors.waterRate = 'Must be a non-negative number';
    }
    return newErrors;
  };

  // Validate unit form
  const validateUnitForm = () => {
    const newErrors = {};
    if (!unitForm.buildingId) newErrors.buildingId = 'Building is required';
    if (!unitForm.unitNumber) newErrors.unitNumber = 'Unit number is required';
    if (!unitForm.monthlyCharge || isNaN(unitForm.monthlyCharge) || unitForm.monthlyCharge < 0) {
      newErrors.monthlyCharge = 'Must be a non-negative number';
    }
    if (!unitForm.depositAmount || isNaN(unitForm.depositAmount) || unitForm.depositAmount < 0) {
      newErrors.depositAmount = 'Must be a non-negative number';
    }
    if (unitForm.garbageCharge && (isNaN(unitForm.garbageCharge) || unitForm.garbageCharge < 0)) {
      newErrors.garbageCharge = 'Must be a non-negative number';
    }
    if (unitForm.serviceCharge && (isNaN(unitForm.serviceCharge) || unitForm.serviceCharge < 0)) {
      newErrors.serviceCharge = 'Must be a non-negative number';
    }
    return newErrors;
  };

  // Handle building form submission
  const handleBuildingSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateBuildingForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors((prev) => ({ ...prev, building: validationErrors }));
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/building`, buildingForm, {
        withCredentials: true,
      });
      setSnackbarMessage(response.data.message);
      setSnackbarOpen(true)
      setTimeout(() => {
        navigate('/properties');
      }, 2000);;
      setBuildingForm({
        landlordId: '',
        name: '',
        address: '',
        unitCount: '',
        gasRate: '',
        managementRate: '',
        waterRate: '',
      });
      setErrors((prev) => ({ ...prev, building: {} }));
      setFormType('');
      await fetchBuildings(); // Refresh buildings
    } catch (error) {
      console.error('Error creating building:', error);
      setSnackbarMessage(error.response?.data?.message || 'Failed to create building');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle unit form submission
  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateUnitForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors((prev) => ({ ...prev, unit: validationErrors }));
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/create-unit`, unitForm, {
        withCredentials: true,
      });
      setSnackbarMessage(response.data.message);
      setSnackbarOpen(true);

      setTimeout(() => {
        navigate('/properties');
      }, 2000);
      setUnitForm({
        buildingId: '',
        unitNumber: '',
        monthlyCharge: '',
        depositAmount: '',
        garbageCharge: '',
        serviceCharge: '',
        status: 'VACANT',
      });
      setErrors((prev) => ({ ...prev, unit: {} }));
      setFormType('');
    } catch (error) {
      console.error('Error creating unit:', error);
      setSnackbarMessage(error.response?.data?.message || 'Failed to create unit');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleBuildingChange = (e) => {
    const { name, value } = e.target;
    setBuildingForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, building: { ...prev.building, [name]: '' } }));
  };

  const handleUnitChange = (e) => {
    const { name, value } = e.target;
    setUnitForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, unit: { ...prev.unit, [name]: '' } }));
  };

  // Filter landlords based on search input
  const filteredLandlords = landlords.filter((landlord) =>
    landlord.name.toLowerCase().includes(landlordSearch.toLowerCase())
  );

  return (
    <Box sx={{ bgcolor: theme?.palette?.background?.paper, minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ ml: 5 }}>
        <TitleComponent title="Create Property or Unit" />
      </Typography>

      <ErrorBoundary>
        <Box sx={{ ml: 5, mr: 5, maxWidth: 600 }}>
          <Paper sx={{ p: 3 }}>
            {!formType ? (
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Create</InputLabel>
                <Select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  label="Create"
                >
                  <MenuItem value="">
                    <em>Select an option</em>
                  </MenuItem>
                  <MenuItem value="building">Building</MenuItem>
                  <MenuItem value="unit">Unit</MenuItem>
                </Select>
              </FormControl>
            ) : formType === 'building' ? (
              <>
                <Typography variant="h6" gutterBottom>
                  Create New Building
                </Typography>
                <form onSubmit={handleBuildingSubmit}>
                  {/* Landlord Dropdown */}
                  <FormControl
                    fullWidth
                    variant="outlined"
                    size="small"
                    error={!!errors.building.landlordId}
                    sx={{ mb: 2 }}
                  >
                    <InputLabel>Landlord *</InputLabel>
                    <Select
                      name="landlordId"
                      value={buildingForm.landlordId}
                      onChange={handleBuildingChange}
                      label="Landlord *"
                      disabled={landlordsLoading}
                    >
                      <MenuItem value="">
                        <em>{landlordsLoading ? 'Loading...' : 'Select a landlord'}</em>
                      </MenuItem>
                      {filteredLandlords.map((landlord) => (
                        <MenuItem key={landlord.id} value={landlord.id}>
                          {landlord.name} ({landlord.phoneNumber})
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.building.landlordId && (
                      <Typography color="error" variant="caption">
                        {errors.building.landlordId}
                      </Typography>
                    )}
                  </FormControl>

                  {/* Search Input for Landlords */}
                  <TextField
                    fullWidth
                    label="Search Landlords"
                    value={landlordSearch}
                    onChange={(e) => setLandlordSearch(e.target.value)}
                    variant="outlined"
                    size="small"
                    margin="normal"
                    placeholder="Type name to filter..."
                  />

                  <TextField
                    fullWidth
                    label="Building Name"
                    name="name"
                    value={buildingForm.name}
                    onChange={handleBuildingChange}
                    error={!!errors.building.name}
                    helperText={errors.building.name}
                    variant="outlined"
                    size="small"
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={buildingForm.address}
                    onChange={handleBuildingChange}
                    variant="outlined"
                    size="small"
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Unit Count"
                    name="unitCount"
                    type="number"
                    value={buildingForm.unitCount}
                    onChange={handleBuildingChange}
                    error={!!errors.building.unitCount}
                    helperText={errors.building.unitCount}
                    variant="outlined"
                    size="small"
                    margin="normal"
                  />

                  <TextField
                    fullWidth
                    label="Management Rate ($)"
                    name="managementRate"
                    type="number"
                    value={buildingForm.managementRate}
                    onChange={handleBuildingChange}
                    error={!!errors.building.managementRate}
                    helperText={errors.building.managementRate}
                    variant="outlined"
                    size="small"
                    margin="normal"
                    inputProps={{ step: '0.01' }}
                  />
                  <TextField
                    fullWidth
                    label="Gas Rate ($)"
                    name="gasRate"
                    type="number"
                    value={buildingForm.gasRate}
                    onChange={handleBuildingChange}
                    error={!!errors.building.gasRate}
                    helperText={errors.building.gasRate}
                    variant="outlined"
                    size="small"
                    margin="normal"
                    inputProps={{ step: '0.01' }}
                  />
                  <TextField
                    fullWidth
                    label="Water Rate ($)"
                    name="waterRate"
                    type="number"
                    value={buildingForm.waterRate}
                    onChange={handleBuildingChange}
                    error={!!errors.building.waterRate}
                    helperText={errors.building.waterRate}
                    variant="outlined"
                    size="small"
                    margin="normal"
                    inputProps={{ step: '0.01' }}
                  />
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                      fullWidth
                    >
                      {loading ? 'Creating...' : 'Create Building'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setFormType('')}
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </Box>
                </form>
              </>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  Create New Unit
                </Typography>
                {buildingsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <form onSubmit={handleUnitSubmit}>
                    <FormControl
                      fullWidth
                      variant="outlined"
                      size="small"
                      error={!!errors.unit.buildingId}
                      sx={{ mb: 2 }}
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
                        {buildings.map((building) => (
                          <MenuItem key={building.id} value={building.id}>
                            {building.buildingName} (Landlord: {building.landlord?.name || 'Unknown'})
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
                      label="Monthly Charge ($)"
                      name="monthlyCharge"
                      type="number"
                      value={unitForm.monthlyCharge}
                      onChange={handleUnitChange}
                      error={!!errors.unit.monthlyCharge}
                      helperText={errors.unit.monthlyCharge}
                      variant="outlined"
                      size="small"
                      margin="normal"
                      inputProps={{ step: '0.01' }}
                    />
                    <TextField
                      fullWidth
                      label="Deposit Amount ($)"
                      name="depositAmount"
                      type="number"
                      value={unitForm.depositAmount}
                      onChange={handleUnitChange}
                      error={!!errors.unit.depositAmount}
                      helperText={errors.unit.depositAmount}
                      variant="outlined"
                      size="small"
                      margin="normal"
                      inputProps={{ step: '0.01' }}
                    />
                    <TextField
                      fullWidth
                      label="Garbage Charge ($)"
                      name="garbageCharge"
                      type="number"
                      value={unitForm.garbageCharge}
                      onChange={handleUnitChange}
                      error={!!errors.unit.garbageCharge}
                      helperText={errors.unit.garbageCharge}
                      variant="outlined"
                      size="small"
                      margin="normal"
                      inputProps={{ step: '0.01' }}
                    />
                    <TextField
                      fullWidth
                      label="Service Charge ($)"
                      name="serviceCharge"
                      type="number"
                      value={unitForm.serviceCharge}
                      onChange={handleUnitChange}
                      error={!!errors.unit.serviceCharge}
                      helperText={errors.unit.serviceCharge}
                      variant="outlined"
                      size="small"
                      margin="normal"
                      inputProps={{ step: '0.01' }}
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
                        onClick={() => setFormType('')}
                        fullWidth
                      >
                        Cancel
                      </Button>
                    </Box>
                  </form>
                )}
              </>
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

export default CreatePropertyAndUnitsScreen;