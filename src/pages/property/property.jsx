import { useEffect, useState, Component } from 'react';
import axios from 'axios';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
} from '@mui/x-data-grid';
import {
  CircularProgress,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Snackbar,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Tooltip,
  InputAdornment,
  Grid,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import ApartmentIcon from '@mui/icons-material/Apartment';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloseIcon from '@mui/icons-material/Close';
import TitleComponent from '../../components/title';
import { getTheme } from '../../store/theme';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
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
    name: data.name || 'Unnamed',
    address: data.address || 'N/A',
    unitCount: Array.isArray(data.units) ? data.units.length : Number(data.unitCount ?? 0),
    managementRate: Number(data.managementRate ?? 0),
    gasRate: Number(data.gasRate ?? 0),
    waterRate: Number(data.waterRate ?? 0),
    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : new Date().toISOString(),
    landlord: data.landlord
      ? {
          id: data.landlord.id || '',
          name: data.landlord.name ||
            `${data.landlord.firstName || ''} ${data.landlord.lastName || ''}`.trim() || 'Unknown',
          email: data.landlord.email || 'N/A',
          phoneNumber: data.landlord.phoneNumber || 'N/A',
        }
      : { id: '', name: 'Unknown', email: 'N/A', phoneNumber: 'N/A' },
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
            ? unit.customers.map((c) => ({
                id: c.id || '',
                firstName: c.firstName || 'Unknown',
                lastName: c.lastName || 'Unknown',
                email: c.email || 'N/A',
                phoneNumber: c.phoneNumber || 'N/A',
                secondaryPhoneNumber: c.secondaryPhoneNumber || 'N/A',
                nationalId: c.nationalId || 'N/A',
                status: c.status || 'UNKNOWN',
                closingBalance: Number(c.closingBalance ?? 0),
                createdAt: c.createdAt
                  ? new Date(c.createdAt).toISOString()
                  : new Date().toISOString(),
              }))
            : [],
          createdAt: unit.createdAt ? new Date(unit.createdAt).toISOString() : new Date().toISOString(),
        }))
      : [],
    customerCount: Number(
      data.units?.reduce((sum, unit) => sum + (unit.customers?.length || 0), 0) ?? 0
    ),
  };
  return sanitized;
};

