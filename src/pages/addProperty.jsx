import  { useEffect, useState, Component } from 'react';
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

const AddPropertyScreen = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const theme = getTheme();
  const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://taqa.co.ke/api';

  const [buildingForm, setBuildingForm] = useState({
    landlordId: '',
    name: '',
    address: '',
    unitCount: '',
    managementRate: '',
    gasRate: '',
    waterRate: '',
  });
  const [landlords, setLandlords] = useState([]);
  const [landlordSearch, setLandlordSearch] = useState('');
  const [landlordsLoading, setLandlordsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [errors, setErrors] = useState({ building: {} });

  // Redirect to login if no user
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

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
    fetchLandlords();
  }, []);

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

  // Handle building form submission
  const handleBuildingSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateBuildingForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors({ building: validationErrors });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/building`, buildingForm, {
        withCredentials: true,
      });
      setSnackbarMessage(response.data.message);
      setSnackbarOpen(true);
      setTimeout(() => {
          navigate(-1);
      }, 2000);
      setBuildingForm({
        landlordId: '',
        name: '',
        address: '',
        unitCount: '',
        gasRate: '',
        managementRate: '',
        waterRate: '',
      });
      setErrors({ building: {} });
    } catch (error) {
      console.error('Error creating building:', error);
      setSnackbarMessage(error.response?.data?.message || 'Failed to create building');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleBuildingChange = (e) => {
    const { name, value } = e.target;
    setBuildingForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ building: { ...prev.building, [name]: '' } }));
  };

  // Filter landlords based on search input
  const filteredLandlords = landlords.filter((landlord) =>
    landlord.name.toLowerCase().includes(landlordSearch.toLowerCase())
  );

  return (
    <Box sx={{ bgcolor: theme?.palette?.background?.paper, minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ ml: 5 }}>
        <TitleComponent title="Create Property" />
      </Typography>

      <ErrorBoundary>
        <Box sx={{ ml: 5, mr: 5, maxWidth: 600 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Create New Building
            </Typography>
            <form onSubmit={handleBuildingSubmit}>
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

export default AddPropertyScreen;