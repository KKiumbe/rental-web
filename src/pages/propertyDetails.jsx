import { useEffect, useState, Component } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
} from '@mui/x-data-grid';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import PropTypes from 'prop-types';

// Assuming TitleComponent and theme/auth imports are correctly set up
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

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

// Define unitColumns for the DataGrid

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
  const { id } = useParams();
  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

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

    // Fetch unit details
    const unitResponse = await axios.get(`${BASE_URL}/units/${id}`, { withCredentials: true });
    const unitData = unitResponse.data?.data;
    if (!unitData) throw new Error('No unit data returned');

    setSelectedUnit(unitData);
    setEditFormData({
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

    // Fetch customers of this unit
    const customersResponse = await axios.get(`${BASE_URL}/units/${id}/customers`, {
      withCredentials: true,
    });
    setUnitCustomers(customersResponse.data?.data || []);

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
    console.warn('No building selected for adding unit');
    setSnackbarMessage('Please select a building first');
    setSnackbarOpen(true);
    return;
  }

  
  console.log(`Navigating to /add-unit/${building}`);
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
      await axios.put(`${BASE_URL}/units/${unit.id}`, payload, {
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


  const unitColumns = [
    {
      field: 'actions',
      headerName: 'View',
      width: 80,
      renderCell: (params) => (
        <IconButton onClick={() => handleViewUnit(params.row)}>
          <VisibilityIcon />
        </IconButton>
      ),
    },
    {
      field: 'edit',
      headerName: 'Edit',
      width: 80,
      renderCell: (params) => (
        <IconButton onClick={() => handleEditUnit(params.row)} title="Edit Unit">
          <EditIcon />
        </IconButton>
      ),
    },

  { field: 'unitNumber', headerName: 'Unit Number', width: 150 },
  { field: 'monthlyCharge', headerName: 'Monthly Charge ($)', width: 150 },
  { field: 'depositAmount', headerName: 'Deposit Amount ($)', width: 150 },
  { field: 'garbageCharge', headerName: 'Garbage Charge ($)', width: 150 },
  { field: 'serviceCharge', headerName: 'Service Charge ($)', width: 150 },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: (params) => (
      <Typography color={params.value === 'OCCUPIED' ? 'green' : 'orange'}>
        {params.value}
      </Typography>
    ),
  },

];

// Customer columns (already defined in the original code)




  useEffect(() => {
    if (id) {
      fetchBuilding();
    }
  }, [id]);

  return (
    <Box sx={{  minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ ml: 5 }}>
        <TitleComponent title="Building Details" />
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress size={30} />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ ml: 5 }}>
          {error}
        </Typography>
      ) : !sanitizedBuilding ? (
        <Typography sx={{ ml: 5 }}>No building data available</Typography>
      ) : (
        <ErrorBoundary>
          <Box sx={{ ml: 5, mr: 5 }}>
            {/* Building Details Card */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {sanitizedBuilding.buildingName}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>Address:</strong> {sanitizedBuilding.address}</Typography>
                    <Typography><strong>Total Units:</strong> {sanitizedBuilding.unitCount}</Typography>
                    <Typography><strong>Management Rate:</strong> ${sanitizedBuilding.managementRate.toFixed(2)}</Typography>
                    <Typography><strong>Gas Rate:</strong> ${sanitizedBuilding.gasRate.toFixed(2)}</Typography>
                    <Typography><strong>Water Rate:</strong> ${sanitizedBuilding.waterRate.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>Landlord:</strong> {sanitizedBuilding.landlord.name}</Typography>
                    <Typography><strong>Landlord Email:</strong> {sanitizedBuilding.landlord.email}</Typography>
                    <Typography><strong>Landlord Phone:</strong> {sanitizedBuilding.landlord.phoneNumber}</Typography>
                    <Typography>
                      <strong>Created At:</strong>{' '}
                      {new Date(sanitizedBuilding.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Units Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Units ({sanitizedBuilding.units.length})
              </Typography>
             <Button
  variant="contained"
  color="primary"
  onClick={handleAddUnit}
  disabled={!building?.id}
>
  Add Unit
</Button>

            </Box>
            <Paper sx={{ width: '100%', mb: 4 }}>
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

            <Typography variant="subtitle1" sx={{ mt: 3 }}>
  Customers in this Unit
</Typography>
{unitCustomers.length > 0 ? (
  <DataGrid
    rows={unitCustomers.map((c) => ({
      ...c,
      name: `${c.firstName} ${c.lastName}`,
    }))}
    columns={[
      { field: 'name', headerName: 'Name', width: 180 },
      { field: 'email', headerName: 'Email', width: 200 },
      { field: 'phoneNumber', headerName: 'Phone Number', width: 160 },
      { field: 'status', headerName: 'Status', width: 120 }
    ]}
    getRowId={(row) => row.id}
    autoHeight
    hideFooterPagination
  />
) : (
  <Typography>No customers found for this unit.</Typography>
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
                  borderRadius: 1,
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
                  />
                  <TextField
                    label="Monthly Charge ($)"
                    name="monthlyCharge"
                    value={unitForm.monthlyCharge}
                    onChange={handleFormChange}
                    fullWidth
                    margin="normal"
                    type="number"
                    required
                  />
                  <TextField
                    label="Deposit Amount ($)"
                    name="depositAmount"
                    value={unitForm.depositAmount}
                    onChange={handleFormChange}
                    fullWidth
                    margin="normal"
                    type="number"
                    required
                  />
                  <TextField
                    label="Garbage Charge ($)"
                    name="garbageCharge"
                    value={unitForm.garbageCharge}
                    onChange={handleFormChange}
                    fullWidth
                    margin="normal"
                    type="number"
                    required
                  />
                  <TextField
                    label="Service Charge ($)"
                    name="serviceCharge"
                    value={unitForm.serviceCharge}
                    onChange={handleFormChange}
                    fullWidth
                    margin="normal"
                    type="number"
                    required
                  />
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={unitForm.status}
                      onChange={handleFormChange}
                      label="Status"
                    >
                      <MenuItem value="VACANT">Vacant</MenuItem>
                      <MenuItem value="OCCUPIED">Occupied</MenuItem>
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button onClick={handleCloseModal} sx={{ mr: 1 }}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" color="primary">
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
                  />
                  <TextField
                    label="Monthly Charge ($)"
                    name="monthlyCharge"
                    type="number"
                    value={editFormData.monthlyCharge}
                    onChange={handleInputChange}
                    fullWidth
                  />
                  <TextField
                    label="Deposit Amount ($)"
                    name="depositAmount"
                    type="number"
                    value={editFormData.depositAmount}
                    onChange={handleInputChange}
                    fullWidth
                  />
                  <TextField
                    label="Garbage Charge ($)"
                    name="garbageCharge"
                    type="number"
                    value={editFormData.garbageCharge}
                    onChange={handleInputChange}
                    fullWidth
                  />
                  <TextField
                    label="Service Charge ($)"
                    name="serviceCharge"
                    type="number"
                    value={editFormData.serviceCharge}
                    onChange={handleInputChange}
                    fullWidth
                  />
                  <TextField
                    label="Security Charge ($)"
                    name="securityCharge"
                    type="number"
                    value={editFormData.securityCharge}
                    onChange={handleInputChange}
                    fullWidth
                  />
                  <TextField
                    label="Amenities Charge ($)"
                    name="amenitiesCharge"
                    type="number"
                    value={editFormData.amenitiesCharge}
                    onChange={handleInputChange}
                    fullWidth
                  />
                  <TextField
                    label="Backup Generator Charge ($)"
                    name="backupGeneratorCharge"
                    type="number"
                    value={editFormData.backupGeneratorCharge}
                    onChange={handleInputChange}
                    fullWidth
                  />
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={editFormData.status}
                      onChange={handleInputChange}
                      required
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
                <Button onClick={handleCloseEditUnit} disabled={unitsLoading}>
                  Cancel
                </Button>
              </DialogActions>
            </Dialog>


            {/* View Unit Modal */}
                  <Dialog open={viewUnitOpen} onClose={handleCloseViewUnit} maxWidth="sm" fullWidth>
                    <DialogTitle>Unit Details</DialogTitle>
                    <DialogContent>
                      {selectedUnit ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                          <Typography><strong>Unit Number:</strong> {selectedUnit.unitNumber}</Typography>
                          <Typography><strong>Monthly Charge:</strong> ${selectedUnit.monthlyCharge}</Typography>
                          <Typography><strong>Deposit Amount:</strong> ${selectedUnit.depositAmount}</Typography>
                          <Typography><strong>Garbage Charge:</strong> ${selectedUnit.garbageCharge || 'N/A'}</Typography>
                          <Typography><strong>Service Charge:</strong> ${selectedUnit.serviceCharge || 'N/A'}</Typography>
                          <Typography><strong>Security Charge:</strong> ${selectedUnit.securityCharge || 'N/A'}</Typography>
                          <Typography><strong>Amenities Charge:</strong> ${selectedUnit.amenitiesCharge || 'N/A'}</Typography>
                          <Typography><strong>Backup Generator Charge:</strong> ${selectedUnit.backupGeneratorCharge || 'N/A'}</Typography>
                          <Typography><strong>Status:</strong> {selectedUnit.status}</Typography>
                          <Typography><strong>Created At:</strong> {new Date(selectedUnit.createdAt).toLocaleString()}</Typography>
                          <Typography><strong>Updated At:</strong> {new Date(selectedUnit.updatedAt).toLocaleString()}</Typography>
                        </Box>
                      ) : (
                        <Typography>Loading unit details...</Typography>
                      )}
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => { handleCloseViewUnit(); setEditUnitOpen(true); }} disabled={unitsLoading}>
                        Edit
                      </Button>
                      <Button onClick={handleCloseViewUnit} disabled={unitsLoading}>
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
            />
          </Box>
        </ErrorBoundary>
      )}
    </Box>
  );
};

export default BuildingDetailsScreen;