// Sanitize Rows for DataGrid
const sanitizeRows = (rows) =>
  Array.isArray(rows)
    ? rows
        .filter((building) => building && typeof building === 'object' && building.id)
        .map((building) => ({
          id: building.id,
          name: building.name || 'Unnamed',
          address: building.address || '',
          unitCount: Array.isArray(building.units)
            ? building.units.length
            : Number(building.unitCount ?? 0),
          managementRate: Number(building.managementRate ?? 0),
          gasRate: Number(building.gasRate ?? 0),
          waterRate: Number(building.waterRate ?? 0),
          createdAt: building.createdAt ? new Date(building.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: building.updatedAt ? new Date(building.updatedAt).toISOString() : new Date().toISOString(),
          landlord: building.landlord?.name ||
            `${building.landlord?.firstName || ''} ${building.landlord?.lastName || ''}`.trim() || 'Unknown',
          occupiedUnits: Array.isArray(building.units)
            ? building.units.filter((unit) =>
                ['OCCUPIED', 'OCCUPIED_PENDING_PAYMENT'].includes(unit.status)
              ).length
            : 0,
          units: Array.isArray(building.units) ? building.units : [],
        }))
    : [];

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
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10); // Match API default
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

  const fetchBuildings = async (pageNum, limitNum) => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/buildings`, {
        params: { page: pageNum + 1, limit: limitNum },
        withCredentials: true,
      });
      console.log('Raw buildings response:', response.data);
      const responseData = response.data;
      // Support both { buildings: [], meta: {} } and { data: [], meta: {} } shapes
      const buildingsData = responseData.buildings ?? responseData.data ?? [];
      const meta = responseData.meta ?? {};
      const sanitizedBuildings = sanitizeRows(buildingsData);
      console.log('Sanitized buildings:', sanitizedBuildings);
      setBuildings(sanitizedBuildings);
      setSearchResults(sanitizedBuildings);
      setTotalBuildings(Number(meta.total) || sanitizedBuildings.length);
      setPageSize(Number(meta.limit) || 10);
    } catch (err) {
      console.error('Fetch buildings error:', err);
      console.error('Response data:', err.response?.data);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError(`Failed to fetch buildings: ${err.response?.data?.message || err.message}`);
        setSnackbarMessage(`Failed to fetch buildings: ${err.response?.data?.message || err.message}`);
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
      const unitData = response.data?.data;
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
    } catch (err) {
      console.error('Fetch unit error:', err);
      setSnackbarMessage(err.response?.data?.error || 'Failed to fetch unit details');
      setSnackbarOpen(true);
      setSelectedUnit(null);
    } finally {
      setUnitsLoading(false);
    }
  };

  const handleUpdateUnit = async (e) => {
    e.preventDefault();
    if (!selectedUnit?.id) {
      setSnackbarMessage('Unit data is still loading. Please wait and try again.');
      setSnackbarOpen(true);
      return;
    }
    try {
      setUnitsLoading(true);
      const payload = {
        buildingId: selectedUnit.buildingId || selectedBuilding?.id,
        unitNumber: editFormData.unitNumber,
        monthlyCharge: Number(editFormData.monthlyCharge) || 0,
        depositAmount: Number(editFormData.depositAmount) || 0,
        garbageCharge: Number(editFormData.garbageCharge) || 0,
        serviceCharge: Number(editFormData.serviceCharge) || 0,
        securityCharge: Number(editFormData.securityCharge) || 0,
        amenitiesCharge: Number(editFormData.amenitiesCharge) || 0,
        backupGeneratorCharge: Number(editFormData.backupGeneratorCharge) || 0,
        status: editFormData.status,
      };
      const response = await axios.put(
        `${BASE_URL}/units/${selectedUnit.id}`,
        payload,
        { withCredentials: true }
      );
      const updatedUnit = response.data?.data || response.data || {};
      setUnits((prev) =>
        prev.map((unit) =>
          unit.id === selectedUnit.id ? { ...unit, ...updatedUnit } : unit
        )
      );
      setEditUnitOpen(false);
      setSelectedUnit(null);
      setSnackbarMessage('Unit updated successfully');
      setSnackbarOpen(true);
      // Refresh the building to reflect latest data
      if (selectedBuilding?.id) fetchBuilding(selectedBuilding.id);
    } catch (err) {
      console.error('Update unit error:', err);
      setSnackbarMessage(err.response?.data?.message || err.response?.data?.error || 'Failed to update unit. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setUnitsLoading(false);
    }
  };

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
      console.log('Raw search response:', response.data);
      const responseData = response.data;
      const buildingsData = responseData.buildings ?? responseData.data ?? [];
      const meta = responseData.meta ?? {};
      setSearchResults(sanitizeRows(buildingsData));
      setTotalBuildings(Number(meta.total) || buildingsData.length);
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
      navigate(`/add-unit/${selectedBuilding.id}`);
    } else {
      setSnackbarMessage('Please select a building first');
      setSnackbarOpen(true);
    }
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
      [name]:
        name === 'status'
          ? value
          : name.includes('Charge') || name === 'depositAmount'
          ? parseFloat(value) || 0
          : value,
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
    const trimmedQuery = (query || '').trim();
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
        ? response.data
          ? [response.data]
          : []
        : Array.isArray(response.data)
        ? response.data
        : [];
      setCustomerSearchResults(results);
      if (!results.length) {
        setSnackbarMessage(
          isPhoneNumber ? 'No customer found with that phone number' : 'No customer found with that name'
        );
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Customer search error:', error);
      setSnackbarMessage(
        error.response?.status === 404
          ? isPhoneNumber
            ? 'No customer found with that phone number'
            : 'No customer found with that name'
          : 'Error searching customers'
      );
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
      const isAlreadyAssigned = selectedUnitForAssign.customers?.some(
        (customer) => customer.id === customerId
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
          unitId: selectedUnitForAssign.id,
        },
        { withCredentials: true }
      );
      setSnackbarMessage(response.data.message || 'Unit assigned successfully');
      setSnackbarOpen(true);
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
          default:
            errorMessage = error.response.data?.message || 'Failed to assign unit';
        }
      }
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setAssignmentLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings(page, pageSize);
  }, [page, pageSize]);

  const formatDate = (value) => {
    if (!value) return '—';
    try {
      const date = new Date(value);
      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return '—';
    }
  };

  const buildingColumns = [
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Building Details">
            <IconButton
              component={Link}
              to={`/building-details/${params.row.id}`}
              size="small"
              onClick={(e) => e.stopPropagation()}
              sx={{ color: theme?.palette?.blueAccent?.main }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Building">
            <IconButton
              component={Link}
              to={`/edit-building/${params.row.id}`}
              size="small"
              onClick={(e) => e.stopPropagation()}
              sx={{ color: theme?.palette?.greenAccent?.main }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Load Units Below">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBuilding(params.row);
                fetchBuilding(params.row.id);
              }}
              sx={{
                color: selectedBuilding?.id === params.row.id
                  ? '#fff'
                  : theme?.palette?.grey[500],
                backgroundColor: selectedBuilding?.id === params.row.id
                  ? theme?.palette?.greenAccent?.main
                  : 'transparent',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: `${theme?.palette?.greenAccent?.main}22`,
                  color: theme?.palette?.greenAccent?.main,
                },
              }}
            >
              <MeetingRoomIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'name',
      headerName: 'Building Name',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ApartmentIcon fontSize="small" sx={{ color: theme?.palette?.blueAccent?.main, flexShrink: 0 }} />
          <Typography variant="body2" fontWeight={600} noWrap>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    { field: 'address', headerName: 'Address', flex: 1.5, minWidth: 160,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" noWrap>{params.value || '—'}</Typography>
      ),
    },
    {
      field: 'landlord',
      headerName: 'Landlord',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleAltIcon fontSize="small" sx={{ color: theme?.palette?.grey[500], flexShrink: 0 }} />
          <Typography variant="body2" noWrap>{params.value || '—'}</Typography>
        </Box>
      ),
    },
    {
      field: 'unitCount',
      headerName: 'Total Units',
      width: 110,
      type: 'number',
      renderCell: (params) => (
        <Chip
          icon={<MeetingRoomIcon sx={{ fontSize: '14px !important' }} />}
          label={params.value ?? 0}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600, borderColor: theme?.palette?.blueAccent?.main, color: theme?.palette?.blueAccent?.main }}
        />
      ),
    },
    {
      field: 'occupiedUnits',
      headerName: 'Occupied',
      width: 100,
      type: 'number',
      renderCell: (params) => (
        <Chip
          label={params.value ?? 0}
          size="small"
          sx={{
            fontWeight: 600,
            backgroundColor: params.value > 0 ? '#e8f5e9' : '#fafafa',
            color: params.value > 0 ? '#2e7d32' : theme?.palette?.grey[500],
            border: `1px solid ${params.value > 0 ? '#a5d6a7' : '#e0e0e0'}`,
          }}
        />
      ),
    },
    {
      field: 'waterRate',
      headerName: 'Water Rate',
      width: 120,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value ? `Ksh ${Number(params.value).toLocaleString()}` : '—'}
        </Typography>
      ),
    },
    {
      field: 'gasRate',
      headerName: 'Gas Rate',
      width: 110,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value ? `Ksh ${Number(params.value).toLocaleString()}` : '—'}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">{formatDate(params.value)}</Typography>
      ),
    },
  ];

  const statusChip = (status) => {
    const map = {
      OCCUPIED:                { label: 'Occupied',         bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
      OCCUPIED_PENDING_PAYMENT:{ label: 'Pending Payment',  bg: '#fff8e1', color: '#f57f17', border: '#ffe082' },
      VACANT:                  { label: 'Vacant',           bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' },
      MAINTENANCE:             { label: 'Maintenance',      bg: '#fce4ec', color: '#b71c1c', border: '#ef9a9a' },
    };
    const s = map[status] || { label: status, bg: '#f5f5f5', color: '#616161', border: '#e0e0e0' };
    return (
      <Chip
        label={s.label}
        size="small"
        sx={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, fontWeight: 600, fontSize: '0.7rem' }}
      />
    );
  };

  const unitColumns = [
    {
      field: 'actions',
      headerName: '',
      width: 50,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="View Unit">
          <IconButton size="small" onClick={() => handleViewUnit(params.row)}
            sx={{ color: theme?.palette?.blueAccent?.main }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: 'edit',
      headerName: '',
      width: 50,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Edit Unit">
          <IconButton size="small" onClick={() => handleEditUnit(params.row)}
            sx={{ color: theme?.palette?.greenAccent?.main }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: 'assign',
      headerName: 'Assign',
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const occupied = params.row.status === 'OCCUPIED';
        return (
          <Tooltip title={occupied ? 'Unit is occupied' : 'Assign tenant'}>
            <span>
              <Button
                variant="contained"
                size="small"
                startIcon={<PersonAddIcon sx={{ fontSize: '14px !important' }} />}
                onClick={() => handleOpenAssignDialog(params.row)}
                disabled={occupied}
                sx={{
                  fontSize: '0.7rem',
                  py: 0.4,
                  px: 1,
                  backgroundColor: occupied ? undefined : theme?.palette?.greenAccent?.main,
                  '&:hover': { backgroundColor: occupied ? undefined : theme?.palette?.greenAccent?.dark },
                }}
              >
                {occupied ? 'Occupied' : 'Assign'}
              </Button>
            </span>
          </Tooltip>
        );
      },
    },
    {
      field: 'unitNumber',
      headerName: 'Unit No.',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 160,
      renderCell: (params) => statusChip(params.value),
    },
    {
      field: 'monthlyCharge',
      headerName: 'Rent (Ksh)',
      width: 130,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500}>
          {Number(params.value).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'depositAmount',
      headerName: 'Deposit (Ksh)',
      width: 130,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2">{Number(params.value).toLocaleString()}</Typography>
      ),
    },
    {
      field: 'garbageCharge',
      headerName: 'Garbage (Ksh)',
      width: 130,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2">{params.value ? Number(params.value).toLocaleString() : '—'}</Typography>
      ),
    },
    {
      field: 'serviceCharge',
      headerName: 'Service (Ksh)',
      width: 130,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2">{params.value ? Number(params.value).toLocaleString() : '—'}</Typography>
      ),
    },
    {
      field: 'securityCharge',
      headerName: 'Security (Ksh)',
      width: 130,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2">{params.value ? Number(params.value).toLocaleString() : '—'}</Typography>
      ),
    },
    {
      field: 'amenitiesCharge',
      headerName: 'Amenities (Ksh)',
      width: 140,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2">{params.value ? Number(params.value).toLocaleString() : '—'}</Typography>
      ),
    },
    {
      field: 'backupGeneratorCharge',
      headerName: 'Generator (Ksh)',
      width: 140,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2">{params.value ? Number(params.value).toLocaleString() : '—'}</Typography>
      ),
    },
    {
      field: 'customerCount',
      headerName: 'Tenants',
      width: 90,
      type: 'number',
      renderCell: (params) => (
        <Chip label={params.value ?? 0} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 110,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">{formatDate(params.value)}</Typography>
      ),
    },
  ];

  // Summary stats
  const totalUnits = searchResults.reduce((s, b) => s + (b.unitCount || 0), 0);
  const totalOccupied = searchResults.reduce((s, b) => s + (b.occupiedUnits || 0), 0);
  const occupancyRate = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0;

  const StatCard = ({ icon, label, value, color }) => (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 160,
        p: 2.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        bgcolor: theme?.palette?.background?.paper,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${color}18`,
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Box>
    </Paper>
  );
  StatCard.propTypes = { icon: PropTypes.node, label: PropTypes.string, value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), color: PropTypes.string };

  const CustomToolbar = () => (
    <GridToolbarContainer sx={{ px: 1, py: 0.5, gap: 0.5 }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  return (
    <Box
      sx={{
        bgcolor: theme?.palette?.background?.default,
        minHeight: '100vh',
        p: { xs: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <TitleComponent title="Properties" />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddProperty}
          sx={{
            backgroundColor: theme?.palette?.greenAccent?.main,
            color: '#fff',
            fontWeight: 600,
            borderRadius: 1.5,
            px: 2.5,
            '&:hover': { backgroundColor: theme?.palette?.greenAccent?.dark },
          }}
        >
          Add Property
        </Button>
      </Box>

      {/* ── Summary Cards ──────────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <StatCard
          icon={<ApartmentIcon />}
          label="Total Properties"
          value={totalBuildings}
          color={theme?.palette?.blueAccent?.main || '#1976d2'}
        />
        <StatCard
          icon={<MeetingRoomIcon />}
          label="Total Units"
          value={totalUnits}
          color="#7b1fa2"
        />
        <StatCard
          icon={<CheckCircleOutlineIcon />}
          label="Occupied Units"
          value={totalOccupied}
          color={theme?.palette?.greenAccent?.main || '#388e3c'}
        />
        <StatCard
          icon={<PeopleAltIcon />}
          label="Occupancy Rate"
          value={`${occupancyRate}%`}
          color="#f57c00"
        />
      </Box>

      {/* ── Search Bar ─────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 1.5,
          alignItems: 'center',
          flexWrap: 'wrap',
          bgcolor: theme?.palette?.background?.paper,
        }}
      >
        <TextField
          placeholder="Search by property or landlord name…"
          variant="outlined"
          size="small"
          sx={{ flex: 1, minWidth: 240 }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={isSearching}
          sx={{
            backgroundColor: theme?.palette?.blueAccent?.main,
            color: '#fff',
            fontWeight: 600,
            minWidth: 110,
            '&:hover': { backgroundColor: theme?.palette?.blueAccent?.dark },
          }}
        >
          {isSearching ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Search'}
        </Button>
        {searchQuery && (
          <Tooltip title="Clear search">
            <IconButton size="small" onClick={() => { setSearchQuery(''); setSearchResults(buildings); }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Paper>

      {/* ── Properties Table ───────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          bgcolor: theme?.palette?.background?.paper,
        }}
      >
        <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ApartmentIcon sx={{ color: theme?.palette?.blueAccent?.main }} />
            <Typography variant="subtitle1" fontWeight={700}>All Properties</Typography>
            <Chip label={totalBuildings} size="small" sx={{ ml: 0.5, fontWeight: 700, bgcolor: `${theme?.palette?.blueAccent?.main}18`, color: theme?.palette?.blueAccent?.main }} />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Use <MeetingRoomIcon sx={{ fontSize: 13, verticalAlign: 'middle', mx: 0.3 }} /> to load units · <VisibilityIcon sx={{ fontSize: 13, verticalAlign: 'middle', mx: 0.3 }} /> for details
          </Typography>
        </Box>
        <ErrorBoundary>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
              <Stack alignItems="center" spacing={1.5}>
                <CircularProgress size={32} />
                <Typography variant="body2" color="text.secondary">Loading properties…</Typography>
              </Stack>
            </Box>
          ) : error ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
            </Box>
          ) : (
            <DataGrid
              rows={searchResults}
              columns={buildingColumns}
              getRowId={(row) => row.id}
              paginationMode="server"
              rowCount={totalBuildings}
              page={page}
              pageSize={pageSize}
              rowsPerPageOptions={[10, 20, 50]}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
              disableSelectionOnClick
              autoHeight
              density="comfortable"
              components={{ Toolbar: CustomToolbar }}
              sx={{
                border: 0,
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: theme?.palette?.background?.default,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                },
                '& .MuiDataGrid-row': {
                  '&:hover': { backgroundColor: `${theme?.palette?.blueAccent?.main}0a` },
                  '&.Mui-selected': {
                    backgroundColor: `${theme?.palette?.greenAccent?.main}14`,
                    '&:hover': { backgroundColor: `${theme?.palette?.blueAccent?.main}1e` },
                  },
                },
                '& .MuiDataGrid-cell': { borderColor: 'divider', alignItems: 'center' },
                '& .MuiDataGrid-footerContainer': { borderTop: '1px solid', borderColor: 'divider' },
              }}
            />
          )}
        </ErrorBoundary>
      </Paper>

      {/* ── Units Panel ────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: selectedBuilding ? theme?.palette?.greenAccent?.main : 'divider',
          overflow: 'hidden',
          bgcolor: theme?.palette?.background?.paper,
          transition: 'border-color 0.2s',
        }}
      >
        <Box sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexWrap: 'wrap',
          gap: 1,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MeetingRoomIcon sx={{ color: theme?.palette?.greenAccent?.main }} />
            <Typography variant="subtitle1" fontWeight={700}>
              {selectedBuilding ? `Units — ${selectedBuilding.name}` : 'Units'}
            </Typography>
            {selectedBuilding && (
              <Chip
                label={units.length}
                size="small"
                sx={{ fontWeight: 700, bgcolor: `${theme?.palette?.greenAccent?.main}18`, color: theme?.palette?.greenAccent?.main }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!selectedBuilding && (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                ← Select a property above to view its units
              </Typography>
            )}
            <Tooltip title={!selectedBuilding ? 'Select a property first' : ''}>
              <span>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddUnit}
                  disabled={!selectedBuilding}
                  sx={{
                    fontWeight: 600,
                    backgroundColor: selectedBuilding ? theme?.palette?.greenAccent?.main : undefined,
                    color: selectedBuilding ? '#fff' : undefined,
                    '&:hover': { backgroundColor: selectedBuilding ? theme?.palette?.greenAccent?.dark : undefined },
                  }}
                >
                  Add Unit
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>
        <ErrorBoundary>
          {unitsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260 }}>
              <Stack alignItems="center" spacing={1.5}>
                <CircularProgress size={28} />
                <Typography variant="body2" color="text.secondary">Loading units…</Typography>
              </Stack>
            </Box>
          ) : selectedBuilding && units.length > 0 ? (
            <DataGrid
              rows={units}
              columns={unitColumns}
              getRowId={(row) => row.id}
              pageSize={10}
              rowsPerPageOptions={[10, 20, 50]}
              autoHeight
              density="comfortable"
              disableSelectionOnClick
              components={{ Toolbar: CustomToolbar }}
              sx={{
                border: 0,
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: theme?.palette?.background?.default,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                },
                '& .MuiDataGrid-row:hover': { backgroundColor: `${theme?.palette?.greenAccent?.main}0a` },
                '& .MuiDataGrid-cell': { borderColor: 'divider', alignItems: 'center' },
                '& .MuiDataGrid-footerContainer': { borderTop: '1px solid', borderColor: 'divider' },
              }}
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 220, gap: 1.5 }}>
              <MeetingRoomIcon sx={{ fontSize: 48, color: 'action.disabled' }} />
              <Typography variant="body1" color="text.secondary" fontWeight={500}>
                {selectedBuilding ? 'No units found for this property.' : 'Select a property to view its units.'}
              </Typography>
            </Box>
          )}
        </ErrorBoundary>
      </Paper>

      {/* ── View Unit Dialog ───────────────────────────────────── */}
      <Dialog open={viewUnitOpen} onClose={handleCloseViewUnit} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MeetingRoomIcon color="action" />
            <Typography variant="h6" fontWeight={700}>Unit Details</Typography>
          </Box>
          <IconButton size="small" onClick={handleCloseViewUnit}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          {unitsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : selectedUnit ? (
            <Grid container spacing={2}>
              {[
                { label: 'Unit Number', value: selectedUnit.unitNumber },
                { label: 'Status', value: statusChip(selectedUnit.status) },
                { label: 'Monthly Rent', value: `Ksh ${Number(selectedUnit.monthlyCharge || 0).toLocaleString()}` },
                { label: 'Deposit', value: `Ksh ${Number(selectedUnit.depositAmount || 0).toLocaleString()}` },
                { label: 'Garbage Charge', value: selectedUnit.garbageCharge ? `Ksh ${Number(selectedUnit.garbageCharge).toLocaleString()}` : '—' },
                { label: 'Service Charge', value: selectedUnit.serviceCharge ? `Ksh ${Number(selectedUnit.serviceCharge).toLocaleString()}` : '—' },
                { label: 'Security Charge', value: selectedUnit.securityCharge ? `Ksh ${Number(selectedUnit.securityCharge).toLocaleString()}` : '—' },
                { label: 'Amenities Charge', value: selectedUnit.amenitiesCharge ? `Ksh ${Number(selectedUnit.amenitiesCharge).toLocaleString()}` : '—' },
                { label: 'Generator Charge', value: selectedUnit.backupGeneratorCharge ? `Ksh ${Number(selectedUnit.backupGeneratorCharge).toLocaleString()}` : '—' },
                { label: 'Created', value: formatDate(selectedUnit.createdAt) },
              ].map(({ label, value }) => (
                <Grid item xs={6} key={label}>
                  <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                  <Typography variant="body2" fontWeight={600} component="div">{value}</Typography>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="text.secondary">No unit selected.</Typography>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => { handleCloseViewUnit(); setEditUnitOpen(true); }}
            disabled={unitsLoading || !selectedUnit}
          >
            Edit
          </Button>
          <Button onClick={handleCloseViewUnit} variant="contained" disableElevation>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Assign Unit Dialog ─────────────────────────────────── */}
      <Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon color="action" />
            <Typography variant="h6" fontWeight={700}>
              Assign Unit {selectedUnitForAssign?.unitNumber}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleCloseAssignDialog}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          {selectedUnitForAssign?.customers?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="overline" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 1 }}>
                Current Tenants
              </Typography>
              {selectedUnitForAssign.customers.map((c) => (
                <Paper key={c.id} variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PeopleAltIcon color="action" fontSize="small" />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{c.firstName} {c.lastName}</Typography>
                    <Typography variant="caption" color="text.secondary">{c.phoneNumber}</Typography>
                  </Box>
                </Paper>
              ))}
              <Divider sx={{ my: 2 }} />
            </Box>
          )}
          <Typography variant="overline" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 1.5 }}>
            Search & Assign Tenant
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name or phone number…"
            value={customerSearchQuery}
            onChange={(e) => { setCustomerSearchQuery(e.target.value); handleCustomerSearch(e.target.value); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {isCustomerSearching ? <CircularProgress size={16} /> : <SearchIcon fontSize="small" color="action" />}
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          {customerSearchResults.length > 0 && (
            <Box sx={{ maxHeight: 280, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {customerSearchResults.map((customer) => {
                const alreadyAssigned = selectedUnitForAssign?.customers?.some((c) => c.id === customer.id);
                return (
                  <Paper
                    key={customer.id}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      borderColor: alreadyAssigned ? 'error.main' : 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <PeopleAltIcon color="action" fontSize="small" />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{customer.firstName} {customer.lastName}</Typography>
                        <Typography variant="caption" color="text.secondary">{customer.phoneNumber}</Typography>
                      </Box>
                    </Box>
                    {alreadyAssigned ? (
                      <Chip label="Assigned" size="small" color="error" variant="outlined" />
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleAssignUnit(customer.id)}
                        disabled={assignmentLoading}
                        sx={{
                          backgroundColor: theme?.palette?.greenAccent?.main,
                          color: '#fff',
                          fontWeight: 600,
                          '&:hover': { backgroundColor: theme?.palette?.greenAccent?.dark },
                        }}
                      >
                        {assignmentLoading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Assign'}
                      </Button>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={handleCloseAssignDialog} variant="contained" disableElevation disabled={assignmentLoading}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Unit Dialog ───────────────────────────────────── */}
      <Dialog open={editUnitOpen} onClose={handleCloseEditUnit} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="action" />
            <Typography variant="h6" fontWeight={700}>Edit Unit</Typography>
          </Box>
          <IconButton size="small" onClick={handleCloseEditUnit}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Unit Number" name="unitNumber" value={editFormData.unitNumber}
                onChange={handleInputChange} required fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select name="status" value={editFormData.status} onChange={handleInputChange} label="Status">
                  <MenuItem value="VACANT">Vacant</MenuItem>
                  <MenuItem value="OCCUPIED">Occupied</MenuItem>
                  <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                  <MenuItem value="OCCUPIED_PENDING_PAYMENT">Occupied Pending Payment</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {[
              { label: 'Monthly Charge (Ksh)', name: 'monthlyCharge' },
              { label: 'Deposit Amount (Ksh)', name: 'depositAmount' },
              { label: 'Garbage Charge (Ksh)', name: 'garbageCharge' },
              { label: 'Service Charge (Ksh)', name: 'serviceCharge' },
              { label: 'Security Charge (Ksh)', name: 'securityCharge' },
              { label: 'Amenities Charge (Ksh)', name: 'amenitiesCharge' },
              { label: 'Generator Charge (Ksh)', name: 'backupGeneratorCharge' },
            ].map(({ label, name }) => (
              <Grid item xs={12} sm={6} key={name}>
                <TextField
                  label={label}
                  name={name}
                  type="number"
                  value={editFormData[name]}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  inputProps={{ min: 0 }}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={handleCloseEditUnit} disabled={unitsLoading}>Cancel</Button>
          <Button
            onClick={handleUpdateUnit}
            variant="contained"
            disableElevation
            disabled={unitsLoading}
            sx={{
              backgroundColor: theme?.palette?.greenAccent?.main,
              color: '#fff',
              fontWeight: 600,
              '&:hover': { backgroundColor: theme?.palette?.greenAccent?.dark },
            }}
          >
            {unitsLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ───────────────────────────────────────────── */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarMessage.toLowerCase().includes('success') ? 'success' : 'info'}
          variant="filled"
          sx={{ borderRadius: 1.5 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BuildingsScreen;