import { useEffect, useState, useMemo, useCallback, Component } from 'react';
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
  Divider,
  Tooltip,
  InputAdornment,
  Stack,
  Avatar,
  Grid,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  PeopleAlt as PeopleAltIcon,
  PersonAdd as PersonAddIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import TitleComponent from '../../components/title';
import PropTypes from 'prop-types';

const BASEURL = import.meta.env.VITE_BASE_URL || 'https://taqa.co.ke/api';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const formatDate = (val) => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
  } catch { return '—'; }
};

const getInitials = (f = '', l = '') =>
  `${f[0] || ''}${l[0] || ''}`.toUpperCase() || '?';

/* ─── status chip ─────────────────────────────────────────────────────────── */
const STATUS_STYLE = {
  ACTIVE:     { label: 'Active',     lightBg: '#e8f5e9', lightColor: '#2e7d32', darkBg: '#1b5e20', darkColor: '#a5d6a7' },
  INACTIVE:   { label: 'Inactive',   lightBg: '#fff8e1', lightColor: '#f57f17', darkBg: '#4e342e', darkColor: '#ffcc02' },
  TERMINATED: { label: 'Terminated', lightBg: '#fce4ec', lightColor: '#c62828', darkBg: '#4a1218', darkColor: '#ef9a9a' },
};

const statusChip = (value, mode = 'light') => {
  const s = STATUS_STYLE[value];
  const bg    = s ? (mode === 'dark' ? s.darkBg    : s.lightBg)    : (mode === 'dark' ? '#2a2a2a' : '#f5f5f5');
  const color = s ? (mode === 'dark' ? s.darkColor  : s.lightColor) : (mode === 'dark' ? '#bbb'    : '#616161');
  const label = s?.label || value || 'Unknown';
  return (
    <Chip label={label} size="small"
      sx={{ backgroundColor: bg, color, fontWeight: 600, fontSize: '0.7rem', border: 'none' }} />
  );
};

/* ─── error boundary ──────────────────────────────────────────────────────── */
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError)
      return <Typography color="error" sx={{ p: 2 }}>Error rendering table: {this.state.error?.message || 'Unknown error'}</Typography>;
    return this.props.children;
  }
}
ErrorBoundary.propTypes = { children: PropTypes.node };

