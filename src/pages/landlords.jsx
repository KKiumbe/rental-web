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
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import TitleComponent from '../components/title';
import { getTheme } from '../store/theme';
import { useAuthStore } from '../store/authStore';

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
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
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [selectedLandlord, setSelectedLandlord] = useState(null); // For editing
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
      console.log('Fetched landlords:', response.data.landlords);
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

  // Handle form submission (Add or Edit)
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
      let response;
      if (dialogMode === 'add') {
        // Add new landlord
        response = await axios.post(`${BASE_URL}/landlord`, payload, {
          withCredentials: true,
        });
      } else {
        // Edit existing landlord
        response = await axios.put(`${BASE_URL}/landlord/${selectedLandlord.id}`, payload, {
          withCredentials: true,
        });
      }

     
if (response.status === 200 || response.status === 201) {
  console.log(`${dialogMode === 'add' ? 'Landlord created' : 'Landlord updated'} successfully, closing dialog...`);
  if (dialogMode === 'add') {
    setLandlords((prev) => [...prev, response.data.landlord]);
    setSnackbarMessage(response.data.message || 'Landlord added successfully');
  } else {
    setLandlords((prev) =>
      prev.map((landlord) =>
        landlord.id === selectedLandlord.id ? { ...landlord, ...payload } : landlord
      )
    );
    setSnackbarMessage(response.data.message || 'Landlord updated successfully');
  }
  setDialogOpen(false);
  setSnackbarOpen(true);
  setFormData({ firstName: '', lastName: '', email: '', phoneNumber: '', status: 'ACTIVE' });
  setDialogMode('add');
  setSelectedLandlord(null);
} else {
  console.log('Unexpected response status:', response.status);
  setSnackbarMessage('Unexpected response status: ' + response.status);
  setSnackbarOpen(true);
}
    } catch (err) {
      console.error(`Error ${dialogMode === 'add' ? 'adding' : 'updating'} landlord:`, err);
      if (err.response) {
        const { status, data } = err.response;
        if (status === 400) {
          setErrors({ server: data?.message || 'Invalid input. Please check your details.' });
          setSnackbarMessage(data?.message || 'Invalid input. Please check your details.');
        } else if (status === 401) {
          setSnackbarMessage('Unauthorized. Redirecting to login...');
          setDialogOpen(false);
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setErrors({ server: 'Something went wrong. Please try again later.' });
          setSnackbarMessage('Something went wrong. Please try again later.');
        }
      } else {
        setErrors({ server: 'Network error. Please check your connection.' });
        setSnackbarMessage('Network error. Please check your connection.');
      }
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Open dialog for adding
  const handleOpenDialog = () => {
    setDialogMode('add');
    setSelectedLandlord(null);
    setFormData({ firstName: '', lastName: '', email: '', phoneNumber: '', status: 'ACTIVE' });
    setDialogOpen(true);
  };

  // Open dialog for editing
  const handleEditLandlord = (landlord) => {
    setDialogMode('edit');
    setSelectedLandlord(landlord);
    setFormData({
      firstName: landlord.firstName,
      lastName: landlord.lastName,
      email: landlord.email || '',
      phoneNumber: landlord.phoneNumber,
      status: landlord.status,
    });
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    console.log('Closing dialog manually...');
    setDialogOpen(false);
    setFormData({ firstName: '', lastName: '', email: '', phoneNumber: '', status: 'ACTIVE' });
    setErrors({});
    setDialogMode('add');
    setSelectedLandlord(null);
  };

  // Navigate to landlord details
  const handleViewLandlord = (id) => {
    navigate(`/landlord/${id}`);
  };



  const formatDate = (dateString) => {
  if (!dateString) {
    console.warn('Missing dateString in formatDate');
    return 'N/A';
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.warn('Invalid dateString in formatDate:', dateString);
    return 'Invalid Date';
  }
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
};

  // Render add/edit landlord form
  const renderLandlordForm = () => (
    <form onSubmit={handleSubmit}>
      {errors.server && (
        <Typography color="error" sx={{ mb: 2 }}>
          {errors.server}
        </Typography>
      )}
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth variant="outlined" size="small" error={!!errors.status} disabled={loading}>
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
        <Paper sx={{  p: 4, mx: 'auto', mt: 5,ml:5 }}>
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
                    <TableCell>View</TableCell>
                    <TableCell>Edit</TableCell>
                    <TableCell>First Name</TableCell>
                    <TableCell>Last Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone Number</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created At</TableCell>
                   
                  </TableRow>
                </TableHead>

                <TableBody>
  {landlords.map((landlord) => {
    if (!landlord || !landlord.id || !landlord.createdAt) {
      console.warn('Invalid landlord object:', landlord);
      return null;
    }
    console.log('Landlord createdAt:', landlord.createdAt);
    return (
      <TableRow key={landlord.id}>
        <TableCell>
          <IconButton onClick={() => handleViewLandlord(landlord.id)} title="View">
            <VisibilityIcon color="info" />
          </IconButton>
        </TableCell>
        <TableCell>
          <IconButton onClick={() => handleEditLandlord(landlord)} title="Edit">
            <EditIcon color="primary" />
          </IconButton>
        </TableCell>
        <TableCell>{landlord.firstName}</TableCell>
        <TableCell>{landlord.lastName}</TableCell>
        <TableCell>{landlord.email || 'N/A'}</TableCell>
        <TableCell>{landlord.phoneNumber}</TableCell>
        <TableCell>{landlord.status}</TableCell>
        <TableCell>{formatDate(landlord.createdAt)}</TableCell>
      </TableRow>
    );
  }).filter(Boolean)}
</TableBody>
              
              </Table>
            </TableContainer>
          )}
        </Paper>
      </ErrorBoundary>

      {/* Add/Edit Landlord Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Landlord' : 'Edit Landlord'}
          <CloseIcon
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: theme?.palette?.grey[500],
              cursor: 'pointer',
              '&:hover': {
                color: theme?.palette?.grey[700],
              },
            }}
          />
        </DialogTitle>
        <DialogContent>
          {renderLandlordForm()}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            sx={{ color: theme?.palette?.grey[300] }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{ backgroundColor: theme?.palette?.greenAccent?.main, color: '#fff' }}
          >
            {loading ? <CircularProgress size={24} /> : dialogMode === 'add' ? 'Add Landlord' : 'Update Landlord'}
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