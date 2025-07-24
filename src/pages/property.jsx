import { useEffect, useState, Component } from 'react';
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
  TextField,
  Button,
  Snackbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import TitleComponent from '../components/title';
import { getTheme } from '../store/theme';
import { Link, useNavigate } from 'react-router-dom';
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
          Error rendering table: {this.state.error?.message || 'Unknown error'}
        </Typography>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

// Sanitize Building Data
const sanitizeBuilding = (data) => {
  if (!data || typeof data !== 'object') {
    console.warn('Invalid building data:', data);
    return null;
  }
  const sanitized = {
    id: data.id || '',
    name: data.name || data.buildingName || 'Unnamed',
    buildingName: data.buildingName || data.name || 'Unnamed',
    address: data.address || 'N/A',
    unitCount: Number(data.unitCount ?? 0),
    managementRate: Number(data.managementRate ?? 0),
    gasRate: Number(data.gasRate ?? 0),
    waterRate: Number(data.waterRate ?? 0),
    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
    landlord: data.landlord
      ? {
          name: data.landlord.name || `${data.landlord.firstName || ''} ${data.landlord.lastName || ''}`.trim() || 'Unknown',
          email: data.landlord.email || 'N/A',
          phoneNumber: data.landlord.phoneNumber || 'N/A',
        }
      : { name: 'Unknown', email: 'N/A', phoneNumber: 'N/A' },
    units: Array.isArray(data.units)
      ? data.units.map((unit) => ({
          id: unit.id || '',
          unitNumber: unit.unitNumber || 'Unknown',
          monthlyCharge: Number(unit.monthlyCharge ?? 0),
          depositAmount: Number(unit.depositAmount ?? 0),
          garbageCharge: Number(unit.garbageCharge ?? 0),
          serviceCharge: Number(unit.serviceCharge ?? 0),
          securityCharge: Number(unit.securityCharge ?? 0),
          amenitiesCharge: Number(unit.amenitiesCharge ?? 0),
          backupGeneratorCharge: Number(unit.backupGeneratorCharge ?? 0),
          status: unit.status || 'VACANT',
          customerCount: Number(unit.customerCount ?? unit.customers?.length ?? 0),
          customers: Array.isArray(unit.customers)
            ? unit.customers.map((customer) => ({
                id: customer.id || '',
                firstName: customer.firstName || 'Unknown',
                lastName: customer.lastName || 'Unknown',
                email: customer.email || 'N/A',
                phoneNumber: customer.phoneNumber || 'N/A',
                secondaryPhoneNumber: customer.secondaryPhoneNumber || 'N/A',
                nationalId: customer.nationalId || 'N/A',
                status: customer.status || 'UNKNOWN',
                closingBalance: Number(customer.closingBalance ?? 0),
                leaseFileUrl: customer.leaseFileUrl || null,
                createdAt: customer.createdAt ? new Date(customer.createdAt).toISOString() : new Date().toISOString(),
              }))
            : [],
          createdAt: unit.createdAt ? new Date(unit.createdAt).toISOString() : new Date().toISOString(),
        }))
      : [],
    customers: Array.isArray(data.units)
      ? data.units.flatMap((unit) =>
          Array.isArray(unit.customers)
            ? unit.customers.map((customer) => ({
                id: customer.id || '',
                firstName: customer.firstName || 'Unknown',
                lastName: customer.lastName || 'Unknown',
                email: customer.email || 'N/A',
                phoneNumber: customer.phoneNumber || 'N/A',
                secondaryPhoneNumber: customer.secondaryPhoneNumber || 'N/A',
                nationalId: customer.nationalId || 'N/A',
                status: customer.status || 'UNKNOWN',
                closingBalance: Number(customer.closingBalance ?? 0),
                leaseFileUrl: customer.leaseFileUrl || null,
                unitNumber: unit.unitNumber || 'Unknown',
                createdAt: customer.createdAt ? new Date(customer.createdAt).toISOString() : new Date().toISOString(),
              }))
            : []
        )
      : [],
    customerCount: Number(data.customerCount ?? data.units?.reduce((sum, unit) => sum + (unit.customers?.length || 0), 0) ?? 0),
  };
  return sanitized;
};

