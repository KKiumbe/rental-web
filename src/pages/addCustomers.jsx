import { useEffect, useState, Component } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Grid,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  styled,
  Alert,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import TitleComponent from '../components/title';
import { getTheme } from '../store/theme';
import { useAuthStore } from '../store/authStore';

// Custom Step Connector
const ContinuousStepConnector = styled(StepConnector)(({ theme }) => ({
  '& .MuiStepConnector-line': {
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: theme?.palette?.grey[400] || '#B0B0B0',
    margin: '0 10px',
  },
}));

// Error Boundary Component
import PropTypes from 'prop-types';

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

export default function CreateCustomerScreen() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const theme = getTheme();
  const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://taqa.co.ke/api';

  const [activeStep, setActiveStep] = useState(0);
  const [customerId, setCustomerId] = useState(null);
  const [formData, setFormData] = useState({
    unitId: '',
    buildingId: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    secondaryPhoneNumber: '',
    nationalId: '',
  });
  const [invoiceData, setInvoiceData] = useState({
    invoiceItems: [{ description: '', amount: '', quantity: 1 }],
  });
  const [utilityReadings, setUtilityReadings] = useState([
    { type: 'water', reading: '' },
  ]);
  const [buildings, setBuildings] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [bulkBuildingId, setBulkBuildingId] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [bulkErrors, setBulkErrors] = useState([]);

  // Redirect to login if no user
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Fetch buildings on mount
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

  // Fetch units when building is selected
  const fetchUnits = async (buildingId) => {
    try {
      setUnitsLoading(true);
      const response = await axios.get(`${BASE_URL}/buildings/${buildingId}`, {
        withCredentials: true,
      });
      setUnits(response.data.units || []);
    } catch (error) {
      console.error('Error fetching units:', error);
      setSnackbarMessage(error.response?.data?.message || 'Failed to load units');
      setSnackbarOpen(true);
    } finally {
      setUnitsLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  useEffect(() => {
    if (selectedBuildingId) {
      fetchUnits(selectedBuildingId);
    } else {
      setUnits([]);
      setFormData((prev) => ({ ...prev, unitId: '' }));
    }
  }, [selectedBuildingId]);

  // Handle customer form input changes
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Handle invoice form input changes
  const handleInvoiceChange = (index, field, value) => {
    setInvoiceData((prev) => {
      const newItems = [...prev.invoiceItems];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, invoiceItems: newItems };
    });
    setErrors((prev) => ({ ...prev, [`item${index}_${field}`]: '' }));
  };

  // Handle utility reading input changes
  const handleUtilityChange = (index, field, value) => {
    setUtilityReadings((prev) => {
      const newReadings = [...prev];
      newReadings[index] = { ...newReadings[index], [field]: value };
      return newReadings;
    });
    setErrors((prev) => ({ ...prev, [`reading${index}_${field}`]: '' }));
  };

  // Add new invoice item
  const addItem = () => {
    setInvoiceData((prev) => ({
      ...prev,
      invoiceItems: [...prev.invoiceItems, { description: '', amount: '', quantity: 1 }],
    }));
  };

  // Remove invoice item
  const removeItem = (index) => {
    setInvoiceData((prev) => ({
      ...prev,
      invoiceItems: prev.invoiceItems.filter((_, i) => i !== index),
    }));
  };

  // Add new utility reading
  const addUtilityReading = () => {
    setUtilityReadings((prev) => [...prev, { type: 'water', reading: '' }]);
  };

  // Remove utility reading
  const removeUtilityReading = (index) => {
    setUtilityReadings((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle building selection for single customer
 
const handleBuildingChange = (e) => {
  const selectedId = e.target.value;
  setSelectedBuildingId(selectedId);
  setFormData((prev) => ({
    ...prev,
    buildingId: selectedId, // ✅ include in payload
    unitId: '', // clear unit selection when building changes
  }));
};



  // Handle building selection for bulk upload
  const handleBulkBuildingChange = (e) => {
    setBulkBuildingId(e.target.value);
  };

  // Handle file selection for bulk upload
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && !['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(selectedFile.type)) {
      setSnackbarMessage('Invalid file type. Please upload a CSV or Excel file.');
      setSnackbarOpen(true);
      return;
    }
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      setSnackbarMessage('File size exceeds 5MB limit.');
      setSnackbarOpen(true);
      return;
    }
    setFile(selectedFile);
    setBulkErrors([]);
  };

  // Handle template download
  const handleTemplateDownload = async (e) => {
    e.preventDefault(); // Prevent React Router navigation
    try {
      const response = await fetch(`${BASE_URL}/templates/customers.csv`, { credentials: 'include' });
      if (!response.ok) throw new Error('Template file not found');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customers.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setSnackbarMessage('Template downloaded successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error downloading template:', error);
      setSnackbarMessage('Failed to download template. Please contact support.');
      setSnackbarOpen(true);
    }
  };

  // Handle bulk upload submission
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkBuildingId) {
      setSnackbarMessage('Please select a building for bulk upload');
      setSnackbarOpen(true);
      return;
    }
    if (!file) {
      setSnackbarMessage('Please select a file to upload');
      setSnackbarOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('buildingId', bulkBuildingId);

    setBulkLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/upload-customers-withbuildingId`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSnackbarMessage(response.data.message || 'Bulk upload completed successfully');
      setSnackbarOpen(true);
      if (response.data.errors && response.data.errors.length > 0) {
        setBulkErrors(response.data.errors);
      }
      setFile(null);
      setBulkBuildingId('');
    } catch (err) {
      console.error('Error uploading file:', err);
      setSnackbarMessage(
        err.response?.data?.message || 'Failed to upload customers. Please try again.'
      );
      setSnackbarOpen(true);
      if (err.response?.data?.errors) {
        setBulkErrors(err.response.data.errors);
      }
    } finally {
      setBulkLoading(false);
    }
  };

  // Validate customer form
  const validateCustomerForm = () => {
    const newErrors = {};
    if (!formData.unitId) newErrors.unitId = 'Unit is required';
    if (!formData.buildingId) newErrors.buildingId = 'Building is required';
    if (!formData.firstName && !formData.lastName) {
      newErrors.firstName = 'At least one of firstName or lastName is required';
    }
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.phoneNumber && !/^\+?\d{10,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }
    if (
      formData.secondaryPhoneNumber &&
      !/^\+?\d{10,15}$/.test(formData.secondaryPhoneNumber)
    ) {
      newErrors.secondaryPhoneNumber = 'Invalid secondary phone number format';
    }
    return newErrors;
  };

  // Validate invoice form (optional)
  const validateInvoiceForm = () => {
    const newErrors = {};
    if (invoiceData.invoiceItems.length > 0) {
      invoiceData.invoiceItems.forEach((item, index) => {
        if (!item.description) {
          newErrors[`item${index}_description`] = 'Description is required';
        }
        if (!item.amount || item.amount <= 0) {
          newErrors[`item${index}_amount`] = 'Valid amount is required';
        }
        if (!item.quantity || item.quantity <= 0) {
          newErrors[`item${index}_quantity`] = 'Valid quantity is required';
        }
      });
    }
    return newErrors;
  };

  // Validate utility readings (optional)
  const validateUtilityReadings = () => {
    const newErrors = {};
    utilityReadings.forEach((reading, index) => {
      if (reading.reading && (isNaN(reading.reading) || reading.reading < 0)) {
        newErrors[`reading${index}_reading`] = 'Reading must be a non-negative number';
      }
    });
    return newErrors;
  };

  // Handle customer form submission (Step 1)
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSnackbarMessage('');

    const validationErrors = validateCustomerForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!currentUser?.tenantId) {
      setSnackbarMessage('Tenant ID is missing. Please log in again.');
      setSnackbarOpen(true);
      return;
    }

    const customerData = {
      ...formData,
      tenantId: currentUser.tenantId,
      unitId: formData.unitId || null,
    };

    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/customers`, customerData, {
        withCredentials: true,
      });
      setCustomerId(response.data.data.id);
      setSnackbarMessage(response.data.message || 'Customer created successfully');
      setSnackbarOpen(true);
      setActiveStep(1);
    } catch (err) {
      console.error('Error adding customer:', err);
      setSnackbarMessage(
        err.response?.data?.message || 'Failed to create customer. Please try again.'
      );
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle invoice form submission (Step 2, optional)
  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSnackbarMessage('');

    const validationErrors = validateInvoiceForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (invoiceData.invoiceItems.length === 0) {
      setSnackbarMessage('No invoice items provided. Proceeding to utility readings.');
      setSnackbarOpen(true);
      setActiveStep(2);
      return;
    }

    const invoicePayload = {
      customerId,
      isSystemGenerated: false,
      invoiceItems: invoiceData.invoiceItems,
    };

    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/customer-onboarding-invoice`, invoicePayload, {
        withCredentials: true,
      });
      setSnackbarMessage(response.data.message || 'Invoice created successfully');
      setSnackbarOpen(true);
      setActiveStep(2);
    } catch (err) {
      console.error('Error creating invoice:', err);
      setSnackbarMessage(
        err.response?.data?.message || 'Failed to create invoice. Please try again.'
      );
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Skip invoice creation (Step 2)
  const handleSkipInvoice = () => {
    setSnackbarMessage('Invoice creation skipped');
    setSnackbarOpen(true);
    setActiveStep(2);
  };

  // Handle utility readings submission (Step 3)
  const handleUtilitySubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSnackbarMessage('');

    const validationErrors = validateUtilityReadings();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      let readingsSubmitted = false;
      for (const reading of utilityReadings) {
        if (reading.reading && !isNaN(reading.reading) && reading.reading >= 0) {
          const endpoint = reading.type === 'water' ? '/water-reading' : '/gas-reading';
          await axios.post(
            `${BASE_URL}${endpoint}`,
            {
              customerId,
              reading: parseFloat(reading.reading),
            },
            { withCredentials: true }
          );
          readingsSubmitted = true;
        }
      }
      setSnackbarMessage(
        readingsSubmitted ? 'Utility readings saved successfully' : 'No valid readings provided'
      );
      setSnackbarOpen(true);
      setActiveStep(3);
    } catch (err) {
      console.error('Error saving utility readings:', err);
      setSnackbarMessage(
        err.response?.data?.message || 'Failed to save utility readings. Please try again.'
      );
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Skip utility readings (Step 3)
  const handleSkipUtility = () => {
    setSnackbarMessage('Utility readings skipped');
    setSnackbarOpen(true);
    setActiveStep(3);
  };

  // Handle confirmation (Step 4)
  const handleConfirmation = () => {
    setSnackbarMessage('Customer onboarding completed');
    setSnackbarOpen(true);
    setTimeout(() => {
      navigate(`/customer-details/${customerId}`);
    }, 2000);
  };

  // Render bulk upload form with notification
  const renderBulkUploadForm = () => (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Bulk Upload Customers
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Required Fields and Formats:</strong>
          <ul>
            <li>
              <strong>phoneNumber</strong> (Required): 10-15 digits, optionally starting with + (e.g., 0722324076 or +254722324076). Rows with missing or duplicate phone numbers are skipped.
            </li>
            <li>
              <strong>unitNumber</strong> (Required): Unique unit identifier (e.g., A101, Unit-1). Must not already exist for the selected building.
            </li>
            <li>
              <strong>firstName</strong> (Optional): Customers first name. At least one of firstName or lastName is required.
            </li>
            <li>
              <strong>lastName</strong> (Optional): Customers last name. If firstName is missing, lastName is used for both.
            </li>
            <li>
              <strong>email</strong> (Optional): Valid email format (e.g., john.doe@example.com).
            </li>
            <li>
              <strong>closingBalance</strong> (Optional): Non-negative number for initial balance (e.g., 1000.50).
            </li>
          </ul>
          <strong>Accepted File Formats:</strong> CSV or Excel (.csv, .xlsx).
          <br />
          <Button
            variant="text"
            onClick={handleTemplateDownload}
            sx={{ padding: 0, textTransform: 'none', color: theme?.palette?.primary?.contrastText }}
          >
            Download Sample CSV Template
          </Button>
        </Typography>
      </Alert>
      <form onSubmit={handleBulkUpload}>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Building</InputLabel>
              <Select
                value={bulkBuildingId}
                onChange={handleBulkBuildingChange}
                label="Building"
                disabled={buildingsLoading || bulkLoading}
              >
                <MenuItem value="">
                  <em>{buildingsLoading ? 'Loading...' : 'Select a building'}</em>
                </MenuItem>
                {buildings.map((building) => (
                  <MenuItem key={building.id} value={building.id}>
                    {building.buildingName} (Landlord: {building.landlord?.name || 'Unknown'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadFileIcon />}
              fullWidth
              disabled={bulkLoading}
              sx={{ backgroundColor: theme?.palette?.greenAccent?.main, color: '#fff' }}
            >
              {file ? file.name : 'Choose File'}
              <input type="file" hidden accept=".csv,.xlsx" onChange={handleFileChange} />
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              type="submit"
              fullWidth
              disabled={bulkLoading || !file || !bulkBuildingId}
              sx={{ backgroundColor: theme?.palette?.greenAccent?.main, color: '#fff' }}
            >
              {bulkLoading ? <CircularProgress size={24} color="inherit" /> : 'Upload Customers'}
            </Button>
          </Grid>
        </Grid>
      </form>
      {bulkErrors.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" color="error">
            Upload Errors
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Row</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bulkErrors.map((error, index) => (
                  <TableRow key={index}>
                    <TableCell>{error.row}</TableCell>
                    <TableCell>{error.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );

  // Stepper steps
  const steps = [
    'Step 1: Customer Details',
    'Step 2: Create Invoice',
    'Step 3: Utility Readings',
    'Step 4: Confirmation',
  ];

  // Render customer form (Step 1)
  const renderCustomerForm = () => (
    <form onSubmit={handleCustomerSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel>Building</InputLabel>
            <Select
              value={selectedBuildingId}
              onChange={handleBuildingChange}
              label="Building"
              disabled={buildingsLoading}
            >
              <MenuItem value="">
                <em>{buildingsLoading ? 'Loading...' : 'Select a building'}</em>
              </MenuItem>
              {buildings.map((building) => (
                <MenuItem key={building.id} value={building.id}>
                  {building.buildingName} (Landlord: {building.landlord?.name || 'Unknown'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
    
<Grid item xs={12}>
  <FormControl
    fullWidth
    variant="outlined"
    size="small"
    error={!!errors.unitId}
    disabled={!selectedBuildingId || unitsLoading}
  >
    <InputLabel>Unit</InputLabel>
    <Select
      name="unitId"
      value={formData.unitId}
      onChange={handleCustomerChange}
      label="Unit"
    >
      <MenuItem value="">
        <em>{unitsLoading ? 'Loading...' : units.length === 0 ? 'No units available' : 'Select a unit'}</em>
      </MenuItem>
      {units.map((unit) => (
        <MenuItem 
          key={unit.id} 
          value={unit.id}
          disabled={unit.status === 'OCCUPIED'}
          sx={{
            color: unit.status === 'OCCUPIED' ? 'text.disabled' : 'text.primary',
            backgroundColor: unit.status === 'OCCUPIED' ? 'action.disabledBackground' : 'inherit',
            '&:hover': {
              backgroundColor: unit.status === 'OCCUPIED' ? 'action.disabledBackground' : 'action.hover',
            }
          }}
        >
          {unit.unitNumber} {unit.status === 'OCCUPIED' ? '(Occupied)' : ''}
        </MenuItem>
      ))}
    </Select>
    {errors.unitId && (
      <Typography color="error" variant="caption">
        {errors.unitId}
      </Typography>
    )}
  </FormControl>
</Grid>

        <Grid item xs={6}>
          <TextField
            fullWidth
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleCustomerChange}
            error={!!errors.firstName}
            helperText={errors.firstName}
            variant="outlined"
            size="small"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleCustomerChange}
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
            onChange={handleCustomerChange}
            error={!!errors.email}
            helperText={errors.email}
            variant="outlined"
            size="small"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Phone Number *"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleCustomerChange}
            error={!!errors.phoneNumber}
            helperText={errors.phoneNumber}
            variant="outlined"
            size="small"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Secondary Phone Number"
            name="secondaryPhoneNumber"
            value={formData.secondaryPhoneNumber}
            onChange={handleCustomerChange}
            error={!!errors.secondaryPhoneNumber}
            helperText={errors.secondaryPhoneNumber}
            variant="outlined"
            size="small"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="National ID"
            name="nationalId"
            value={formData.nationalId}
            onChange={handleCustomerChange}
            error={!!errors.nationalId}
            helperText={errors.nationalId}
            variant="outlined"
            size="small"
          />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/customers')}
          fullWidth
          sx={{ color: theme?.palette?.grey[300], borderColor: theme?.palette?.grey[300] }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          type="submit"
          fullWidth
          disabled={loading}
          sx={{ backgroundColor: theme?.palette?.greenAccent?.main, color: '#fff' }}
        >
          {loading ? 'Creating...' : 'Next: Create Invoice'}
        </Button>
      </Box>
    </form>
  );

  // Render invoice form (Step 2)
  const renderInvoiceForm = () => (
    <form onSubmit={handleInvoiceSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6">Billable Items (Optional)</Typography>
          <Typography variant="caption" color="textSecondary">
            Add invoice items if applicable. You can skip this step if no invoice is needed.
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoiceData.invoiceItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={item.description}
                        onChange={(e) => handleInvoiceChange(index, 'description', e.target.value)}
                        error={!!errors[`item${index}_description`]}
                        helperText={errors[`item${index}_description`]}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        type="number"
                        value={item.amount}
                        onChange={(e) => handleInvoiceChange(index, 'amount', parseFloat(e.target.value))}
                        error={!!errors[`item${index}_amount`]}
                        helperText={errors[`item${index}_amount`]}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleInvoiceChange(index, 'quantity', parseInt(e.target.value))}
                        error={!!errors[`item${index}_quantity`]}
                        helperText={errors[`item${index}_quantity`]}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {item.amount && item.quantity
                        ? `KES ${(item.amount * item.quantity).toFixed(2)}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => removeItem(index)}
                        disabled={invoiceData.invoiceItems.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button startIcon={<AddIcon />} onClick={addItem} sx={{ mt: 2, bgcolor: theme?.palette?.greenAccent?.main }}>
            Add Item
          </Button>
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => setActiveStep(0)}
          fullWidth
          sx={{ color: theme?.palette?.grey[300], borderColor: theme?.palette?.grey[300] }}
        >
          Back
        </Button>
        <Button
          variant="outlined"
          onClick={handleSkipInvoice}
          fullWidth
          sx={{ color: theme?.palette?.grey[300], borderColor: theme?.palette?.grey[300] }}
        >
          Skip
        </Button>
        <Button
          variant="contained"
          type="submit"
          fullWidth
          disabled={loading}
          sx={{ backgroundColor: theme?.palette?.greenAccent?.main, color: '#fff' }}
        >
          {loading ? 'Creating...' : 'Next: Utility Readings'}
        </Button>
      </Box>
    </form>
  );

  // Render utility readings form (Step 3)
  const renderUtilityForm = () => (
    <form onSubmit={handleUtilitySubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6">Initial Utility Readings (Optional)</Typography>
          <Typography variant="caption" color="textSecondary">
            Enter initial utility readings if applicable. You can skip this step if no readings are available.
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Utility Type</TableCell>
                  <TableCell>Reading</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {utilityReadings.map((reading, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <FormControl fullWidth variant="outlined" size="small">
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={reading.type}
                          onChange={(e) => handleUtilityChange(index, 'type', e.target.value)}
                          label="Type"
                        >
                          <MenuItem value="water">Water</MenuItem>
                          <MenuItem value="gas">Gas</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        type="number"
                        value={reading.reading}
                        onChange={(e) => handleUtilityChange(index, 'reading', e.target.value)}
                        error={!!errors[`reading${index}_reading`]}
                        helperText={errors[`reading${index}_reading`]}
                        variant="outlined"
                        size="small"
                        inputProps={{ step: '0.01' }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => removeUtilityReading(index)}
                        disabled={utilityReadings.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button startIcon={<AddIcon />} onClick={addUtilityReading} sx={{ mt: 2 }}>
            Add Reading
          </Button>
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => setActiveStep(1)}
          fullWidth
          sx={{ color: theme?.palette?.grey[300], borderColor: theme?.palette?.grey[300] }}
        >
          Back
        </Button>
        <Button
          variant="outlined"
          onClick={handleSkipUtility}
          fullWidth
          sx={{ color: theme?.palette?.grey[300], borderColor: theme?.palette?.grey[300] }}
        >
          Skip
        </Button>
        <Button
          variant="contained"
          type="submit"
          fullWidth
          disabled={loading}
          sx={{ backgroundColor: theme?.palette?.greenAccent?.main, color: '#fff' }}
        >
          {loading ? 'Saving...' : 'Next: Confirmation'}
        </Button>
      </Box>
    </form>
  );

  // Render confirmation form (Step 4)
  const renderConfirmationForm = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Onboarding Complete
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Customer details, invoice (if provided), and utility readings (if provided) have been successfully saved.
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Click Finish to view the customer details or Back to review utility readings.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => setActiveStep(2)}
          fullWidth
          sx={{ color: theme?.palette?.grey[300], borderColor: theme?.palette?.grey[300] }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirmation}
          fullWidth
          sx={{ backgroundColor: theme?.palette?.greenAccent?.main, color: '#fff' }}
        >
          Finish
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', p: 3, ml: 5 }}>
      <Typography variant="h5" gutterBottom>
        <TitleComponent title="Add Tenant" />
      </Typography>

      <ErrorBoundary>
        <Paper sx={{ width: '80%', maxWidth: 900, p: 4, mx: 'auto', mt: 5 }}>
          <Stepper activeStep={activeStep} connector={<ContinuousStepConnector />} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>
                  <Typography variant="body1" fontWeight="medium">
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
          {activeStep === 0
            ? renderCustomerForm()
            : activeStep === 1
            ? renderInvoiceForm()
            : activeStep === 2
            ? renderUtilityForm()
            : renderConfirmationForm()}
          <Divider sx={{ my: 4 }} />
          {renderBulkUploadForm()}
        </Paper>
      </ErrorBoundary>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}