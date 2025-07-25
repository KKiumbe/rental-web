import { useEffect, useState, Component } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CircularProgress,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Grid,
  IconButton,
  Button,
  Modal,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Chip,
  AppBar,
  Toolbar,
  Container,
  Breadcrumbs,
  FormHelperText,
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import { ThemeProvider } from '@mui/material/styles';
import PropTypes from 'prop-types';
// New imports for DatePicker
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';

import { useAuthStore } from '../store/authStore';
import { getTheme } from '../store/theme';

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Typography color="error" sx={{ p: 4, textAlign: 'center' }}>
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

const BuildingDetailsScreen = () => {
  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [unitForm, setUnitForm] = useState({
    buildingId: '',
    unitNumber: '',
    monthlyCharge: '',
    depositAmount: '',
    garbageCharge: '',
    serviceCharge: '',
    status: 'VACANT',
  });
  const [formError, setFormError] = useState('');
  const [unitCustomers, setUnitCustomers] = useState([]);
  const [editUnitOpen, setEditUnitOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    unitNumber: '',
    monthlyCharge: 0,
    depositAmount: 0,
    garbageCharge: 0,
    serviceCharge: 0,
    securityCharge: 0,
    amenitiesCharge: 0,
    backupGeneratorCharge: 0,
    status: 'VACANT',
  });
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [viewUnitOpen, setViewUnitOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUnitForAssign, setSelectedUnitForAssign] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [utilityBillModalOpen, setUtilityBillModalOpen] = useState(false);
  const [utilityBillForm, setUtilityBillForm] = useState({
    buildingId: '',
    amount: '',
    description: '',
    invoicePeriod: null, // Changed to null for Date object
    invoiceType: 'UTILITY',
  });
  const [utilityBillFormError, setUtilityBillFormError] = useState('');
  const { id } = useParams();
  const [expenseForm, setExpenseForm] = useState({
    buildingId: id,
    expenseType: 'SHARED_UTILITY',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const theme = getTheme();

  // Sanitize building object
  const sanitizedBuilding = building
    ? {
        ...building,
        landlord: building.landlord || { name: '', email: '', phoneNumber: '' },
        units: Array.isArray(building.units) ? building.units : [],
        customers: Array.isArray(building.customers) ? building.customers : [],
        unitCount: building.unitCount || (Array.isArray(building.units) ? building.units.length : 0),
        customerCount: building.customerCount || (Array.isArray(building.customers) ? building.customerCount : 0),
        managementRate: typeof building.managementRate === 'number' ? building.managementRate : 0,
        gasRate: typeof building.gasRate === 'number' ? building.gasRate : 0,
        waterRate: typeof building.waterRate === 'number' ? building.waterRate : 0,
        createdAt: building.createdAt || new Date().toISOString(),
      }
    : null;

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const fetchBuilding = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/buildings/${id}`, {
        withCredentials: true,
      });
      setBuilding(response.data);
      setUnitForm((prev) => ({ ...prev, buildingId: response.data.id || id }));
      setUtilityBillForm((prev) => ({ ...prev, buildingId: response.data.id || id }));
    } catch (err) {
      console.error('Fetch building error:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 404) {
        setError('Building not found');
      } else {
        setError('Failed to fetch building details');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUnit = async (id) => {
    try {
      setUnitsLoading(true);
      const response = await axios.get(`${BASE_URL}/units/${id}`, {
        withCredentials: true,
      });
      const unitData = response.data?.data;
      if (!unitData) throw new Error('No unit data returned');
      setSelectedUnit(unitData);
      setEditFormData({
        buildingId: id,
        unitNumber: unitData.unitNumber || '',
        monthlyCharge: Number(unitData.monthlyCharge) || 0,
        depositAmount: Number(unitData.depositAmount) || 0,
        garbageCharge: Number(unitData.garbageCharge) || 0,
        serviceCharge: Number(unitData.serviceCharge) || 0,
        securityCharge: Number(unitData.securityCharge) || 0,
        amenitiesCharge: Number(unitData.amenitiesCharge) || 0,
        backupGeneratorCharge: Number(unitData.backupGeneratorCharge) || 0,
        status: unitData.status || 'VACANT',
      });
      setUnitCustomers(unitData.customers || []);
    } catch (err) {
      console.error('Fetch unit error:', err);
      setSnackbarMessage(err.response?.data?.error || 'Failed to fetch unit details');
      setSnackbarOpen(true);
      setSelectedUnit(null);
      setUnitCustomers([]);
    } finally {
      setUnitsLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setUnitForm((prev) => ({
      ...prev,
      [name]: name === 'status' ? value : name.includes('Charge') || name === 'depositAmount' ? parseFloat(value) || '' : value,
    }));
  };

  const handleViewUnit = (unit) => {
    fetchUnit(unit.id);
    setViewUnitOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: name === 'status' ? value : name.includes('Charge') || name === 'depositAmount' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleAddUnit = () => {
    if (!building || !building.id) {
      setSnackbarMessage('Please select a building first');
      setSnackbarOpen(true);
      return;
    }
    navigate(`/add-unit/${building.id || id}`);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormError('');
    setUnitForm({
      buildingId: building?.id || id,
      unitNumber: '',
      monthlyCharge: '',
      depositAmount: '',
      garbageCharge: '',
      serviceCharge: '',
      status: 'VACANT',
    });
  };

  const handleCloseViewUnit = () => {
    setViewUnitOpen(false);
    setSelectedUnit(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (
        !unitForm.unitNumber ||
        !unitForm.monthlyCharge ||
        !unitForm.depositAmount ||
        !unitForm.garbageCharge ||
        !unitForm.serviceCharge
      ) {
        setFormError('Please fill in all required fields.');
        return;
      }
      const payload = {
        buildingId: unitForm.buildingId,
        unitNumber: unitForm.unitNumber,
        monthlyCharge: Number(unitForm.monthlyCharge),
        depositAmount: Number(unitForm.depositAmount),
        garbageCharge: Number(unitForm.garbageCharge),
        serviceCharge: Number(unitForm.serviceCharge),
        status: unitForm.status,
      };
      await axios.post(`${BASE_URL}/units`, payload, {
        withCredentials: true,
      });
      setSnackbarMessage('Unit added successfully.');
      setSnackbarOpen(true);
      handleCloseModal();
      fetchBuilding();
    } catch (err) {
      console.error('Add unit error:', err);
      setFormError(err.response?.data?.error || 'Failed to add unit. Please try again.');
    }
  };

  const handleEditUnit = (unit) => {
    fetchUnit(unit.id);
    setEditUnitOpen(true);
  };

  const handleCloseEditUnit = () => {
    setEditUnitOpen(false);
    setEditFormData({
      unitNumber: '',
      monthlyCharge: 0,
      depositAmount: 0,
      garbageCharge: 0,
      serviceCharge: 0,
      securityCharge: 0,
      amenitiesCharge: 0,
      backupGeneratorCharge: 0,
      status: 'VACANT',
    });
  };

  const handleExpenseFormChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUtilityBillFormChange = (e) => {
    const { name, value } = e.target;
    setUtilityBillForm((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || '' : value,
    }));
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/building-expenses`, expenseForm, {
        withCredentials: true,
      });
      setSnackbarMessage('Expense submitted successfully');
      setSnackbarOpen(true);
      setExpenseModalOpen(false);
      setExpenseForm({
        buildingId: id,
        expenseType: 'REPAIR',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      console.error('Submit expense error:', err);
      setSnackbarMessage(err.response?.data?.error || 'Failed to submit expense');
      setSnackbarOpen(true);
    }
  };

  const handleUtilityBillSubmit = async (e) => {
    e.preventDefault();
    setUtilityBillFormError('');
    try {
      if (!utilityBillForm.amount || !utilityBillForm.description || !utilityBillForm.invoicePeriod) {
        setUtilityBillFormError('Please fill in all required fields.');
        return;
      }
      await axios.post(
        `${BASE_URL}/shared-utility-bill`,
        {
          buildingId: utilityBillForm.buildingId,
          amount: Number(utilityBillForm.amount),
          description: utilityBillForm.description,
          invoicePeriod: format(utilityBillForm.invoicePeriod, 'MM/yyyy'), // Format date as MM/YYYY
          invoiceType: utilityBillForm.invoiceType,
        },
        { withCredentials: true }
      );
      setSnackbarMessage('Utility bills generated successfully');
      setSnackbarOpen(true);
      setUtilityBillModalOpen(false);
      setUtilityBillForm({
        buildingId: id,
        amount: '',
        description: '',
        invoicePeriod: null, // Reset to null
        invoiceType: 'SHARED_UTILITY',
      });
    } catch (err) {
      console.error('Generate utility bill error:', err);
      setUtilityBillFormError(err.response?.data?.error || 'Failed to generate utility bills');
      setSnackbarMessage(err.response?.data?.error || 'Failed to generate utility bills');
      setSnackbarOpen(true);
    }
  };

  const handleUpdateUnit = async () => {
    setUnitsLoading(true);
    try {
      const unit = building?.units?.find((u) => u.unitNumber === editFormData.unitNumber);
      if (!unit) {
        setSnackbarMessage('Unit not found for update.');
        setSnackbarOpen(true);
        setUnitsLoading(false);
        return;
      }
      const payload = {
        buildingId: building?.id,
        unitNumber: editFormData.unitNumber,
        monthlyCharge: Number(editFormData.monthlyCharge),
        depositAmount: Number(editFormData.depositAmount),
        garbageCharge: Number(editFormData.garbageCharge),
        serviceCharge: Number(editFormData.serviceCharge),
        securityCharge: Number(editFormData.securityCharge),
        amenitiesCharge: Number(editFormData.amenitiesCharge),
        backupGeneratorCharge: Number(editFormData.backupGeneratorCharge),
        status: editFormData.status,
      };
      await axios.post(`${BASE_URL}/units`, payload, {
        withCredentials: true,
      });
      setSnackbarMessage('Unit updated successfully.');
      setSnackbarOpen(true);
      handleCloseEditUnit();
      fetchBuilding();
    } catch (err) {
      console.error('Update unit error:', err);
      setSnackbarMessage('Failed to update unit. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setUnitsLoading(false);
    }
  };

  const handleOpenAssignDialog = (unit) => {
    setSelectedUnitForAssign(unit);
    setAssignDialogOpen(true);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedUnitForAssign(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearch = async (query) => {
    const trimmedQuery = (query || '').trim();
    if (!trimmedQuery) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const isPhoneNumber = /^\d+$/.test(trimmedQuery);
    try {
      const url = isPhoneNumber
        ? `${BASE_URL}/search-customer-by-phone`
        : `${BASE_URL}/search-customer-by-name`;
      const params = isPhoneNumber ? { phone: trimmedQuery } : { name: trimmedQuery };
      if (isPhoneNumber && trimmedQuery.length < 10) {
        setSearchResults([]);
        return;
      }
      const response = await axios.get(url, { params, withCredentials: true });
      const results = isPhoneNumber
        ? response.data
          ? [response.data]
          : []
        : Array.isArray(response.data)
        ? response.data
        : [];
      setSearchResults(results);
      if (!results.length) {
        setSnackbarMessage(
          isPhoneNumber ? 'No customer found with that phone number' : 'No customer found with that name'
        );
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Search error:', error.message);
      setSnackbarMessage(
        error.code === 'ERR_NETWORK'
          ? 'Server not reachable. Please check if the backend is running.'
          : error.response?.status === 404
          ? isPhoneNumber
            ? 'No customer found with that phone number'
            : 'No customer found with that name'
          : 'Error searching customers: ' + (error.response?.data?.message || error.message)
      );
      setSnackbarOpen(true);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssignUnit = async (customerId) => {
    try {
      if (!selectedUnitForAssign?.id || !customerId) {
        setSnackbarMessage('Unit or customer not selected');
        setSnackbarOpen(true);
        return;
      }
      await axios.post(
        `${BASE_URL}/assign-unit-to-customer`,
        {
          customerId,
          unitId: selectedUnitForAssign.id,
        },
        { withCredentials: true }
      );
      setSnackbarMessage('Unit assigned successfully');
      setSnackbarOpen(true);
      fetchBuilding();
      handleCloseAssignDialog();
    } catch (error) {
      console.error('Assign unit error:', error);
      setSnackbarMessage(error.response?.data?.error || 'Failed to assign unit');
      setSnackbarOpen(true);
    }
  };

  const unitColumns = [
    {
      field: 'actionsascus',
      headerName: 'View',
      width: 80,
      renderCell: (params) => (
        <IconButton onClick={() => handleViewUnit(params.row)} title="View Unit">
          <VisibilityIcon color="action" />
        </IconButton>
      ),
    },
    {
      field: 'edit',
      headerName: 'Edit',
      width: 80,
      renderCell: (params) => (
        <IconButton onClick={() => handleEditUnit(params.row)} title="Edit Unit">
          <EditIcon color="action" />
        </IconButton>
      ),
    },
    {
      field: 'assign',
      headerName: 'Assign',
      width: 120,
      renderCell: (params) => (
        <Button
          size="small"
          onClick={() => handleOpenAssignDialog(params.row)}
          disabled={params.row.status === 'OCCUPIED'}
          startIcon={<AddIcon color="action" />}
          color={theme?.palette?.grey[300]}
        >
          Assign
        </Button>
      ),
    },
    { field: 'unitNumber', headerName: 'Unit Number', width: 150 },
    {
      field: 'customers',
      headerName: 'Customers',
      width: 200,
      renderCell: (params) => (
        <Box>
          {params.value?.map((customer) => (
            <Chip
              key={customer.id}
              label={customer.fullName || `${customer.firstName} ${customer.lastName}`}
              size="small"
              sx={{ mr: 1, mb: 1 }}
              color={customer.isActive ? 'primary' : 'default'}
            />
          ))}
        </Box>
      ),
    },
    { field: 'monthlyCharge', headerName: 'Monthly Charge (ksh)', width: 150 },
    { field: 'depositAmount', headerName: 'Deposit Amount (ksh)', width: 150 },
    { field: 'garbageCharge', headerName: 'Garbage Charge (ksh)', width: 150 },
    { field: 'serviceCharge', headerName: 'Service Charge (ksh)', width: 150 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'OCCUPIED' ? 'success' : 'warning'}
          size="small"
        />
      ),
    },
  ];

  useEffect(() => {
    if (id) {
      fetchBuilding();
    }
  }, [id]);

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Container maxWidth="lg" sx={{ minHeight: '100vh', py: 4 }}>
          {/* Enhanced Header */}
          <AppBar position="static" elevation={1} sx={{ mb: 4, borderRadius: 2 }}>
            <Toolbar>
              <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" component="h1">
                  {sanitizedBuilding?.buildingName || 'Building Details'}
                </Typography>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 1 }}>
                  <Link to="/properties" style={{ textDecoration: 'none' }}>
                    Buildings
                  </Link>
                  <Typography>{sanitizedBuilding?.buildingName || 'Details'}</Typography>
                </Breadcrumbs>
              </Box>
            </Toolbar>
          </AppBar>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
              <CircularProgress size={40} />
              <Typography sx={{ ml: 2 }}>Loading building details...</Typography>
            </Box>
          ) : error ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="error">{error}</Typography>
            </Paper>
          ) : !sanitizedBuilding ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography>No building data available</Typography>
            </Paper>
          ) : (
            <ErrorBoundary>
              {/* Building Details Card */}
              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Address:</strong> {sanitizedBuilding.address}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Total Units:</strong> {sanitizedBuilding.unitCount}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Management Rate:</strong> %{sanitizedBuilding.managementRate.toFixed(2)}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Gas Rate:</strong> ksh{sanitizedBuilding.gasRate.toFixed(2)}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Water Rate:</strong> ksh{sanitizedBuilding.waterRate.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <strong>Landlord:</strong> {sanitizedBuilding.landlord.name}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Landlord Email:</strong> {sanitizedBuilding.landlord.email}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Landlord Phone:</strong> {sanitizedBuilding.landlord.phoneNumber}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Created At:</strong>{' '}
                        {new Date(sanitizedBuilding.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3, gap: 2 }}>
                    <Button
                      component={Link}
                      to={`/edit-building/${id}`}
                      variant="contained"
                      color={theme.palette.greenAccent.main}
                      startIcon={<EditIcon />}
                    >
                      Edit Property
                    </Button>
                    <Button
                      variant="contained"
                      color={theme.palette.greenAccent.main}
                      onClick={() => setExpenseModalOpen(true)}
                      startIcon={<AddIcon />}
                    >
                      Raise Repair Expense
                    </Button>
                    <Button
                      variant="contained"
                      color={theme.palette.greenAccent.main}
                      onClick={() => setUtilityBillModalOpen(true)}
                      startIcon={<AddIcon />}
                    >
                      Generate Utility Bill
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Units Section */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ApartmentIcon /> Units ({sanitizedBuilding.units.length})
                </Typography>
                <Button
                  variant="contained"
                  color={theme.palette.greenAccent.main}
                  onClick={handleAddUnit}
                  disabled={!building?.id}
                  startIcon={<AddIcon />}
                >
                  Add Unit
                </Button>
              </Box>
              <Paper sx={{ mb: 4 }}>
                <DataGrid
                  rows={sanitizedBuilding.units}
                  columns={unitColumns}
                  getRowId={(row) => row.id}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 5 } },
                  }}
                  pageSizeOptions={[5, 10, 20]}
                  disableRowSelectionOnClick
                  autoHeight
                  slots={{
                    toolbar: () => (
                      <GridToolbarContainer>
                        <GridToolbarExport />
                      </GridToolbarContainer>
                    ),
                  }}
                />
              </Paper>

              {/* Customers Section */}
              {selectedUnit && unitCustomers.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon /> Customers in Unit {selectedUnit.unitNumber}
                  </Typography>
                  <Paper sx={{ mb: 4 }}>
                    <DataGrid
                      rows={unitCustomers.map((c) => ({
                        id: c.id,
                        fullName: c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
                        phoneNumber: c.phoneNumber,
                        email: c.email,
                        status: c.isActive ? 'Active' : 'Inactive',
                        startDate: c.startDate ? new Date(c.startDate).toLocaleDateString() : 'N/A',
                      }))}
                      columns={[
                        { field: 'fullName', headerName: 'Name', width: 180 },
                        { field: 'email', headerName: 'Email', width: 200 },
                        { field: 'phoneNumber', headerName: 'Phone Number', width: 160 },
                        {
                          field: 'status',
                          headerName: 'Status',
                          width: 120,
                          renderCell: (params) => (
                            <Chip label={params.value} color={params.value === 'Active' ? 'success' : 'default'} size="small" />
                          ),
                        },
                      ]}
                      getRowId={(row) => row.id}
                      autoHeight
                      hideFooterPagination
                    />
                  </Paper>
                </>
              )}

              {/* Add Unit Modal */}
              <Modal open={openModal} onClose={handleCloseModal}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Add New Unit
                  </Typography>
                  {formError && (
                    <Typography color="error" sx={{ mb: 2 }}>
                      {formError}
                    </Typography>
                  )}
                  <form onSubmit={handleFormSubmit}>
                    <TextField
                      label="Unit Number"
                      name="unitNumber"
                      value={unitForm.unitNumber}
                      onChange={handleFormChange}
                      fullWidth
                      margin="normal"
                      required
                      variant="outlined"
                    />
                    <TextField
                      label="Monthly Charge (ksh)"
                      name="monthlyCharge"
                      value={unitForm.monthlyCharge}
                      onChange={handleFormChange}
                      fullWidth
                      margin="normal"
                      type="number"
                      required
                      variant="outlined"
                    />
                    <TextField
                      label="Deposit Amount (ksh)"
                      name="depositAmount"
                      value={unitForm.depositAmount}
                      onChange={handleFormChange}
                      fullWidth
                      margin="normal"
                      type="number"
                      required
                      variant="outlined"
                    />
                    <TextField
                      label="Garbage Charge (ksh)"
                      name="garbageCharge"
                      value={unitForm.garbageCharge}
                      onChange={handleFormChange}
                      fullWidth
                      margin="normal"
                      type="number"
                      required
                      variant="outlined"
                    />
                    <TextField
                      label="Service Charge (ksh)"
                      name="serviceCharge"
                      value={unitForm.serviceCharge}
                      onChange={handleFormChange}
                      fullWidth
                      margin="normal"
                      type="number"
                      required
                      variant="outlined"
                    />
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Status</InputLabel>
                      <Select
                        name="status"
                        value={unitForm.status}
                        onChange={handleFormChange}
                        label="Status"
                        variant="outlined"
                      >
                        <MenuItem value="VACANT">Vacant</MenuItem>
                        <MenuItem value="OCCUPIED">Occupied</MenuItem>
                      </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                      <Button onClick={handleCloseModal} variant="outlined">
                        Cancel
                      </Button>
                      <Button type="submit" variant="contained" color={theme?.palette?.greenAccent?.main}>
                        Add Unit
                      </Button>
                    </Box>
                  </form>
                </Box>
              </Modal>

              {/* Edit Unit Dialog */}
              <Dialog open={editUnitOpen} onClose={handleCloseEditUnit} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Unit</DialogTitle>
                <DialogContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <TextField
                      label="Unit Number"
                      name="unitNumber"
                      value={editFormData.unitNumber}
                      onChange={handleInputChange}
                      required
                      fullWidth
                      variant="outlined"
                    />
                    <TextField
                      label="Monthly Charge (ksh)"
                      name="monthlyCharge"
                      type="number"
                      value={editFormData.monthlyCharge}
                      onChange={handleInputChange}
                      fullWidth
                      variant="outlined"
                    />
                    <TextField
                      label="Deposit Amount (ksh)"
                      name="depositAmount"
                      type="number"
                      value={editFormData.depositAmount}
                      onChange={handleInputChange}
                      fullWidth
                      variant="outlined"
                    />
                    <TextField
                      label="Garbage Charge (ksh)"
                      name="garbageCharge"
                      type="number"
                      value={editFormData.garbageCharge}
                      onChange={handleInputChange}
                      fullWidth
                      variant="outlined"
                    />
                    <TextField
                      label="Service Charge (ksh)"
                      name="serviceCharge"
                      type="number"
                      value={editFormData.serviceCharge}
                      onChange={handleInputChange}
                      fullWidth
                      variant="outlined"
                    />
                    <TextField
                      label="Security Charge (ksh)"
                      name="securityCharge"
                      type="number"
                      value={editFormData.securityCharge}
                      onChange={handleInputChange}
                      fullWidth
                      variant="outlined"
                    />
                    <TextField
                      label="Amenities Charge (ksh)"
                      name="amenitiesCharge"
                      type="number"
                      value={editFormData.amenitiesCharge}
                      onChange={handleInputChange}
                      fullWidth
                      variant="outlined"
                    />
                    <TextField
                      label="Backup Generator Charge (ksh)"
                      name="backupGeneratorCharge"
                      type="number"
                      value={editFormData.backupGeneratorCharge}
                      onChange={handleInputChange}
                      fullWidth
                      variant="outlined"
                    />
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        name="status"
                        value={editFormData.status}
                        onChange={handleInputChange}
                        required
                        variant="outlined"
                      >
                        <MenuItem value="VACANT">Vacant</MenuItem>
                        <MenuItem value="OCCUPIED">Occupied</MenuItem>
                        <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                        <MenuItem value="OCCUPIED_PENDING_PAYMENT">Occupied Pending Payment</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleUpdateUnit} variant="contained" color="primary" disabled={unitsLoading}>
                    {unitsLoading ? 'Saving...' : 'Save'}
                  </Button>
                  <Button onClick={handleCloseEditUnit} variant="outlined" disabled={unitsLoading}>
                    Cancel
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Assign Unit Dialog */}
              <Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Assign Unit to Customer</DialogTitle>
                <DialogContent>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Assigning: {selectedUnitForAssign?.unitNumber}
                    </Typography>
                    <TextField
                      fullWidth
                      label="Search Customer by Name or Phone"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearch(e.target.value);
                      }}
                      sx={{ mb: 2 }}
                      variant="outlined"
                    />
                    {isSearching && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto' }} />}
                    {searchResults.length > 0 && (
                      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Search Results:
                        </Typography>
                        {searchResults.map((customer) => (
                          <Paper key={customer.id} sx={{ p: 2, mb: 1, borderRadius: 2 }}>
                            <Typography>
                              <strong>Name:</strong> {customer.firstName} {customer.lastName}
                            </Typography>
                            <Typography>
                              <strong>Phone:</strong> {customer.phoneNumber}
                            </Typography>
                            <Typography>
                              <strong>Email:</strong> {customer.email || 'N/A'}
                            </Typography>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleAssignUnit(customer.id)}
                              sx={{ mt: 1 }}
                            >
                              Assign to This Customer
                            </Button>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseAssignDialog} variant="outlined">
                    Cancel
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Expense Modal */}
              <Modal open={expenseModalOpen} onClose={() => setExpenseModalOpen(false)}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Raise Repair Expense
                  </Typography>
                  <form onSubmit={handleExpenseSubmit}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Expense Type</InputLabel>
                      <Select
                        name="expenseType"
                        value={expenseForm.expenseType}
                        onChange={handleExpenseFormChange}
                        label="Expense Type"
                        variant="outlined"
                      >
                        <MenuItem value="ELECTRICITY">ELECTRICITY</MenuItem>
                        <MenuItem value="WATER">WATER</MenuItem>
                        <MenuItem value="SHARED_UTILITY">Utility</MenuItem>
                        
                      </Select>
                    </FormControl>
                    <TextField
                      label="Amount (ksh)"
                      name="amount"
                      type="number"
                      value={expenseForm.amount}
                      onChange={handleExpenseFormChange}
                      fullWidth
                      margin="normal"
                      required
                      variant="outlined"
                    />
                    <TextField
                      label="Description"
                      name="description"
                      value={expenseForm.description}
                      onChange={handleExpenseFormChange}
                      fullWidth
                      margin="normal"
                      required
                      multiline
                      rows={3}
                      variant="outlined"
                    />
                    <TextField
                      label="Date"
                      name="date"
                      type="date"
                      value={expenseForm.date}
                      onChange={handleExpenseFormChange}
                      fullWidth
                      margin="normal"
                      required
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                      <Button onClick={() => setExpenseModalOpen(false)} variant="outlined">
                        Cancel
                      </Button>
                      <Button type="submit" variant="contained" color={theme?.palette?.greenAccent?.main}>
                        Submit Expense
                      </Button>
                    </Box>
                  </form>
                </Box>
              </Modal>

              {/* Utility Bill Modal */}
              <Modal open={utilityBillModalOpen} onClose={() => setUtilityBillModalOpen(false)}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Generate Utility Bill
                  </Typography>
                  {utilityBillFormError && (
                    <Typography color="error" sx={{ mb: 2 }}>
                      {utilityBillFormError}
                    </Typography>
                  )}
                  <form onSubmit={handleUtilityBillSubmit}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Invoice Type</InputLabel>
                      <Select
                        name="invoiceType"
                        value={utilityBillForm.invoiceType}
                        onChange={handleUtilityBillFormChange}
                        label="Invoice Type"
                        variant="outlined"
                      >
                        <MenuItem value="SHARED_UTILITY">Utility</MenuItem>
                        <MenuItem value="WATER">Water</MenuItem>
                        <MenuItem value="ELECTRICITY">Electricity</MenuItem>
                        
                      </Select>
                    </FormControl>
                    <TextField
                      label="Amount (ksh)"
                      name="amount"
                      type="number"
                      value={utilityBillForm.amount}
                      onChange={handleUtilityBillFormChange}
                      fullWidth
                      margin="normal"
                      required
                      variant="outlined"
                      inputProps={{ step: '0.01' }}
                    />
                    <TextField
                      label="Description"
                      name="description"
                      value={utilityBillForm.description}
                      onChange={handleUtilityBillFormChange}
                      fullWidth
                      margin="normal"
                      required
                      multiline
                      rows={3}
                      variant="outlined"
                    />
                    <DatePicker
                      label="Invoice Period"
                      views={['month', 'year']}
                      value={utilityBillForm.invoicePeriod}
                      onChange={(newValue) =>
                        setUtilityBillForm((prev) => ({ ...prev, invoicePeriod: newValue }))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          margin="normal"
                          required
                          variant="outlined"
                          helperText="Select month and year"
                        />
                      )}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                      <Button onClick={() => setUtilityBillModalOpen(false)} variant="outlined">
                        Cancel
                      </Button>
                      <Button type="submit" variant="contained" color={theme?.palette?.greenAccent?.main}>
                        Generate Bills
                      </Button>
                    </Box>
                  </form>
                </Box>
              </Modal>

              {/* View Unit Dialog */}
              <Dialog open={viewUnitOpen} onClose={handleCloseViewUnit} maxWidth="sm" fullWidth>
                <DialogTitle>Unit Details</DialogTitle>
                <DialogContent>
                  {selectedUnit ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                      <Typography variant="body1">
                        <strong>Unit Number:</strong> {selectedUnit.unitNumber}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Monthly Charge:</strong> ksh{selectedUnit.monthlyCharge}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Deposit Amount:</strong> ksh{selectedUnit.depositAmount}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Garbage Charge:</strong> ksh{selectedUnit.garbageCharge || 'N/A'}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Service Charge:</strong> ksh{selectedUnit.serviceCharge || 'N/A'}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Security Charge:</strong> ksh{selectedUnit.securityCharge || 'N/A'}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Amenities Charge:</strong> ksh{selectedUnit.amenitiesCharge || 'N/A'}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Backup Generator Charge:</strong> ksh{selectedUnit.backupGeneratorCharge || 'N/A'}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Status:</strong>{' '}
                        <Chip label={selectedUnit.status} color={selectedUnit.status === 'OCCUPIED' ? 'success' : 'warning'} size="small" />
                      </Typography>
                      <Typography variant="body1">
                        <strong>Created At:</strong> {new Date(selectedUnit.createdAt).toLocaleString()}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Updated At:</strong> {new Date(selectedUnit.updatedAt).toLocaleString()}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography>Loading unit details...</Typography>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={() => {
                      handleCloseViewUnit();
                      setEditUnitOpen(true);
                    }}
                    variant="contained"
                    color="primary"
                    disabled={unitsLoading}
                  >
                    Edit
                  </Button>
                  <Button onClick={handleCloseViewUnit} variant="outlined" disabled={unitsLoading}>
                    Close
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Snackbar */}
              <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              />
            </ErrorBoundary>
          )}
        </Container>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default BuildingDetailsScreen;