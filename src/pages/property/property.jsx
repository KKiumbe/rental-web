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
  Chip,
  Tooltip,
  InputAdornment,
  Stack,
  Divider,
  LinearProgress,
} from '@mui/material';
import AddIcon              from '@mui/icons-material/Add';
import SearchIcon           from '@mui/icons-material/Search';
import ApartmentIcon        from '@mui/icons-material/Apartment';
import MeetingRoomIcon      from '@mui/icons-material/MeetingRoom';
import CloseIcon            from '@mui/icons-material/Close';
import EditIcon             from '@mui/icons-material/Edit';
import VisibilityIcon       from '@mui/icons-material/Visibility';
import LocationOnIcon       from '@mui/icons-material/LocationOn';
import KeyboardArrowRightIcon   from '@mui/icons-material/KeyboardArrowRight';
import HomeWorkIcon         from '@mui/icons-material/HomeWork';
import { Link } from 'react-router-dom';
import TitleComponent from '../../components/title';
import { getTheme }   from '../../store/theme';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import PropTypes from 'prop-types';

import { sanitizeBuilding, sanitizeRows } from './propertyHelpers';
import PropertySummaryCards from './PropertySummaryCards';
import { getUnitColumns }   from './unitColumns.jsx';
import ViewUnitDialog       from './dialogs/ViewUnitDialog';
import EditUnitDialog       from './dialogs/EditUnitDialog';
import AssignUnitDialog     from './dialogs/AssignUnitDialog';

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
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
ErrorBoundary.propTypes = { children: PropTypes.node };

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ px: 1, py: 0.5, gap: 0.5 }}>
    <GridToolbarColumnsButton />
    <GridToolbarFilterButton />
    <GridToolbarDensitySelector />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const EMPTY_FORM = {
  unitNumber: '', monthlyCharge: 0, depositAmount: 0, waterDepositAmount: 0,
  garbageCharge: 0, serviceCharge: 0, securityCharge: 0,
  amenitiesCharge: 0, backupGeneratorCharge: 0, status: 'VACANT',
};

/* ── Building Card (left-rail item) ───────────────────────────────────────── */
const BuildingCard = ({ building, selected, onSelect, theme }) => {
  const total    = building.unitCount    || 0;
  const occupied = building.occupiedUnits || 0;
  const pct      = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const barColor = pct >= 80 ? '#ef5350' : pct >= 50 ? '#ff9800' : '#66bb6a';

  return (
    <Box
      onClick={() => onSelect(building)}
      sx={{
        px: 2,
        py: 1.5,
        cursor: 'pointer',
        borderLeft: '3px solid',
        borderLeftColor: selected ? (theme?.palette?.blueAccent?.main || '#1976d2') : 'transparent',
        bgcolor: selected
          ? `${theme?.palette?.blueAccent?.main || '#1976d2'}10`
          : 'transparent',
        transition: 'all 0.15s ease',
        '&:hover': {
          bgcolor: selected
            ? `${theme?.palette?.blueAccent?.main || '#1976d2'}14`
            : 'action.hover',
          borderLeftColor: theme?.palette?.blueAccent?.main || '#1976d2',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              bgcolor: selected
                ? `${theme?.palette?.blueAccent?.main || '#1976d2'}20`
                : 'action.selected',
              color: selected
                ? (theme?.palette?.blueAccent?.main || '#1976d2')
                : 'text.secondary',
            }}
          >
            <HomeWorkIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={selected ? 700 : 600}
              noWrap
              color={selected ? (theme?.palette?.blueAccent?.main || 'primary.main') : 'text.primary'}
            >
              {building.name}
            </Typography>
            {building.address && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                <LocationOnIcon sx={{ fontSize: 10, mr: 0.3, verticalAlign: 'middle' }} />
                {building.address}
              </Typography>
            )}
          </Box>
        </Box>
        <KeyboardArrowRightIcon
          fontSize="small"
          sx={{
            color: selected ? (theme?.palette?.blueAccent?.main || '#1976d2') : 'text.disabled',
            flexShrink: 0,
            mt: 0.5,
            transition: 'transform 0.15s',
            transform: selected ? 'rotate(90deg)' : 'none',
          }}
        />
      </Box>

      {/* occupancy bar */}
      <Box sx={{ mt: 1.2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
          <Typography variant="caption" color="text.secondary">
            {occupied}/{total} units
          </Typography>
          <Typography variant="caption" fontWeight={700} sx={{ color: barColor }}>
            {pct}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 4,
            borderRadius: 2,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': { bgcolor: barColor, borderRadius: 2 },
          }}
        />
      </Box>
    </Box>
  );
};
BuildingCard.propTypes = {
  building: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  theme:    PropTypes.object,
};

