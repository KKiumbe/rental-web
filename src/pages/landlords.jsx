import React, { useEffect, useState, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Snackbar,
  CircularProgress,
  styled,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TitleComponent from '../components/title';
import { getTheme } from '../store/theme';
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

export default function LandlordsScreen() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const theme = getTheme();
  const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://taqa.co.ke/api';

  const [landlords, setLandlords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    status: 'ACTIVE',
  });
  const [errors, setErrors] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Redirect to login if no user
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Fetch landlords on mount
  const fetchLandlords = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/landlords`, {
        withCredentials: true,
      });
      setLandlords(response.data.landlords || []);
    } catch (error) {
      console.error('Error fetching landlords:', error);
      setSnackbarMessage(error.response?.data?.message || 'Failed to load landlords');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchLandlords();
    }
  }, [currentUser]);

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.phoneNumber && !/^\+?\d{10,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }
    if (!['ACTIVE', 'INACTIVE'].includes(formData.status)) {
      newErrors.status = 'Invalid status';
    }
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSnackbarMessage('');

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!currentUser?.tenantId) {
      setSnackbarMessage('Tenant ID is missing. Please log in again.');
      setSnackbarOpen(true);
      return;
    }

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email || null,
      phoneNumber: formData.phoneNumber,
      status: formData.status,
    };

    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/landlords`, payload, {
        withCredentials: true,
      });
      setLandlords((prev) => [...prev, response.data.landlord]);
      setSnackbarMessage(response.data.message || 'Landlord added successfully');
      setSnackbarOpen(true);
      setDialogOpen(false);
      setFormData({ firstName: '', lastName: '', email: '', phoneNumber: '', status: 'ACTIVE' });
    } catch (err) {
      console.error('Error adding landlord:', err);
      if (err.response) {
        const { status, data } = err.response;
        if (status === 400) {
          setSnackbarMessage(data?.message || 'Invalid input. Please check your details.');
        } else if (status === 401) {
          setSnackbarMessage('Unauthorized. Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setSnackbarMessage('Something went wrong. Please try again later.');
        }
      } else {
        setSnackbarMessage('Network error. Please check your connection.');
      }
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Open/close dialog
  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({ firstName: '', lastName: '', email: '', phoneNumber: '', status: 'ACTIVE' });
    setErrors({});
  };

  // Render add landlord form
  const renderAddLandlordForm = () => (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="First Name *"
            name="firstName"
            value={formData.firstName}
            onChange={handleFormChange}
            error={!!errors.firstName}
            helperText={errors.firstName}
            variant="outlined"
            size="small"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Last Name *"
            name="lastName"
            value={formData.lastName}
            onChange={handleFormChange}
            error={!!errors.lastName}
            helperText={errors.lastName}
            variant="outlined"
            size="small"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleFormChange}
            error={!!errors.email}
            helperText={errors.email}
            variant="outlined"
            size="small"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Phone Number *"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleFormChange}
            error={!!errors.phoneNumber}
            helperText={errors.phoneNumber}
            variant="outlined"
            size="small"
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth variant="outlined" size="small" error={!!errors.status}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleFormChange}
              label="Status"
            >
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>
            {errors.status && (
              <Typography color="error" variant="caption">
                {errors.status}
              </Typography>
            )}
          </FormControl>
        </Grid>
      </Grid>
    </form>
  );

  return (
    <Box sx={{ bgcolor: theme?.palette?.background?.paper, minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ ml: 5 }}>
        <TitleComponent title="Landlords" />
      </Typography>

      <ErrorBoundary>
        <Paper sx={{ width: '80%', maxWidth: 900, p: 4, mx: 'auto', mt: 5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">All Landlords</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              sx={{ backgroundColor: theme?.palette?.greenAccent?.main, color: '#fff' }}
            >
              Add Landlord
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : landlords.length === 0 ? (
            <Typography color="textSecondary" sx={{ p: 2 }}>
              No landlords found.
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>First Name</TableCell>
                    <TableCell>Last Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone Number</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {landlords.map((landlord) => (
                    <TableRow key={landlord.id}>
                      <TableCell>{landlord.firstName}</TableCell>
                      <TableCell>{landlord.lastName}</TableCell>
                      <TableCell>{landlord.email || 'N/A'}</TableCell>
                      <TableCell>{landlord.phoneNumber}</TableCell>
                      <TableCell>{landlord.status}</TableCell>
                      <TableCell>
                        {new Date(landlord.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </ErrorBoundary>

      {/* Add Landlord Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Landlord</DialogTitle>
        <DialogContent>
          {renderAddLandlordForm()}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            sx={{ color: theme?.palette?.grey[300] }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{ backgroundColor: theme?.palette?.greenAccent?.main, color: '#fff' }}
          >
            {loading ? 'Adding...' : 'Add Landlord'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}