/* ─── stat card ───────────────────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, color }) => {
  const theme = useTheme();
  return (
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
      <Box sx={{ width: 44, height: 44, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}18`, color, flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Box>
    </Paper>
  );
};
StatCard.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  color: PropTypes.string,
};

/* ─── toolbar ─────────────────────────────────────────────────────────────── */
const CustomToolbar = () => (
  <GridToolbarContainer sx={{ px: 1, py: 0.5, gap: 0.5 }}>
    <GridToolbarColumnsButton />
    <GridToolbarFilterButton />
    <GridToolbarDensitySelector />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const CustomersScreen = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const currentUser = useAuthStore((s) => s.currentUser);

  const blue  = theme.palette?.blueAccent?.main  || '#1976d2';
  const green = theme.palette?.greenAccent?.main  || '#388e3c';

  /* ── state ────────────────────────────────────────────────────────────── */
  const [customers,     setCustomers]     = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [unitQuery,     setUnitQuery]     = useState('');
  const [isSearching,   setIsSearching]   = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [page,          setPage]          = useState(0);
  const [pageSize,      setPageSize]      = useState(10);
  const [total,         setTotal]         = useState(0);
  const [selectedRow,   setSelectedRow]   = useState(null);
  const [startDate,     setStartDate]     = useState('');
  const [endDate,       setEndDate]       = useState('');
  const [snackbar,      setSnackbar]      = useState({ open: false, msg: '', severity: 'success' });

  const showSnack = (msg, severity = 'error') =>
    setSnackbar({ open: true, msg, severity });

  /* ── auth guard ──────────────────────────────────────────────────────── */
  useEffect(() => { if (!currentUser) navigate('/login'); }, [currentUser, navigate]);

  /* ── fetch ───────────────────────────────────────────────────────────── */
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${BASEURL}/customers`, {
        params: { page: page + 1, limit: pageSize },
        withCredentials: true,
      });
      const data = res.data.customers || [];
      setCustomers(data);
      setSearchResults(data);
      setTotal(res.data.total || data.length);
    } catch (err) {
      if (err.response?.status === 401) { navigate('/login'); return; }
      setError(`Failed to fetch tenants: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, navigate]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  /* ── search ──────────────────────────────────────────────────────────── */
  const handleSearch = async () => {
    if (!searchQuery.trim() && !unitQuery.trim()) {
      setSearchResults(customers);
      return;
    }
    setIsSearching(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.name = searchQuery.trim();
      if (unitQuery.trim())   params.unitNumber = unitQuery.trim();
      const res = await axios.get(`${BASEURL}/search-customers`, {
        params,
        withCredentials: true,
      });
      const data = res.data.customers || [];
      setSearchResults(data);
      setTotal(res.data.total || data.length);
    } catch {
      showSnack('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  /* ── derived stats ───────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const active       = searchResults.filter((c) => c.status === 'ACTIVE').length;
    const totalBalance = searchResults.reduce((s, c) => s + (c.closingBalance || 0), 0);
    const withDebt     = searchResults.filter((c) => (c.closingBalance || 0) > 0).length;
    return { active, totalBalance, withDebt };
  }, [searchResults]);

  /* ── columns ─────────────────────────────────────────────────────────── */
  const columns = useMemo(() => [
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="View Tenant">
            <IconButton component={Link} to={`/customer-details/${p.row.id}`} size="small"
              sx={{ color: blue }} onClick={(e) => e.stopPropagation()}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Tenant">
            <IconButton component={Link} to={`/customer-edit/${p.row.id}`} size="small"
              sx={{ color: green }} onClick={(e) => e.stopPropagation()}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'name',
      headerName: 'Tenant',
      flex: 1.5,
      minWidth: 190,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: blue, width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700 }}>
            {getInitials(p.row.firstName, p.row.lastName)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} noWrap>
              {p.row.firstName} {p.row.lastName}
            </Typography>
            {p.row.email && (
              <Typography variant="caption" color="text.secondary" noWrap>{p.row.email}</Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      field: 'phoneNumber',
      headerName: 'Phone',
      width: 140,
      renderCell: (p) => <Typography variant="body2">{p.value || '—'}</Typography>,
    },
    {
      field: 'building',
      headerName: 'Building',
      width: 190,
      valueGetter: (_, row) => row.unit?.building?.name || '—',
      renderCell: (p) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HomeIcon fontSize="small" sx={{ color: theme?.palette?.grey?.[500], flexShrink: 0 }} />
          <Typography variant="body2" noWrap>{p.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'unitNumber',
      headerName: 'Unit',
      width: 90,
      valueGetter: (_, row) => row.unit?.unitNumber || '—',
      renderCell: (p) => <Typography variant="body2" fontWeight={600}>{p.value}</Typography>,
    },
    {
      field: 'unitType',
      headerName: 'Unit Type',
      width: 150,
      valueGetter: (_, row) => row.unit?.unitType?.replace(/_/g, ' ') || '—',
      renderCell: (p) => <Typography variant="body2" color="text.secondary">{p.value}</Typography>,
    },
    {
      field: 'monthlyCharge',
      headerName: 'Rent (Ksh)',
      width: 130,
      type: 'number',
      valueGetter: (_, row) => row.unit?.monthlyCharge ?? null,
      renderCell: (p) => (
        <Typography variant="body2" fontWeight={500}>
          {p.value != null ? Number(p.value).toLocaleString() : '—'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (p) => statusChip(p.value, isDark ? 'dark' : 'light'),
    },
    {
      field: 'closingBalance',
      headerName: 'Balance (Ksh)',
      width: 150,
      type: 'number',
      renderCell: (p) => {
        const v = p.value || 0;
        return (
          <Typography variant="body2" fontWeight={700} color={v > 0 ? 'error.main' : 'success.main'}>
            {Number(v).toLocaleString()}
          </Typography>
        );
      },
    },
    {
      field: 'leaseStartDate',
      headerName: 'Lease Start',
      width: 120,
      renderCell: (p) => <Typography variant="body2" color="text.secondary">{formatDate(p.value)}</Typography>,
    },
    {
      field: 'leaseEndDate',
      headerName: 'Lease End',
      width: 120,
      renderCell: (p) => <Typography variant="body2" color="text.secondary">{formatDate(p.value)}</Typography>,
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 120,
      renderCell: (p) => <Typography variant="body2" color="text.secondary">{formatDate(p.value)}</Typography>,
    },
  ], [blue, green, isDark, theme]);

  /* ── statement download ──────────────────────────────────────────────── */
  const handleDownloadStatement = async () => {
    if (!selectedRow || !startDate || !endDate) {
      showSnack('Select a tenant and both dates first', 'warning');
      return;
    }
    try {
      const res = await axios.post(
        `${BASEURL}/customer-statement`,
        { customerId: selectedRow.id, startDate, endDate },
        { responseType: 'blob', withCredentials: true },
      );
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `statement-${selectedRow.firstName}-${selectedRow.lastName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSnack('Statement downloaded', 'success');
    } catch (err) {
      // When responseType is blob, error response body is also a blob — parse it to read the message
      let message = 'Failed to download statement';
      try {
        if (err.response?.data instanceof Blob) {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          message = json.message || json.error || message;
        } else {
          message = err.response?.data?.message || err.response?.data?.error || message;
        }
      } catch { /* ignore parse errors */ }
      console.error('Statement download error:', err);
      showSnack(message);
    }
  };

  /* ═══════════════════ RENDER ═══════════════════════════════════════════ */
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
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <TitleComponent title="Tenants" />
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => navigate('/add-customer')}
          sx={{
            backgroundColor: green,
            color: '#fff',
            fontWeight: 600,
            borderRadius: 1.5,
            px: 2.5,
            '&:hover': { backgroundColor: theme?.palette?.greenAccent?.dark },
          }}
        >
          Add Tenant
        </Button>
      </Box>

      {/* ── Summary Cards ───────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <StatCard icon={<PeopleAltIcon />}            label="Total Tenants"   value={total}                                          color={blue} />
        <StatCard icon={<CheckCircleOutlineIcon />}   label="Active"          value={stats.active}                                   color={green} />
        <StatCard icon={<AccountBalanceWalletIcon />} label="Tenants in Debt" value={stats.withDebt}                                 color="#f57c00" />
        <StatCard icon={<AccountBalanceWalletIcon />} label="Total Balance"   value={`Ksh ${stats.totalBalance.toLocaleString()}`}   color="#7b1fa2" />
      </Box>

      {/* ── Search Bar ──────────────────────────────────────────────────── */}
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
          placeholder="Search by tenant name…"
          variant="outlined"
          size="small"
          sx={{ flex: 1, minWidth: 200 }}
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
        <TextField
          placeholder="Search by unit no…"
          variant="outlined"
          size="small"
          sx={{ flex: 1, minWidth: 160 }}
          value={unitQuery}
          onChange={(e) => setUnitQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <HomeIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={isSearching}
          sx={{
            backgroundColor: blue,
            color: '#fff',
            fontWeight: 600,
            minWidth: 110,
            '&:hover': { backgroundColor: theme?.palette?.blueAccent?.dark },
          }}
        >
          {isSearching ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Search'}
        </Button>
        {(searchQuery || unitQuery) && (
          <Tooltip title="Clear search">
            <IconButton
              size="small"
              onClick={() => {
                setSearchQuery('');
                setUnitQuery('');
                setSearchResults(customers);
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Paper>

      {/* ── Billing Panel ───────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: selectedRow ? green : 'divider',
          overflow: 'hidden',
          bgcolor: theme?.palette?.background?.paper,
          transition: 'border-color 0.2s',
        }}
      >
        <Box sx={{
          px: 2.5, py: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid', borderColor: 'divider',
          flexWrap: 'wrap', gap: 1,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWalletIcon sx={{ color: green }} />
            <Typography variant="subtitle1" fontWeight={700}>
              {selectedRow
                ? `Billing — ${selectedRow.firstName} ${selectedRow.lastName}`
                : 'Billing Actions'}
            </Typography>
            {selectedRow && (
              <Chip
                label={selectedRow.unit?.building?.name || 'No Unit'}
                size="small"
                sx={{ fontWeight: 600, bgcolor: `${green}18`, color: green }}
              />
            )}
          </Box>
          {selectedRow && (
            <Tooltip title="Deselect tenant">
              <IconButton size="small" onClick={() => setSelectedRow(null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {selectedRow ? (
          <Box sx={{ p: 2.5 }}>
            {/* Tenant mini-summary */}
            <Paper
              variant="outlined"
              sx={{ p: 2, mb: 2.5, borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}
            >
              <Avatar sx={{ bgcolor: blue, width: 40, height: 40, fontWeight: 700 }}>
                {getInitials(selectedRow.firstName, selectedRow.lastName)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight={700}>{selectedRow.firstName} {selectedRow.lastName}</Typography>
                <Typography variant="caption" color="text.secondary">{selectedRow.phoneNumber}</Typography>
              </Box>
              <Grid container spacing={2} sx={{ maxWidth: 520 }}>
                {[
                  { label: 'Building', value: selectedRow.unit?.building?.name || '—' },
                  { label: 'Unit',     value: selectedRow.unit?.unitNumber || '—' },
                  { label: 'Rent',     value: selectedRow.unit?.monthlyCharge ? `Ksh ${Number(selectedRow.unit.monthlyCharge).toLocaleString()}` : '—' },
                  { label: 'Balance',  value: `Ksh ${Number(selectedRow.closingBalance || 0).toLocaleString()}`,
                    color: (selectedRow.closingBalance || 0) > 0 ? 'error.main' : 'success.main' },
                ].map(({ label, value, color }) => (
                  <Grid item xs={6} sm={3} key={label}>
                    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                    <Typography variant="body2" fontWeight={600} color={color || 'text.primary'}>{value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            <Divider sx={{ mb: 2.5 }}>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>Statement Download</Typography>
            </Divider>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} flexWrap="wrap">
              <TextField
                label="From"
                type="date"
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 160 }}
              />
              <TextField
                label="To"
                type="date"
                size="small"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 160 }}
              />
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadStatement}
                disabled={!startDate || !endDate}
                sx={{ backgroundColor: blue, color: '#fff', fontWeight: 600, '&:hover': { backgroundColor: theme?.palette?.blueAccent?.dark } }}
              >
                Statement PDF
              </Button>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Tooltip title={!selectedRow.email ? 'No email on file' : 'Email statement'}>
                <span>
                  <Button variant="outlined" startIcon={<EmailIcon />} disabled={!selectedRow.email} sx={{ fontWeight: 600 }}>
                    Email
                  </Button>
                </span>
              </Tooltip>
              <Button variant="outlined" startIcon={<SmsIcon />} sx={{ fontWeight: 600 }}>
                SMS
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.5 }}>
            <AccountBalanceWalletIcon sx={{ fontSize: 18, color: 'action.disabled' }} />
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              Select a tenant from the table above to see billing actions.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* ── Tenants Table ───────────────────────────────────────────────── */}
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
        <Box sx={{
          px: 2.5, py: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleAltIcon sx={{ color: blue }} />
            <Typography variant="subtitle1" fontWeight={700}>All Tenants</Typography>
            <Chip label={total} size="small" sx={{ ml: 0.5, fontWeight: 700, bgcolor: `${blue}18`, color: blue }} />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Click a row to select for billing actions
          </Typography>
        </Box>

        <ErrorBoundary>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
              <Stack alignItems="center" spacing={1.5}>
                <CircularProgress size={32} />
                <Typography variant="body2" color="text.secondary">Loading tenants…</Typography>
              </Stack>
            </Box>
          ) : error ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
            </Box>
          ) : (
            <DataGrid
              rows={searchResults}
              columns={columns}
              getRowId={(row) => row.id}
              paginationMode="server"
              rowCount={total}
              page={page}
              pageSize={pageSize}
              rowsPerPageOptions={[10, 20, 50]}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => setPageSize(s)}
              onRowClick={(p) => setSelectedRow(p.row)}
              selectionModel={selectedRow ? [selectedRow.id] : []}
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
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: `${blue}0a` },
                  '&.Mui-selected': {
                    backgroundColor: `${green}14`,
                    '&:hover': { backgroundColor: `${blue}1e` },
                  },
                },
                '& .MuiDataGrid-cell': { borderColor: 'divider', alignItems: 'center' },
                '& .MuiDataGrid-footerContainer': { borderTop: '1px solid', borderColor: 'divider' },
              }}
            />
          )}
        </ErrorBoundary>
      </Paper>

      {/* ── Snackbar ─────────────────────────────────────────────────────── */}
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

export default CustomersScreen;
