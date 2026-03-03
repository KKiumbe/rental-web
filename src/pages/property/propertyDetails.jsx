import { useEffect, useState, Component } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CircularProgress,
  Typography,
  Box,
  Paper,
  Grid,
  IconButton,
  Button,
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
  Divider,
  Tooltip,
  Stack,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WaterIcon from '@mui/icons-material/Water';
import { ThemeProvider } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { getTheme } from '../../store/theme';

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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info', // Added for Alert
  });
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
    invoicePeriod: null,
    invoiceType: 'UTILITY',
  });
  const [utilityBillFormError, setUtilityBillFormError] = useState('');
  const { id } = useParams();
  const [expenseForm, setExpenseForm] = useState({
    buildingId: id,
    expenseType: 'REPAIR',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const theme = getTheme();

  // Centralized Snackbar handler
  const showSnackbar = (message, severity = 'error') => {
    console.log('Showing Snackbar:', { message, severity }); // Debug log
    setSnackbar({ open: true, message, severity });
  };

  // Sanitize building object
  const sanitizedBuilding = building
    ? {
        ...building,
        landlord: building.landlord || { name: '', email: '', phoneNumber: '' },
        units: Array.isArray(building.units) ? building.units : [],
        customers: Array.isArray(building.customers) ? building.customers : [],
        unitCount: building.unitCount || (Array.isArray(building.units) ? building.units.length : 0),
        customerCount: building.customerCount || (Array.isArray(building.customers) ? building.customerCount : 0),
        managementRate: building.managementRate ? building.managementRate : 0,
        gasRate: building.gasRate ? building.gasRate : 0,
        waterRate: building.waterRate  ? building.waterRate : 0,
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
      setUtilityBillForm((prev) => ({ ...prev, buildingId: response.data.id || id }));
    } catch (err) {
      console.error('Fetch building error:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 404) {
        setError('Building not found');
      } else {
        setError('Failed to fetch building details');
        showSnackbar('Failed to fetch building details');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUnit = async (unitId) => {
    try {
      setUnitsLoading(true);
      const response = await axios.get(`${BASE_URL}/units/${unitId}`, {
        withCredentials: true,
      });
      const unitData = response.data?.data;
      if (!unitData) throw new Error('No unit data returned');
      setSelectedUnit(unitData);
      setEditFormData({
        buildingId: unitId,
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
      showSnackbar(err.response?.data?.error || 'Failed to fetch unit details');
      setSelectedUnit(null);
    } finally {
      setUnitsLoading(false);
    }
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
    if (!building?.id) {
      showSnackbar('Building not loaded yet');
      return;
    }
    navigate(`/add-unit/${building.id || id}`);
  };

  const handleCloseViewUnit = () => {
    setViewUnitOpen(false);
    setSelectedUnit(null);
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
      if (!expenseForm.amount || !expenseForm.description || !expenseForm.date) {
        showSnackbar('Please fill in all required fields for expense');
        return;
      }
      await axios.post(`${BASE_URL}/building-expenses`, expenseForm, {
        withCredentials: true,
      });
      showSnackbar('Expense submitted successfully', 'success');
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
      if (err.response?.status === 400) {
        showSnackbar(err.response?.data?.error || 'No active tenant found');
      } else if (err.response?.status === 404) {
        showSnackbar(err.response?.data?.error || 'No building found');
      } else {
        showSnackbar(err.response?.data?.error || 'Failed to submit expense');
      }
    }
  };

  const handleUtilityBillSubmit = async (e) => {
    e.preventDefault();
    setUtilityBillFormError('');
    try {
      if (!utilityBillForm.amount || !utilityBillForm.description || !utilityBillForm.invoicePeriod) {
        setUtilityBillFormError('Please fill in all required fields.');
        showSnackbar('Please fill in all required fields for utility bill');
        return;
      }
      await axios.post(
        `${BASE_URL}/shared-utility-bill`,
        {
          buildingId: utilityBillForm.buildingId,
          amount: Number(utilityBillForm.amount),
          description: utilityBillForm.description,
          invoicePeriod: format(utilityBillForm.invoicePeriod, 'MM/yyyy'),
          invoiceType: utilityBillForm.invoiceType,
        },
        { withCredentials: true }
      );
      showSnackbar('Utility bills generated successfully', 'success');
      setUtilityBillModalOpen(false);
      setUtilityBillForm({
        buildingId: id,
        amount: '',
        description: '',
        invoicePeriod: null,
        invoiceType: 'UTILITY',
      });
    } catch (err) {
      console.error('Generate utility bill error:', err);
      setUtilityBillFormError(err.response?.data?.error || 'Failed to generate utility bills');
      showSnackbar(err.response?.data?.error || 'Failed to generate utility bills');
    }
  };

  const handleUpdateUnit = async () => {
    setUnitsLoading(true);
    try {
      const unit = building?.units?.find((u) => u.unitNumber === editFormData.unitNumber);
      if (!unit) {
        showSnackbar('Unit not found for update.');
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
      showSnackbar('Unit updated successfully', 'success');
      handleCloseEditUnit();
      fetchBuilding();
    } catch (err) {
      console.error('Update unit error:', err);
      showSnackbar(err.response?.data?.error || 'Failed to update unit. Please try again.');
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
        showSnackbar(
          isPhoneNumber ? 'No customer found with that phone number' : 'No customer found with that name'
        );
      }
    } catch (err) {
      console.error('Search error:', err);
      showSnackbar(
        err.code === 'ERR_NETWORK'
          ? 'Server not reachable. Please check if the backend is running.'
          : err.response?.status === 404
          ? isPhoneNumber
            ? 'No customer found with that phone number'
            : 'No customer found with that name'
          : err.response?.data?.message || 'Error searching customers'
      );
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssignUnit = async (customerId) => {
    try {
      if (!selectedUnitForAssign?.id || !customerId) {
        showSnackbar('Unit or customer not selected');
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
      showSnackbar('Unit assigned successfully', 'success');
      fetchBuilding();
      handleCloseAssignDialog();
    } catch (err) {
      console.error('Assign unit error:', err);
      showSnackbar(err.response?.data?.error || 'Failed to assign unit');
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const formatDate = (value) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '—'; }
  };

  const statusChip = (status) => {
    const map = {
      OCCUPIED:                 { label: 'Occupied',        bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
      OCCUPIED_PENDING_PAYMENT: { label: 'Pending Payment', bg: '#fff8e1', color: '#f57f17', border: '#ffe082' },
      VACANT:                   { label: 'Vacant',          bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' },
      MAINTENANCE:              { label: 'Maintenance',     bg: '#fce4ec', color: '#b71c1c', border: '#ef9a9a' },
    };
    const s = map[status] || { label: status, bg: '#f5f5f5', color: '#616161', border: '#e0e0e0' };
    return (
      <Chip label={s.label} size="small"
        sx={{ fontWeight: 600, fontSize: '0.7rem', backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}
      />
    );
  };

  const CustomToolbar = () => (
    <GridToolbarContainer sx={{ px: 1, py: 0.5, gap: 0.5 }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  const unitColumns = [
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="View Unit">
            <IconButton size="small" onClick={() => handleViewUnit(params.row)}
              sx={{ color: theme?.palette?.blueAccent?.main }}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Unit">
            <IconButton size="small" onClick={() => handleEditUnit(params.row)}
              sx={{ color: theme?.palette?.greenAccent?.main }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.status === 'OCCUPIED' ? 'Unit is occupied' : 'Assign tenant'}>
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PersonAddIcon sx={{ fontSize: '13px !important' }} />}
                onClick={() => handleOpenAssignDialog(params.row)}
                disabled={params.row.status === 'OCCUPIED'}
                sx={{
                  fontSize: '0.7rem', py: 0.3, px: 0.8, minWidth: 0,
                  borderColor: theme?.palette?.greenAccent?.main,
                  color: theme?.palette?.greenAccent?.main,
                  '&:hover': { backgroundColor: `${theme?.palette?.greenAccent?.main}14` },
                }}
              >
                Assign
              </Button>
            </span>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'unitNumber', headerName: 'Unit No.', width: 100,
      renderCell: (params) => <Typography variant="body2" fontWeight={600}>{params.value}</Typography>,
    },
    {
      field: 'status', headerName: 'Status', width: 165,
      renderCell: (params) => statusChip(params.value),
    },
    {
      field: 'customers', headerName: 'Tenants', width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.5 }}>
          {params.value?.length > 0
            ? params.value.map((c) => (
                <Chip key={c.id} size="small"
                  label={c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim()}
                  sx={{ fontSize: '0.7rem', height: 22 }}
                />
              ))
            : <Typography variant="caption" color="text.secondary">—</Typography>
          }
        </Box>
      ),
    },
    {
      field: 'monthlyCharge', headerName: 'Rent (Ksh)', width: 120, type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500}>{Number(params.value || 0).toLocaleString()}</Typography>
      ),
    },
    {
      field: 'depositAmount', headerName: 'Deposit (Ksh)', width: 120, type: 'number',
      renderCell: (params) => <Typography variant="body2">{Number(params.value || 0).toLocaleString()}</Typography>,
    },
    {
      field: 'garbageCharge', headerName: 'Garbage (Ksh)', width: 120, type: 'number',
      renderCell: (params) => <Typography variant="body2">{params.value ? Number(params.value).toLocaleString() : '—'}</Typography>,
    },
    {
      field: 'serviceCharge', headerName: 'Service (Ksh)', width: 120, type: 'number',
      renderCell: (params) => <Typography variant="body2">{params.value ? Number(params.value).toLocaleString() : '—'}</Typography>,
    },
  ];

  // ── Derived stats ──────────────────────────────────────────────────────────

  const units = sanitizedBuilding?.units ?? [];
  const occupiedCount  = units.filter((u) => u.status === 'OCCUPIED').length;
  const vacantCount    = units.filter((u) => u.status === 'VACANT').length;
  const occupancyRate  = units.length > 0 ? Math.round((occupiedCount / units.length) * 100) : 0;

  useEffect(() => {
    if (id) fetchBuilding();
  }, [id]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ bgcolor: theme?.palette?.background?.default, minHeight: '100vh', p: { xs: 2, md: 3 } }}>

          {/* ── Page Header ── */}
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 2, mb: 3,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Tooltip title="Go back">
                <IconButton onClick={() => navigate(-1)} size="small"
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Box>
                <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
                  {sanitizedBuilding?.name || 'Building Details'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                  <Typography variant="caption" color="text.secondary"
                    component={Link} to="/properties"
                    sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    Properties
                  </Typography>
                  <Typography variant="caption" color="text.secondary">/</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {sanitizedBuilding?.name || 'Details'}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="outlined" size="small" startIcon={<EditIcon />}
                component={Link} to={`/edit-building/${id}`}
                sx={{ borderRadius: 1.5, fontWeight: 600 }}>
                Edit Property
              </Button>
              <Button variant="contained" size="small" startIcon={<HomeRepairServiceIcon />}
                onClick={() => setExpenseModalOpen(true)}
                sx={{ borderRadius: 1.5, fontWeight: 600, backgroundColor: '#f57c00', '&:hover': { backgroundColor: '#e65100' } }}>
                Raise Expense
              </Button>
              <Button variant="contained" size="small" startIcon={<ElectricBoltIcon />}
                onClick={() => setUtilityBillModalOpen(true)}
                sx={{ borderRadius: 1.5, fontWeight: 600, backgroundColor: theme?.palette?.blueAccent?.main, '&:hover': { backgroundColor: theme?.palette?.blueAccent?.dark } }}>
                Utility Bill
              </Button>
            </Box>
          </Box>

          {/* ── Loading / Error states ── */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <Stack alignItems="center" spacing={1.5}>
                <CircularProgress size={36} />
                <Typography variant="body2" color="text.secondary">Loading building details…</Typography>
              </Stack>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
          ) : !sanitizedBuilding ? (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>No building data available.</Alert>
          ) : (
            <ErrorBoundary>

              {/* ── Stats row ── */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                {[
                  { icon: <MeetingRoomIcon />, label: 'Total Units',    value: units.length,    color: '#7b1fa2' },
                  { icon: <ApartmentIcon />,   label: 'Occupied',       value: occupiedCount,   color: '#2e7d32' },
                  { icon: <ApartmentIcon />,   label: 'Vacant',         value: vacantCount,     color: '#1565c0' },
                  { icon: <PeopleAltIcon />,   label: 'Occupancy Rate', value: `${occupancyRate}%`, color: '#f57c00' },
                ].map(({ icon, label, value, color }) => (
                  <Paper key={label} elevation={0} sx={{
                    flex: 1, minWidth: 140, p: 2, borderRadius: 2,
                    border: '1px solid', borderColor: 'divider',
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    bgcolor: theme?.palette?.background?.paper,
                  }}>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: 1.5, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: `${color}18`, color,
                    }}>{icon}</Box>
                    <Box>
                      <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{value}</Typography>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>

              {/* ── Building info card ── */}
              <Paper elevation={0} sx={{
                borderRadius: 2, border: '1px solid', borderColor: 'divider',
                overflow: 'hidden', mb: 3, bgcolor: theme?.palette?.background?.paper,
              }}>
                <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
                  display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ApartmentIcon sx={{ color: theme?.palette?.blueAccent?.main }} fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={700}>Property Information</Typography>
                </Box>
                <Box sx={{ p: 2.5 }}>
                  <Grid container spacing={2}>
                    {/* Left column */}
                    <Grid item xs={12} sm={6}>
                      <Stack spacing={1.5}>
                        {[
                          { icon: <ApartmentIcon fontSize="small" />, label: 'Address',        value: sanitizedBuilding.address || '—' },
                          { icon: <MeetingRoomIcon fontSize="small" />, label: 'Total Units',   value: sanitizedBuilding.unitCount },
                          { icon: <WaterIcon fontSize="small" />,      label: 'Water Rate',    value: sanitizedBuilding.waterRate ? `Ksh ${Number(sanitizedBuilding.waterRate).toLocaleString()}` : '—' },
                          { icon: <ElectricBoltIcon fontSize="small" />, label: 'Gas Rate',    value: sanitizedBuilding.gasRate ? `Ksh ${Number(sanitizedBuilding.gasRate).toLocaleString()}` : '—' },
                        ].map(({ icon, label, value }) => (
                          <Box key={label} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Box sx={{ color: 'text.secondary', mt: 0.2, flexShrink: 0 }}>{icon}</Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                              <Typography variant="body2" fontWeight={600}>{value}</Typography>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </Grid>
                    {/* Right column — landlord */}
                    <Grid item xs={12} sm={6}>
                      <Paper elevation={0} sx={{
                        p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
                        bgcolor: theme?.palette?.background?.default, height: '100%',
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          <PersonIcon sx={{ color: theme?.palette?.blueAccent?.main }} fontSize="small" />
                          <Typography variant="subtitle2" fontWeight={700}>Landlord</Typography>
                        </Box>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="body2" fontWeight={600}>{sanitizedBuilding.landlord.name || '—'}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">{sanitizedBuilding.landlord.phoneNumber || '—'}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">{sanitizedBuilding.landlord.email || '—'}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarMonthIcon fontSize="small" color="action" />
                            <Typography variant="body2">{formatDate(sanitizedBuilding.createdAt)}</Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>

              {/* ── Units table ── */}
              <Paper elevation={0} sx={{
                borderRadius: 2, border: '1px solid', borderColor: 'divider',
                overflow: 'hidden', mb: 3, bgcolor: theme?.palette?.background?.paper,
              }}>
                <Box sx={{
                  px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MeetingRoomIcon sx={{ color: theme?.palette?.greenAccent?.main }} fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={700}>Units</Typography>
                    <Chip label={units.length} size="small" sx={{
                      fontWeight: 700, bgcolor: `${theme?.palette?.greenAccent?.main}18`,
                      color: theme?.palette?.greenAccent?.main,
                    }} />
                  </Box>
                  <Button variant="contained" size="small" startIcon={<AddIcon />}
                    onClick={handleAddUnit} disabled={!building?.id}
                    sx={{
                      fontWeight: 600, borderRadius: 1.5,
                      backgroundColor: theme?.palette?.greenAccent?.main, color: '#fff',
                      '&:hover': { backgroundColor: theme?.palette?.greenAccent?.dark },
                    }}>
                    Add Unit
                  </Button>
                </Box>
                <DataGrid
                  rows={units}
                  columns={unitColumns}
                  getRowId={(row) => row.id}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  pageSizeOptions={[10, 20, 50]}
                  disableRowSelectionOnClick
                  autoHeight
                  density="comfortable"
                  slots={{ toolbar: CustomToolbar }}
                  sx={{
                    border: 0,
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: theme?.palette?.background?.default,
                      fontWeight: 700, fontSize: '0.78rem',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      borderBottom: '2px solid', borderColor: 'divider',
                    },
                    '& .MuiDataGrid-row:hover': { backgroundColor: `${theme?.palette?.greenAccent?.main}0a` },
                    '& .MuiDataGrid-cell': { borderColor: 'divider', alignItems: 'center' },
                    '& .MuiDataGrid-footerContainer': { borderTop: '1px solid', borderColor: 'divider' },
                  }}
                />
              </Paper>

              {/* ── View Unit Dialog ── */}
              <Dialog open={viewUnitOpen} onClose={handleCloseViewUnit} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MeetingRoomIcon color="action" fontSize="small" />
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
                        { label: 'Unit Number',    value: selectedUnit.unitNumber },
                        { label: 'Status',         value: statusChip(selectedUnit.status) },
                        { label: 'Monthly Rent',   value: `Ksh ${Number(selectedUnit.monthlyCharge || 0).toLocaleString()}` },
                        { label: 'Deposit',        value: `Ksh ${Number(selectedUnit.depositAmount || 0).toLocaleString()}` },
                        { label: 'Garbage Charge', value: selectedUnit.garbageCharge ? `Ksh ${Number(selectedUnit.garbageCharge).toLocaleString()}` : '—' },
                        { label: 'Service Charge', value: selectedUnit.serviceCharge ? `Ksh ${Number(selectedUnit.serviceCharge).toLocaleString()}` : '—' },
                        { label: 'Security Charge',value: selectedUnit.securityCharge ? `Ksh ${Number(selectedUnit.securityCharge).toLocaleString()}` : '—' },
                        { label: 'Amenities',      value: selectedUnit.amenitiesCharge ? `Ksh ${Number(selectedUnit.amenitiesCharge).toLocaleString()}` : '—' },
                        { label: 'Generator',      value: selectedUnit.backupGeneratorCharge ? `Ksh ${Number(selectedUnit.backupGeneratorCharge).toLocaleString()}` : '—' },
                        { label: 'Created',        value: formatDate(selectedUnit.createdAt) },
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
                  <Button variant="outlined" startIcon={<EditIcon />}
                    onClick={() => { handleCloseViewUnit(); setEditUnitOpen(true); }}
                    disabled={unitsLoading || !selectedUnit}>
                    Edit
                  </Button>
                  <Button variant="contained" disableElevation onClick={handleCloseViewUnit}>Close</Button>
                </DialogActions>
              </Dialog>

              {/* ── Edit Unit Dialog ── */}
              <Dialog open={editUnitOpen} onClose={handleCloseEditUnit} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EditIcon color="action" fontSize="small" />
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
                      { label: 'Monthly Charge (Ksh)',    name: 'monthlyCharge' },
                      { label: 'Deposit Amount (Ksh)',     name: 'depositAmount' },
                      { label: 'Garbage Charge (Ksh)',     name: 'garbageCharge' },
                      { label: 'Service Charge (Ksh)',     name: 'serviceCharge' },
                      { label: 'Security Charge (Ksh)',    name: 'securityCharge' },
                      { label: 'Amenities Charge (Ksh)',   name: 'amenitiesCharge' },
                      { label: 'Generator Charge (Ksh)',   name: 'backupGeneratorCharge' },
                    ].map(({ label, name }) => (
                      <Grid item xs={12} sm={6} key={name}>
                        <TextField label={label} name={name} type="number"
                          value={editFormData[name]} onChange={handleInputChange}
                          fullWidth size="small" inputProps={{ min: 0 }} />
                      </Grid>
                    ))}
                  </Grid>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ px: 3, py: 1.5 }}>
                  <Button onClick={handleCloseEditUnit} disabled={unitsLoading}>Cancel</Button>
                  <Button onClick={handleUpdateUnit} variant="contained" disableElevation
                    disabled={unitsLoading}
                    sx={{ fontWeight: 600, backgroundColor: theme?.palette?.greenAccent?.main, color: '#fff',
                      '&:hover': { backgroundColor: theme?.palette?.greenAccent?.dark } }}>
                    {unitsLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save Changes'}
                  </Button>
                </DialogActions>
              </Dialog>

              {/* ── Assign Unit Dialog ── */}
              <Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonAddIcon color="action" fontSize="small" />
                    <Typography variant="h6" fontWeight={700}>
                      Assign Unit {selectedUnitForAssign?.unitNumber}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={handleCloseAssignDialog}><CloseIcon fontSize="small" /></IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2.5 }}>
                  <TextField fullWidth size="small"
                    placeholder="Search by name or phone number…"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); handleSearch(e.target.value); }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {isSearching
                            ? <CircularProgress size={16} />
                            : <SearchIcon fontSize="small" color="action" />}
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />
                  {searchResults.length > 0 && (
                    <Box sx={{ maxHeight: 300, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {searchResults.map((customer) => (
                        <Paper key={customer.id} variant="outlined" sx={{
                          p: 1.5, borderRadius: 1.5,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <PersonIcon color="action" fontSize="small" />
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {customer.firstName} {customer.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">{customer.phoneNumber}</Typography>
                            </Box>
                          </Box>
                          <Button variant="contained" size="small" disableElevation
                            onClick={() => handleAssignUnit(customer.id)}
                            sx={{ fontWeight: 600, fontSize: '0.75rem',
                              backgroundColor: theme?.palette?.greenAccent?.main, color: '#fff',
                              '&:hover': { backgroundColor: theme?.palette?.greenAccent?.dark } }}>
                            Assign
                          </Button>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </DialogContent>
                <Divider />
                <DialogActions sx={{ px: 3, py: 1.5 }}>
                  <Button onClick={handleCloseAssignDialog} variant="contained" disableElevation>Close</Button>
                </DialogActions>
              </Dialog>

              {/* ── Raise Expense Dialog ── */}
              <Dialog open={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HomeRepairServiceIcon color="action" fontSize="small" />
                    <Typography variant="h6" fontWeight={700}>Raise Repair Expense</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => setExpenseModalOpen(false)}><CloseIcon fontSize="small" /></IconButton>
                </DialogTitle>
                <Divider />
                <form onSubmit={handleExpenseSubmit}>
                  <DialogContent sx={{ pt: 2.5 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small" required>
                          <InputLabel>Expense Type</InputLabel>
                          <Select name="expenseType" value={expenseForm.expenseType}
                            onChange={handleExpenseFormChange} label="Expense Type">
                            {['REPAIR','MAINTENANCE','RENOVATION','UTILITY','OTHER'].map((v) => (
                              <MenuItem key={v} value={v}>{v}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Amount (Ksh)" name="amount" type="number"
                          value={expenseForm.amount} onChange={handleExpenseFormChange}
                          required fullWidth size="small" inputProps={{ min: 0 }} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Date" name="date" type="date"
                          value={expenseForm.date} onChange={handleExpenseFormChange}
                          required fullWidth size="small" InputLabelProps={{ shrink: true }} />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField label="Description" name="description"
                          value={expenseForm.description} onChange={handleExpenseFormChange}
                          required fullWidth size="small" multiline rows={3} />
                      </Grid>
                    </Grid>
                  </DialogContent>
                  <Divider />
                  <DialogActions sx={{ px: 3, py: 1.5 }}>
                    <Button onClick={() => setExpenseModalOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="contained" disableElevation
                      sx={{ fontWeight: 600, backgroundColor: '#f57c00', color: '#fff',
                        '&:hover': { backgroundColor: '#e65100' } }}>
                      Submit Expense
                    </Button>
                  </DialogActions>
                </form>
              </Dialog>

              {/* ── Utility Bill Dialog ── */}
              <Dialog open={utilityBillModalOpen} onClose={() => setUtilityBillModalOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ElectricBoltIcon color="action" fontSize="small" />
                    <Typography variant="h6" fontWeight={700}>Generate Utility Bill</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => setUtilityBillModalOpen(false)}><CloseIcon fontSize="small" /></IconButton>
                </DialogTitle>
                <Divider />
                <form onSubmit={handleUtilityBillSubmit}>
                  <DialogContent sx={{ pt: 2.5 }}>
                    {utilityBillFormError && (
                      <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{utilityBillFormError}</Alert>
                    )}
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small" required>
                          <InputLabel>Invoice Type</InputLabel>
                          <Select name="invoiceType" value={utilityBillForm.invoiceType}
                            onChange={handleUtilityBillFormChange} label="Invoice Type">
                            <MenuItem value="UTILITY">Utility</MenuItem>
                            <MenuItem value="WATER">Water</MenuItem>
                            <MenuItem value="ELECTRICITY">Electricity</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Amount (Ksh)" name="amount" type="number"
                          value={utilityBillForm.amount} onChange={handleUtilityBillFormChange}
                          required fullWidth size="small" inputProps={{ step: '1', min: 0 }} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <DatePicker
                          label="Invoice Period"
                          views={['month', 'year']}
                          value={utilityBillForm.invoicePeriod}
                          onChange={(v) => setUtilityBillForm((p) => ({ ...p, invoicePeriod: v }))}
                          slotProps={{ textField: { size: 'small', fullWidth: true, required: true, helperText: 'Select month & year' } }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField label="Description" name="description"
                          value={utilityBillForm.description} onChange={handleUtilityBillFormChange}
                          required fullWidth size="small" multiline rows={3} />
                      </Grid>
                    </Grid>
                  </DialogContent>
                  <Divider />
                  <DialogActions sx={{ px: 3, py: 1.5 }}>
                    <Button onClick={() => setUtilityBillModalOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="contained" disableElevation
                      sx={{ fontWeight: 600, backgroundColor: theme?.palette?.blueAccent?.main, color: '#fff',
                        '&:hover': { backgroundColor: theme?.palette?.blueAccent?.dark } }}>
                      Generate Bills
                    </Button>
                  </DialogActions>
                </form>
              </Dialog>

            </ErrorBoundary>
          )}

          {/* ── Snackbar ── */}
          <Snackbar open={snackbar.open} autoHideDuration={4000}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
            <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
              severity={snackbar.severity} variant="filled" sx={{ borderRadius: 1.5 }}>
              {snackbar.message}
            </Alert>
          </Snackbar>

        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default BuildingDetailsScreen;