const BuildingsScreen = () => {
  const [buildings, setBuildings] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [units, setUnits] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [viewUnitOpen, setViewUnitOpen] = useState(false);
  const [editUnitOpen, setEditUnitOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
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

  // Pagination State
  const [page, setPage] = useState(0);
  const [pageSize] = useState(5); // Fixed to 5 items per page
  const [totalBuildings, setTotalBuildings] = useState(0);

const [assignDialogOpen, setAssignDialogOpen] = useState(false);
const [selectedUnitForAssign, setSelectedUnitForAssign] = useState(null);
const [customerSearchQuery, setCustomerSearchQuery] = useState('');
const [customerSearchResults, setCustomerSearchResults] = useState([]);
const [isCustomerSearching, setIsCustomerSearching] = useState(false);
const [assignmentLoading, setAssignmentLoading] = useState(false);

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const theme = getTheme();

  const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://taqa.co.ke/api';

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Sanitize building rows for the buildings DataGrid
  const sanitizeRows = (rows) =>
    Array.isArray(rows)
      ? rows
          .filter((building) => building && typeof building === 'object' && building.id)
          .map((building) => ({
            id: building.id,
            tenantId: building.tenantId || 0,
            landlordId: building.landlordId || '',
            name: building.name || building.buildingName || 'Unnamed',
            buildingName: building.buildingName || building.name || 'Unnamed',
            address: building.address || '',
            unitCount: Number(building.unitCount ?? 0),
            managementRate: Number(building.managementRate ?? 0),
            gasRate: Number(building.gasRate ?? 0),
            waterRate: Number(building.waterRate ?? 0),
            createdAt: building.createdAt ? new Date(building.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: building.updatedAt ? new Date(building.updatedAt).toISOString() : new Date().toISOString(),
            landlord: building.landlord?.name || 'Unknown',
            occupiedUnits: Array.isArray(building.units)
              ? building.units.filter((unit) =>
                  ['OCCUPIED', 'OCCUPIED_PENDING_PAYMENT'].includes(unit.status)
                ).length
              : 0,
            units: Array.isArray(building.units) ? building.units : [],
          }))
      : [];

  const fetchBuildings = async (page, pageSize) => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/buildings`, {
        params: { page: page + 1, limit: pageSize },
        withCredentials: true,
      });
      console.log('Buildings response:', response.data); // Debug
      const { buildings, total } = response.data;
      const sanitizedBuildings = sanitizeRows(buildings);
      setBuildings(sanitizedBuildings);
      setTotalBuildings(Number(total) || 0);
      setSearchResults(sanitizedBuildings);
    } catch (err) {
      console.error('Fetch buildings error:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to fetch buildings');
        setSnackbarMessage('Failed to fetch buildings');
        setSnackbarOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBuilding = async (id) => {
    try {
      setUnitsLoading(true);
      const response = await axios.get(`${BASE_URL}/buildings/${id}`, {
        withCredentials: true,
      });
      console.log('Building response:', response.data); // Debug
      const sanitized = sanitizeBuilding(response.data);
      if (sanitized) {
        setSelectedBuilding(sanitized);
        setUnits(sanitized.units);
      } else {
        setError('Invalid building data');
        setSnackbarMessage('Invalid building data');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Fetch building error:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 404) {
        setError('Building not found');
        setSnackbarMessage('Building not found');
        setSnackbarOpen(true);
      } else {
        setError('Failed to fetch building details');
        setSnackbarMessage('Failed to fetch building details');
        setSnackbarOpen(true);
      }
    } finally {
      setUnitsLoading(false);
    }
  };

const fetchUnit = async (id) => {
  try {
    setUnitsLoading(true);
    const response = await axios.get(`${BASE_URL}/units/${id}`, {
      withCredentials: true,
    });
    console.log('Unit response:', response.data); // Already present
    const unitData = response.data?.data; // Adjust for nested 'data' in response
    if (!unitData) throw new Error('No unit data returned');
    console.log('Setting selectedUnit:', unitData); // Add this
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
  } catch (err) {
    console.error('Fetch unit error:', err);
    setSnackbarMessage(err.response?.data?.error || 'Failed to fetch unit details');
    setSnackbarOpen(true);
    setSelectedUnit(null); // Reset selectedUnit on error
  } finally {
    setUnitsLoading(false);
  }
};

  const handleUpdateUnit = async (e) => {
    e.preventDefault();
    try {
      setUnitsLoading(true);
      const response = await axios.put(`${BASE_URL}/units/${selectedUnit.id}`, editFormData, {
        withCredentials: true,
      });
      console.log('Update unit response:', response.data); // Debug
      setUnits((prev) =>
        prev.map((unit) =>
          unit.id === selectedUnit.id ? { ...unit, ...response.data.unit } : unit
        )
      );
      setEditUnitOpen(false);
      setSelectedUnit(null);
      setSnackbarMessage('Unit updated successfully');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Update unit error:', err);
      setSnackbarMessage(err.response?.data?.error || 'Failed to update unit');
      setSnackbarOpen(true);
    } finally {
      setUnitsLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings(page, pageSize);
  }, [page, pageSize]);

  const handleSearch = async () => {
    setIsSearching(true);
    if (!searchQuery.trim()) {
      setSearchResults(sanitizeRows(buildings));
      setIsSearching(false);
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/buildings`, {
        params: { name: searchQuery.trim() },
        withCredentials: true,
      });
      console.log('Search response:', response.data); // Debug
      const searchData = Array.isArray(response.data.buildings)
        ? response.data.buildings
        : [];
      setSearchResults(sanitizeRows(searchData));
      setTotalBuildings(Number(response.data.total) || searchData.length);
    } catch (error) {
      console.error('Error searching buildings:', error);
      setSnackbarMessage('Error searching buildings');
      setSnackbarOpen(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddProperty = () => {
    navigate('/add-property');
  };


const handleAddUnit = () => {
  if (selectedBuilding?.id) {
    console.log(`Navigating to /add-unit/${selectedBuilding.id}`);
    navigate(`/add-unit/${selectedBuilding.id}`);
  } else {
    console.warn('No building selected for adding unit');
    setSnackbarMessage('Please select a building first');
    setSnackbarOpen(true);
  }
};

  const handleRowClick = (params) => {
    setSelectedBuilding(params.row);
    fetchBuilding(params.row.id);
  };

  const handleViewUnit = (unit) => {
    fetchUnit(unit.id);
    setViewUnitOpen(true);
  };

  const handleEditUnit = (unit) => {
    fetchUnit(unit.id);
    setEditUnitOpen(true);
  };

  const handleCloseViewUnit = () => {
    setViewUnitOpen(false);
    setSelectedUnit(null);
  };

  const handleCloseEditUnit = () => {
    setEditUnitOpen(false);
    setSelectedUnit(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: name === 'status' ? value : (name.includes('Charge') || name === 'depositAmount' ? parseFloat(value) || 0 : value),
    }));
  };


  const handleOpenAssignDialog = (unit) => {
  setSelectedUnitForAssign(unit);
  setAssignDialogOpen(true);
};

const handleCloseAssignDialog = () => {
  setAssignDialogOpen(false);
  setSelectedUnitForAssign(null);
  setCustomerSearchQuery('');
  setCustomerSearchResults([]);
};

const handleCustomerSearch = async (query) => {
  const trimmedQuery = (query || "").trim();
  if (!trimmedQuery) {
    setCustomerSearchResults([]);
    return;
  }

  setIsCustomerSearching(true);
  const isPhoneNumber = /^\d+$/.test(trimmedQuery);

  try {
    const url = isPhoneNumber 
      ? `${BASE_URL}/search-customer-by-phone` 
      : `${BASE_URL}/search-customer-by-name`;
    const params = isPhoneNumber ? { phone: trimmedQuery } : { name: trimmedQuery };

    if (isPhoneNumber && trimmedQuery.length < 10) {
      setCustomerSearchResults([]);
      return;
    }

    const response = await axios.get(url, { params, withCredentials: true });
    const results = isPhoneNumber 
      ? response.data ? [response.data] : [] 
      : Array.isArray(response.data) ? response.data : [];
    
    setCustomerSearchResults(results);
    if (!results.length) {
      setSnackbarMessage(isPhoneNumber ? "No customer found with that phone number" : "No customer found with that name");
      setSnackbarOpen(true);
    }
  } catch (error) {
    console.error("Customer search error:", error.message);
    setSnackbarMessage(error.code === "ERR_NETWORK" 
      ? "Server not reachable. Please check if the backend is running."
      : error.response?.status === 404 
        ? (isPhoneNumber ? "No customer found with that phone number" : "No customer found with that name")
        : "Error searching customers: " + (error.response?.data?.message || error.message));
    setSnackbarOpen(true);
    setCustomerSearchResults([]);
  } finally {
    setIsCustomerSearching(false);
  }
};

const handleAssignUnit = async (customerId) => {
  try {
    setAssignmentLoading(true);
    
    if (!selectedUnitForAssign?.id || !customerId) {
      setSnackbarMessage('Unit or customer not selected');
      setSnackbarOpen(true);
      return;
    }

    // Check if this assignment already exists locally
    const isAlreadyAssigned = selectedUnitForAssign.customers?.some(
      customer => customer.id === customerId
    );

    if (isAlreadyAssigned) {
      setSnackbarMessage('Customer is already assigned to this unit');
      setSnackbarOpen(true);
      return;
    }

    const response = await axios.post(
      `${BASE_URL}/assign-unit-to-customer`,
      {
        customerId,
        unitId: selectedUnitForAssign.id
      },
      { withCredentials: true }
    );

    setSnackbarMessage(response.data.message || 'Unit assigned successfully');
    setSnackbarOpen(true);
    
    // Refresh data
    await fetchBuilding(selectedBuilding.id);
    if (selectedUnit) {
      await fetchUnit(selectedUnit.id);
    }
    
    handleCloseAssignDialog();
  } catch (error) {
    console.error('Assign unit error:', error);
    
    let errorMessage = 'Failed to assign unit';
    if (error.response) {
      switch (error.response.status) {
        case 400:
          errorMessage = error.response.data?.message || 'Missing required information';
          break;
        case 404:
          errorMessage = error.response.data?.message || 'Unit or customer not found';
          break;
        case 409:
          errorMessage = error.response.data?.message || 'This unit is already assigned to the customer';
          break;
        case 500:
          errorMessage = 'Internal server error';
          break;
        default:
          errorMessage = error.response.data?.message || `Error: ${error.response.status}`;
      }
    }
    
    setSnackbarMessage(errorMessage);
    setSnackbarOpen(true);
  } finally {
    setAssignmentLoading(false);
  }
};

  const buildingColumns = [
    {
      field: 'actions',
      headerName: 'View',
      width: 100,
      renderCell: (params) => (
        <IconButton component={Link} to={`/building-details/${params.row.id}`}>
          <VisibilityIcon />
        </IconButton>
      ),
    },
    {
      field: 'edit',
      headerName: 'Edit',
      width: 100,
      renderCell: (params) => (
        <IconButton component={Link} to={`/edit-building/${params.row.id}`}>
          <EditIcon />
        </IconButton>
      ),
    },
    { field: 'name', headerName: 'Building Name', width: 200 },
    { field: 'address', headerName: 'Address', width: 250 },
    { field: 'unitCount', headerName: 'Total Units', width: 120, type: 'number' },
    { field: 'managementRate', headerName: 'Management Rate (ksh)', width: 150, type: 'number' },
    { field: 'occupiedUnits', headerName: 'Occupied Units', width: 150, type: 'number' },
    { field: 'gasRate', headerName: 'Gas Rate (ksh)', width: 120, type: 'number' },
    { field: 'waterRate', headerName: 'Water Rate (ksh)', width: 120, type: 'number' },
    { field: 'landlord', headerName: 'Landlord', width: 150 },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 200,
      renderCell: (params) => {
        const value = params?.value;
        if (!value) return 'N/A';
        try {
          const date = new Date(value);
          date.setHours(date.getHours() - 1);
          const day = String(date.getDate()).padStart(2, '0');
          const month = date.toLocaleString('default', { month: 'short' });
          const year = date.getFullYear();
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
        } catch {
          console.error('Invalid Date:', value);
          return 'Invalid Date';
        }
      },
    },
  ];

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
        <IconButton onClick={() => handleEditUnit(params.row)}>
          <EditIcon />
        </IconButton>
      ),
    },


    {
    field: 'assign',
    headerName: 'Assign',
    width: 120,
    renderCell: (params) => (
      <Button 
        variant="contained" 
        size="small"
        onClick={() => handleOpenAssignDialog(params.row)}
        disabled={params.row.status === 'OCCUPIED'}
        sx={{
          backgroundColor: params.row.status === 'OCCUPIED' 
            ? theme?.palette?.grey[500] 
            : theme?.palette?.greenAccent?.main,
          color: '#fff',
          '&:hover': {
            backgroundColor: params.row.status === 'OCCUPIED' 
              ? theme?.palette?.grey[500] 
              : theme?.palette?.greenAccent?.dark,
          },
        }}
      >
        {params.row.status === 'OCCUPIED' ? 'Occupied' : 'Assign'}
      </Button>
    ),
  },
    { field: 'unitNumber', headerName: 'Unit Number', width: 120 },
    {
      field: 'monthlyCharge',
      headerName: 'Rent(Ksh)',
      width: 150,
      type: 'number',
      //valueFormatter: ({ value }) => `Ksh ${Number(value).toFixed(2)}`,
    },
    {
      field: 'depositAmount',
      headerName: 'Deposit Amount (ksh)',
      width: 150,
      type: 'number',
      //valueFormatter: ({ value }) => `$${Number(value).toFixed(2)}`,
    },
    {
      field: 'garbageCharge',
      headerName: 'Garbage Charge (ksh)',
      width: 150,
      type: 'number',
      //valueFormatter: ({ value }) => `$${Number(value).toFixed(2)}`,
    },
    {
      field: 'serviceCharge',
      headerName: 'Service Charge (ksh)',
      width: 150,
      type: 'number',
      //valueFormatter: ({ value }) => `$${Number(value).toFixed(2)}`,
    },
    {
      field: 'securityCharge',
      headerName: 'Security Charge (ksh)',
      width: 150,
      type: 'number',
     //valueFormatter: ({ value }) => `$${Number(value).toFixed(2)}`,
    },
    {
      field: 'amenitiesCharge',
      headerName: 'Amenities Charge (ksh)',
      width: 150,
      type: 'number',
     // valueFormatter: ({ value }) => `$${Number(value).toFixed(2)}`,
    },
    {
      field: 'backupGeneratorCharge',
      headerName: 'Backup Generator Charge (ksh)',
      width: 150,
      type: 'number',
      //valueFormatter: ({ value }) => `$${Number(value).toFixed(2)}`,
    },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'customerCount', headerName: 'Customers', width: 100, type: 'number' },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 150,
     
       renderCell: (params) => {
        if (!params?.value) return "N/A";
        try {
          const date = new Date(params.value);
          date.setHours(date.getHours() - 1); // Subtract 1 hour to correct time
          const day = String(date.getDate()).padStart(2, "0");
          const month = date.toLocaleString("default", { month: "short" });
          const year = date.getFullYear();
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          const seconds = String(date.getSeconds()).padStart(2, "0");
          return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
        } catch {
          console.error("Invalid Date:", params.value);
          return "Invalid Date";
        }
      },
    },
  ];

  return (
    <Box
      sx={{
        bgcolor: theme?.palette?.background?.paper,
        minHeight: '100vh',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: 1400,
        mx: 'auto',
      }}
    >
      <Typography component="div" variant="h5" gutterBottom>
        <TitleComponent title="Properties" />
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          label="Search by Property or Landlord Name"
          variant="outlined"
          size="small"
          sx={{
            width: '400px',
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: theme?.palette?.grey[300] },
              '&:hover fieldset': { borderColor: theme?.palette?.greenAccent?.main },
              '&.Mui-focused fieldset': { borderColor: theme?.palette?.greenAccent?.main },
            },
            '& .MuiInputLabel-root': { color: theme?.palette?.grey[100] },
          }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSearch}
          disabled={isSearching}
          sx={{ width: '200px' }}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
        <TextField
          label="Page Number"
          type="number"
          variant="outlined"
          size="small"
          sx={{ width: '100px' }}
          value={page + 1}
          onChange={(e) => {
            const newPage = Math.max(1, parseInt(e.target.value, 10) || 1) - 1;
            setPage(newPage);
          }}
        />
        <Button
          variant="contained"
         スタートIcon={<AddIcon />}
          onClick={handleAddProperty}
          sx={{
            backgroundColor: theme?.palette?.greenAccent?.main,
            color: '#fff',
            '&:hover': { backgroundColor: theme?.palette?.greenAccent?.dark },
          }}
        >
          Add Property
        </Button>
      </Box>

      {/* Buildings Panel */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>Properties</Typography>
        <Paper sx={{ width: '100%', height: { xs: 300, md: 400 }, overflow: 'auto' }}>
          <ErrorBoundary>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={30} />
              </Box>
            ) : error ? (
              <Typography color="error" sx={{ p: 2 }}>{error}</Typography>
            ) : (
              <DataGrid
                rows={searchResults}
                columns={buildingColumns}
                getRowId={(row) => row.id}
                pageSize={pageSize}
                rowCount={totalBuildings}
                paginationMode="server"
                onPageChange={(newPage) => setPage(newPage)}
                rowsPerPageOptions={[5]}
                checkboxSelection
                disableSelectionOnClick
                onRowClick={handleRowClick}
                sx={{ minWidth: 900 }}
                components={{
                  Toolbar: () => (
                    <GridToolbarContainer>
                      <GridToolbarExport />
                    </GridToolbarContainer>
                  ),
                }}
                rowSelectionModel={selectedBuilding ? [selectedBuilding.id] : []}
              />
            )}
          </ErrorBoundary>
        </Paper>
      </Box>

      {/* Units Panel */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {selectedBuilding ? `Units for ${selectedBuilding.name}` : 'Select a Building to View Units'}
        </Typography>
    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
      {selectedBuilding && (

          <Button
          variant="contained"
         スタートIcon={<AddIcon />}
          onClick={handleAddUnit}
          sx={{
            backgroundColor: theme?.palette?.greenAccent?.main,
            color: '#fff',
            '&:hover': { backgroundColor: theme?.palette?.greenAccent?.dark },
          }}
        >
          Add Unit
        </Button>
       
      )}
    </Box>

        <Paper sx={{ width: '100%', height: { xs: 300, md: 400 }, overflow: 'auto' }}>
          <ErrorBoundary>
            <Box sx={{ p: 2 }}>
              {unitsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress size={30} />
                </Box>
              ) : selectedBuilding && units.length > 0 ? (
                <DataGrid
                  rows={units}
                  columns={unitColumns}
                  getRowId={(row) => row.id}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10, 20]}
                  sx={{ minWidth: 900 }}
                  components={{
                    Toolbar: () => (
                      <GridToolbarContainer>
                        <GridToolbarExport />
                      </GridToolbarContainer>
                    ),
                  }}
                />
              ) : (
                <Typography sx={{ p: 2 }}>
                  {selectedBuilding ? 'No units available for this building.' : 'Please select a building.'}
                </Typography>
              )}
            </Box>
          </ErrorBoundary>
        </Paper>
      </Box>

      {/* Add Unit Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUnit}
          disabled={!selectedBuilding}
          sx={{
            backgroundColor: selectedBuilding ? theme?.palette?.greenAccent?.main : theme?.palette?.grey[500],
            color: '#fff',
            '&:hover': {
              backgroundColor: selectedBuilding ? theme?.palette?.greenAccent?.dark : theme?.palette?.grey[500],
            },
          }}
        >
          Add Unit
        </Button>
      </Box>

      {/* View Unit Modal */}
      <Dialog open={viewUnitOpen} onClose={handleCloseViewUnit} maxWidth="sm" fullWidth>
        <DialogTitle>Unit Details</DialogTitle>
        <DialogContent>
          {selectedUnit ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <Typography><strong>Unit Number:</strong> {selectedUnit.unitNumber}</Typography>
              <Typography><strong>Monthly Charge:</strong> ksh{selectedUnit.monthlyCharge}</Typography>
              <Typography><strong>Deposit Amount:</strong> ksh{selectedUnit.depositAmount}</Typography>
              <Typography><strong>Garbage Charge:</strong> ksh{selectedUnit.garbageCharge || 'N/A'}</Typography>
              <Typography><strong>Service Charge:</strong> ksh{selectedUnit.serviceCharge || 'N/A'}</Typography>
              <Typography><strong>Security Charge:</strong> ksh{selectedUnit.securityCharge || 'N/A'}</Typography>
              <Typography><strong>Amenities Charge:</strong> ksh{selectedUnit.amenitiesCharge || 'N/A'}</Typography>
              <Typography><strong>Backup Generator Charge:</strong> ksh{selectedUnit.backupGeneratorCharge || 'N/A'}</Typography>
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


      {/* Assign Unit Dialog */}

<Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog} maxWidth="md" fullWidth>
  <DialogTitle>
    Assign Unit {selectedUnitForAssign?.unitNumber} to Customer
  </DialogTitle>
  <DialogContent>
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Current Assignments:
      </Typography>
      
      {selectedUnitForAssign?.customers?.length > 0 ? (
        <Box sx={{ mb: 3 }}>
          {selectedUnitForAssign.customers.map(customer => (
            <Paper key={customer.id} sx={{ p: 2, mb: 1 }}>
              <Typography>
                <strong>Name:</strong> {customer.firstName} {customer.lastName}
              </Typography>
              <Typography>
                <strong>Phone:</strong> {customer.phoneNumber}
              </Typography>
              <Typography>
                <strong>Email:</strong> {customer.email || 'N/A'}
              </Typography>
            </Paper>
          ))}
        </Box>
      ) : (
        <Typography color="textSecondary" sx={{ mb: 3 }}>
          No current assignments
        </Typography>
      )}

      <Typography variant="subtitle1" gutterBottom>
        Add New Assignment:
      </Typography>
      
      <TextField
        fullWidth
        label="Search Customer by Name or Phone"
        value={customerSearchQuery}
        onChange={(e) => {
          setCustomerSearchQuery(e.target.value);
          handleCustomerSearch(e.target.value);
        }}
        sx={{ mb: 2 }}
      />
      
      {isCustomerSearching && <CircularProgress size={24} />}
      
      {customerSearchResults.length > 0 && (
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {customerSearchResults.map((customer) => (
            <Paper 
              key={customer.id} 
              sx={{ 
                p: 2, 
                mb: 1,
                border: '1px solid',
                borderColor: selectedUnitForAssign.customers?.some(c => c.id === customer.id)
                  ? 'error.main'
                  : 'divider'
              }}
            >
              <Typography><strong>Name:</strong> {customer.firstName} {customer.lastName}</Typography>
              <Typography><strong>Phone:</strong> {customer.phoneNumber}</Typography>
              <Typography><strong>Email:</strong> {customer.email || 'N/A'}</Typography>
              
              {selectedUnitForAssign.customers?.some(c => c.id === customer.id) ? (
                <Typography color="error" sx={{ mt: 1 }}>
                  Already assigned to this unit
                </Typography>
              ) : (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleAssignUnit(customer.id)}
                  disabled={assignmentLoading}
                  sx={{ 
                    mt: 1,
                    backgroundColor: theme?.palette?.greenAccent?.main,
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: theme?.palette?.greenAccent?.dark,
                    },
                  }}
                >
                  {assignmentLoading ? 'Assigning...' : 'Assign to Unit'}
                </Button>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  </DialogContent>
  <DialogActions>
    <Button 
      onClick={handleCloseAssignDialog}
      disabled={assignmentLoading}
    >
      Close
    </Button>
  </DialogActions>
</Dialog>

      {/* Edit Unit Modal */}
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
              label="Monthly Charge (ksh)"
              name="monthlyCharge"
              type="number"
              value={editFormData.monthlyCharge}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Deposit Amount (ksh)"
              name="depositAmount"
              type="number"
              value={editFormData.depositAmount}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Garbage Charge (ksh)"
              name="garbageCharge"
              type="number"
              value={editFormData.garbageCharge}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Service Charge (ksh)"
              name="serviceCharge"
              type="number"
              value={editFormData.serviceCharge}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Security Charge (ksh)"
              name="securityCharge"
              type="number"
              value={editFormData.securityCharge}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Amenities Charge (ksh)"
              name="amenitiesCharge"
              type="number"
              value={editFormData.amenitiesCharge}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Backup Generator Charge (ksh)"
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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default BuildingsScreen;