/* ════════════════════════════════════════════════════════════════════════════ */
const BuildingsScreen = () => {
  const [buildings,            setBuildings]            = useState([]);
  const [searchResults,        setSearchResults]        = useState([]);
  const [searchQuery,          setSearchQuery]          = useState('');
  const [isSearching,          setIsSearching]          = useState(false);
  const [loading,              setLoading]              = useState(true);
  const [error,                setError]                = useState(null);
  const [snackbar,             setSnackbar]             = useState({ open: false, msg: '', severity: 'info' });
  const [selectedBuilding,     setSelectedBuilding]     = useState(null);
  const [units,                setUnits]                = useState([]);
  const [unitsLoading,         setUnitsLoading]         = useState(false);
  const [viewUnitOpen,         setViewUnitOpen]         = useState(false);
  const [editUnitOpen,         setEditUnitOpen]         = useState(false);
  const [selectedUnit,         setSelectedUnit]         = useState(null);
  const [editFormData,         setEditFormData]         = useState(EMPTY_FORM);
  const [page,                 setPage]                 = useState(0);
  const [pageSize,             setPageSize]             = useState(10);
  const [totalBuildings,       setTotalBuildings]       = useState(0);
  const [assignDialogOpen,     setAssignDialogOpen]     = useState(false);
  const [selectedUnitForAssign,setSelectedUnitForAssign]= useState(null);
  const [customerSearchQuery,  setCustomerSearchQuery]  = useState('');
  const [customerSearchResults,setCustomerSearchResults]= useState([]);
  const [isCustomerSearching,  setIsCustomerSearching]  = useState(false);
  const [assignmentLoading,    setAssignmentLoading]    = useState(false);

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate    = useNavigate();
  const theme       = getTheme();
  const BASE_URL    = import.meta.env.VITE_BASE_URL || 'https://taqa.co.ke/api';

  const showSnack = (msg, severity = 'info') => setSnackbar({ open: true, msg, severity });

  useEffect(() => { if (!currentUser) navigate('/login'); }, [currentUser, navigate]);

  /* ── API helpers ──────────────────────────────────────────────────────── */
  const fetchBuildings = async (pageNum, limitNum) => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/buildings`, {
        params: { page: pageNum + 1, limit: limitNum },
        withCredentials: true,
      });
      const buildingsData = res.data.buildings ?? res.data.data ?? [];
      const meta          = res.data.meta ?? {};
      const sanitized     = sanitizeRows(buildingsData);
      setBuildings(sanitized);
      setSearchResults(sanitized);
      setTotalBuildings(Number(meta.total) || sanitized.length);
      setPageSize(Number(meta.limit) || 10);
    } catch (err) {
      if (err.response?.status === 401) { navigate('/login'); return; }
      const msg = `Failed to fetch buildings: ${err.response?.data?.message || err.message}`;
      setError(msg);
      showSnack(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBuilding = async (id) => {
    try {
      setUnitsLoading(true);
      const res       = await axios.get(`${BASE_URL}/buildings/${id}`, { withCredentials: true });
      const sanitized = sanitizeBuilding(res.data);
      if (sanitized) {
        setSelectedBuilding(sanitized);
        setUnits(sanitized.units);
      } else {
        showSnack('Invalid building data', 'error');
      }
    } catch (err) {
      if (err.response?.status === 401) { navigate('/login'); return; }
      showSnack(err.response?.status === 404 ? 'Building not found' : 'Failed to fetch building details', 'error');
    } finally {
      setUnitsLoading(false);
    }
  };

  const fetchUnit = async (id) => {
    try {
      setUnitsLoading(true);
      const res      = await axios.get(`${BASE_URL}/units/${id}`, { withCredentials: true });
      const unitData = res.data?.data;
      if (!unitData) throw new Error('No unit data returned');
      setSelectedUnit(unitData);
      setEditFormData({
        unitNumber:           unitData.unitNumber || '',
        monthlyCharge:        Number(unitData.monthlyCharge) || 0,
        depositAmount:        Number(unitData.depositAmount) || 0,
        waterDepositAmount:   Number(unitData.waterDepositAmount) || 0,
        garbageCharge:        Number(unitData.garbageCharge) || 0,
        serviceCharge:        Number(unitData.serviceCharge) || 0,
        securityCharge:       Number(unitData.securityCharge) || 0,
        amenitiesCharge:      Number(unitData.amenitiesCharge) || 0,
        backupGeneratorCharge:Number(unitData.backupGeneratorCharge) || 0,
        status:               unitData.status || 'VACANT',
      });
    } catch (err) {
      showSnack(err.response?.data?.error || 'Failed to fetch unit details', 'error');
      setSelectedUnit(null);
    } finally {
      setUnitsLoading(false);
    }
  };

  const handleUpdateUnit = async (e) => {
    e?.preventDefault();
    if (!selectedUnit?.id) { showSnack('Unit data is still loading. Please wait.', 'warning'); return; }
    try {
      setUnitsLoading(true);
      const payload = {
        buildingId:           selectedUnit.buildingId || selectedBuilding?.id,
        unitNumber:           editFormData.unitNumber,
        monthlyCharge:        Number(editFormData.monthlyCharge) || 0,
        depositAmount:        Number(editFormData.depositAmount) || 0,
        waterDepositAmount:   Number(editFormData.waterDepositAmount) || 0,
        garbageCharge:        Number(editFormData.garbageCharge) || 0,
        serviceCharge:        Number(editFormData.serviceCharge) || 0,
        securityCharge:       Number(editFormData.securityCharge) || 0,
        amenitiesCharge:      Number(editFormData.amenitiesCharge) || 0,
        backupGeneratorCharge:Number(editFormData.backupGeneratorCharge) || 0,
        status:               editFormData.status,
      };
      const res         = await axios.put(`${BASE_URL}/units/${selectedUnit.id}`, payload, { withCredentials: true });
      const updatedUnit = res.data?.data || res.data || {};
      setUnits((prev) => prev.map((u) => u.id === selectedUnit.id ? { ...u, ...updatedUnit } : u));
      setEditUnitOpen(false);
      setSelectedUnit(null);
      showSnack('Unit updated successfully', 'success');
      if (selectedBuilding?.id) fetchBuilding(selectedBuilding.id);
    } catch (err) {
      showSnack(err.response?.data?.message || err.response?.data?.error || 'Failed to update unit.', 'error');
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
      const res           = await axios.get(`${BASE_URL}/buildings`, { params: { name: searchQuery.trim() }, withCredentials: true });
      const buildingsData = res.data.buildings ?? res.data.data ?? [];
      const meta          = res.data.meta ?? {};
      setSearchResults(sanitizeRows(buildingsData));
      setTotalBuildings(Number(meta.total) || buildingsData.length);
    } catch {
      showSnack('Error searching buildings', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCustomerSearch = async (query) => {
    const trimmed = (query || '').trim();
    if (!trimmed) { setCustomerSearchResults([]); return; }
    setIsCustomerSearching(true);
    const isPhone = /^\d+$/.test(trimmed);
    try {
      if (isPhone && trimmed.length < 10) { setCustomerSearchResults([]); return; }
      const url    = isPhone ? `${BASE_URL}/search-customer-by-phone` : `${BASE_URL}/search-customer-by-name`;
      const params = isPhone ? { phone: trimmed } : { name: trimmed };
      const res    = await axios.get(url, { params, withCredentials: true });
      const results = isPhone ? (res.data ? [res.data] : []) : (Array.isArray(res.data) ? res.data : []);
      setCustomerSearchResults(results);
      if (!results.length) showSnack(isPhone ? 'No customer found with that phone number' : 'No customer found with that name', 'info');
    } catch (err) {
      showSnack(err.response?.status === 404
        ? (isPhone ? 'No customer found with that phone number' : 'No customer found with that name')
        : 'Error searching customers', 'error');
      setCustomerSearchResults([]);
    } finally {
      setIsCustomerSearching(false);
    }
  };

  const handleAssignUnit = async (customerId) => {
    if (!selectedUnitForAssign?.id || !customerId) { showSnack('Unit or customer not selected', 'warning'); return; }
    if (selectedUnitForAssign.customers?.some((c) => c.id === customerId)) {
      showSnack('Customer is already assigned to this unit', 'warning');
      return;
    }
    try {
      setAssignmentLoading(true);
      const res = await axios.post(`${BASE_URL}/assign-unit-to-customer`,
        { customerId, unitId: selectedUnitForAssign.id },
        { withCredentials: true }
      );
      showSnack(res.data.message || 'Unit assigned successfully', 'success');
      await fetchBuilding(selectedBuilding.id);
      if (selectedUnit) await fetchUnit(selectedUnit.id);
      handleCloseAssignDialog();
    } catch (err) {
      const status = err.response?.status;
      const msg = status === 400 ? err.response.data?.message || 'Missing required information'
                : status === 404 ? err.response.data?.message || 'Unit or customer not found'
                : status === 409 ? err.response.data?.message || 'Unit already assigned to customer'
                : err.response?.data?.message || 'Failed to assign unit';
      showSnack(msg, 'error');
    } finally {
      setAssignmentLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchBuildings(page, pageSize); }, [page, pageSize]);

  /* ── UI handlers ──────────────────────────────────────────────────────── */
  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedUnitForAssign(null);
    setCustomerSearchQuery('');
    setCustomerSearchResults([]);
  };

  /* ── Column defs ─────────────────────────────────────────────────────── */
  const unitColumns = getUnitColumns({
    theme,
    onView:   (unit) => { fetchUnit(unit.id); setViewUnitOpen(true); },
    onEdit:   (unit) => { fetchUnit(unit.id); setEditUnitOpen(true); },
    onAssign: (unit) => { setSelectedUnitForAssign(unit); setAssignDialogOpen(true); },
  });

  /* ── Summary stats ────────────────────────────────────────────────────── */
  const totalUnits    = searchResults.reduce((s, b) => s + (b.unitCount    || 0), 0);
  const totalOccupied = searchResults.reduce((s, b) => s + (b.occupiedUnits|| 0), 0);
  const occupancyRate = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0;

  /* ── Per-building stats (shown in right panel header) ─────────────────── */
  const bldTotal    = selectedBuilding?.unitCount     || units.length;
  const bldOccupied = selectedBuilding?.occupiedUnits || units.filter((u) => u.status === 'OCCUPIED').length;
  const bldVacant   = bldTotal - bldOccupied;
  const bldOccPct   = bldTotal > 0 ? Math.round((bldOccupied / bldTotal) * 100) : 0;

  const gridSx = (accentColor) => ({
    border: 0,
    '& .MuiDataGrid-columnHeaders': {
      backgroundColor: theme?.palette?.background?.default,
      fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase',
      letterSpacing: '0.04em', borderBottom: '2px solid', borderColor: 'divider',
    },
    '& .MuiDataGrid-row:hover': { backgroundColor: `${accentColor}0a` },
    '& .MuiDataGrid-cell': { borderColor: 'divider', alignItems: 'center' },
    '& .MuiDataGrid-footerContainer': { borderTop: '1px solid', borderColor: 'divider' },
  });

  const blue  = theme?.palette?.blueAccent?.main  || '#1976d2';
  const green = theme?.palette?.greenAccent?.main || '#388e3c';

  /* ════════════════════ RENDER ════════════════════════════════════════════ */
  return (
    <Box sx={{ bgcolor: theme?.palette?.background?.default, minHeight: '100vh', p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Top bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <TitleComponent title="Properties" />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/add-property')}
          sx={{ backgroundColor: green, color: '#fff', fontWeight: 600, borderRadius: 1.5, px: 2.5, '&:hover': { backgroundColor: theme?.palette?.greenAccent?.dark } }}
        >
          Add Property
        </Button>
      </Box>

      {/* ── Summary cards ── */}
      <PropertySummaryCards
        totalBuildings={totalBuildings}
        totalUnits={totalUnits}
        totalOccupied={totalOccupied}
        occupancyRate={occupancyRate}
        theme={theme}
      />

      {/* ═══════════════ SPLIT PANEL ════════════════════════════════════════ */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'stretch',
          flexDirection: { xs: 'column', md: 'row' },
          flex: 1,
        }}
      >
        {/* ── LEFT RAIL — Building list ──────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', md: 300 },
            flexShrink: 0,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: theme?.palette?.background?.paper,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxHeight: { md: 'calc(100vh - 260px)' },
          }}
        >
          {/* Rail header */}
          <Box sx={{ px: 2, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ApartmentIcon sx={{ color: blue, fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={700} letterSpacing={0.3}>
                  Properties
                </Typography>
              </Box>
              <Chip
                label={totalBuildings}
                size="small"
                sx={{ fontWeight: 700, bgcolor: `${blue}18`, color: blue, height: 22, fontSize: '0.72rem' }}
              />
            </Box>

            {/* Search */}
            <TextField
              placeholder="Search properties…"
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {isSearching
                      ? <CircularProgress size={14} />
                      : <SearchIcon fontSize="small" color="action" />
                    }
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" edge="end" onClick={() => { setSearchQuery(''); setSearchResults(buildings); }}>
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
          </Box>

          {/* Building cards list */}
          <Box sx={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <Stack spacing={0} divider={<Divider />}>
                {[...Array(5)].map((_, i) => (
                  <Box key={i} sx={{ px: 2, py: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: 'action.hover', flexShrink: 0 }} />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ height: 13, borderRadius: 1, bgcolor: 'action.hover', mb: 0.6, width: '70%' }} />
                        <Box sx={{ height: 11, borderRadius: 1, bgcolor: 'action.hover', width: '50%' }} />
                      </Box>
                    </Box>
                    <Box sx={{ height: 4, borderRadius: 2, bgcolor: 'action.hover' }} />
                  </Box>
                ))}
              </Stack>
            ) : error ? (
              <Box sx={{ p: 2 }}><Alert severity="error" onClose={() => setError(null)}>{error}</Alert></Box>
            ) : searchResults.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <ApartmentIcon sx={{ fontSize: 36, color: 'action.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No properties found.</Typography>
              </Box>
            ) : (
              <Stack divider={<Divider />}>
                {searchResults.map((b) => (
                  <BuildingCard
                    key={b.id}
                    building={b}
                    selected={selectedBuilding?.id === b.id}
                    onSelect={(row) => { setSelectedBuilding(row); fetchBuilding(row.id); }}
                    theme={theme}
                  />
                ))}
              </Stack>
            )}
          </Box>

          {/* Rail footer — pagination controls */}
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              Page {page + 1}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button
                size="small"
                variant="outlined"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                sx={{ minWidth: 0, px: 1, py: 0.3, fontSize: '0.7rem', borderRadius: 1 }}
              >
                ‹ Prev
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={(page + 1) * pageSize >= totalBuildings}
                onClick={() => setPage((p) => p + 1)}
                sx={{ minWidth: 0, px: 1, py: 0.3, fontSize: '0.7rem', borderRadius: 1 }}
              >
                Next ›
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* ── RIGHT PANEL — Units ────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: '1px solid',
            borderColor: selectedBuilding ? blue : 'divider',
            bgcolor: theme?.palette?.background?.paper,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'border-color 0.2s ease',
            maxHeight: { md: 'calc(100vh - 260px)' },
          }}
        >
          {selectedBuilding ? (
            <>
              {/* Building hero header */}
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  background: `linear-gradient(135deg, ${blue}18 0%, ${green}10 100%)`,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: `${blue}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: blue }}>
                      <ApartmentIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
                        {selectedBuilding.name}
                      </Typography>
                      {selectedBuilding.address && (
                        <Typography variant="caption" color="text.secondary">
                          <LocationOnIcon sx={{ fontSize: 11, mr: 0.3, verticalAlign: 'middle' }} />
                          {selectedBuilding.address}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Action buttons */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Tooltip title="View building details">
                      <IconButton
                        component={Link}
                        to={`/building-details/${selectedBuilding.id}`}
                        size="small"
                        sx={{ color: blue, border: '1px solid', borderColor: `${blue}40`, borderRadius: 1.5, '&:hover': { bgcolor: `${blue}10` } }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit building">
                      <IconButton
                        component={Link}
                        to={`/edit-building/${selectedBuilding.id}`}
                        size="small"
                        sx={{ color: green, border: '1px solid', borderColor: `${green}40`, borderRadius: 1.5, '&:hover': { bgcolor: `${green}10` } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => navigate(`/add-unit/${selectedBuilding.id}`)}
                      sx={{ fontWeight: 700, bgcolor: green, color: '#fff', borderRadius: 1.5, px: 2, '&:hover': { bgcolor: theme?.palette?.greenAccent?.dark } }}
                    >
                      Add Unit
                    </Button>
                  </Box>
                </Box>

                {/* Stat strip */}
                <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Total Units',   value: bldTotal,     color: blue  },
                    { label: 'Occupied',      value: bldOccupied,  color: '#2e7d32' },
                    { label: 'Vacant',        value: bldVacant,    color: '#f57c00' },
                    { label: 'Occupancy',     value: `${bldOccPct}%`, color: bldOccPct >= 80 ? '#c62828' : bldOccPct >= 50 ? '#e65100' : '#2e7d32' },
                    ...(selectedBuilding.waterRate ? [{ label: 'Water Rate', value: `Ksh ${Number(selectedBuilding.waterRate).toLocaleString()}`, color: '#0277bd' }] : []),
                    ...(selectedBuilding.landlord?.name ? [{ label: 'Landlord', value: selectedBuilding.landlord.name, color: '#6a1b9a' }] : []),
                  ].map((stat) => (
                    <Box key={stat.label}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', letterSpacing: 0.4, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={800} sx={{ color: stat.color }}>
                        {stat.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Units grid */}
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {unitsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
                    <Stack alignItems="center" spacing={1.5}>
                      <CircularProgress size={30} sx={{ color: blue }} />
                      <Typography variant="body2" color="text.secondary">Loading units…</Typography>
                    </Stack>
                  </Box>
                ) : units.length > 0 ? (
                  <ErrorBoundary>
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
                      sx={gridSx(green)}
                    />
                  </ErrorBoundary>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, gap: 2 }}>
                    <MeetingRoomIcon sx={{ fontSize: 52, color: 'action.disabled' }} />
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                      No units found for this property.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => navigate(`/add-unit/${selectedBuilding.id}`)}
                      sx={{ borderColor: green, color: green, '&:hover': { bgcolor: `${green}10` } }}
                    >
                      Add First Unit
                    </Button>
                  </Box>
                )}
              </Box>
            </>
          ) : (
            /* Empty state — no building selected */
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400, gap: 2, p: 4 }}>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: 3,
                  bgcolor: `${blue}12`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: blue,
                }}
              >
                <MeetingRoomIcon sx={{ fontSize: 38 }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                Select a Property
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={320}>
                Choose a property from the list on the left to view and manage its units, occupancy details, and more.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
      {/* ═══════════════ END SPLIT PANEL ════════════════════════════════════ */}

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <ViewUnitDialog
        open={viewUnitOpen}
        loading={unitsLoading}
        unit={selectedUnit}
        onClose={() => { setViewUnitOpen(false); setSelectedUnit(null); }}
        onSwitchToEdit={() => { setViewUnitOpen(false); setEditUnitOpen(true); }}
      />

      <EditUnitDialog
        open={editUnitOpen}
        loading={unitsLoading}
        formData={editFormData}
        onClose={() => { setEditUnitOpen(false); setSelectedUnit(null); }}
        onChange={(e) => {
          const { name, value } = e.target;
          setEditFormData((prev) => ({
            ...prev,
            [name]: name === 'status' ? value
                  : (name.includes('Charge') || name === 'depositAmount' || name === 'waterDepositAmount')
                  ? parseFloat(value) || 0
                  : value,
          }));
        }}
        onSubmit={handleUpdateUnit}
        theme={theme}
      />

      <AssignUnitDialog
        open={assignDialogOpen}
        unit={selectedUnitForAssign}
        customerSearchQuery={customerSearchQuery}
        onSearchQueryChange={(q) => { setCustomerSearchQuery(q); handleCustomerSearch(q); }}
        customerSearchResults={customerSearchResults}
        isSearching={isCustomerSearching}
        assignmentLoading={assignmentLoading}
        onClose={handleCloseAssignDialog}
        onAssign={handleAssignUnit}
        theme={theme}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 1.5 }}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BuildingsScreen;
