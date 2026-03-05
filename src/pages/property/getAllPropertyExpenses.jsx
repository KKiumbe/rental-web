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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import TitleComponent from '../../components/title';
import { getTheme } from '../../store/theme';
import { useNavigate } from 'react-router-dom';
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

// Sanitize Expense Data
const sanitizeExpense = (data) => {
  if (!data || typeof data !== 'object') {
    console.warn('Invalid expense data:', data);
    return null;
  }
  return {
    id: data.id || '',
    description: data.description || 'N/A',
    amount: Number(data.amount ?? 0),
    date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    buildingId: data.buildingId || '',
    buildingName: data.building?.name || 'Unknown',
    status: data.status || 'PENDING',
    expenseType: data.expenseType || 'N/A',
    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : new Date().toISOString(),
  };
};

// Sanitize Rows for DataGrid
const sanitizeRows = (rows) =>
  Array.isArray(rows)
    ? rows
        .filter((expense) => expense && typeof expense === 'object' && expense.id)
        .map(sanitizeExpense)
        .filter(Boolean)
    : [];

const ExpensesScreen = () => {
  const [expenses, setExpenses] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [buildingId, setBuildingId] = useState('');
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [viewExpenseOpen, setViewExpenseOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [formData, setFormData] = useState({
    buildingId: '',
    expenseType: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // Default to today
  });
  const [formErrors, setFormErrors] = useState({});

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const theme = getTheme();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Fetch buildings for the filter and add expense dropdown
  const fetchBuildings = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/buildings`, {
        params: { page: 1, limit: 100 },
        withCredentials: true,
      });
      const responseData = response.data;
      const data = responseData.buildings ?? responseData.data ?? [];
      setBuildings(
        Array.isArray(data)
          ? data.map((b) => ({ id: b.id, name: b.name || 'Unnamed' }))
          : []
      );
    } catch (err) {
      console.error('Fetch buildings error:', err);
      setSnackbarMessage('Failed to fetch buildings');
      setSnackbarOpen(true);
    }
  };

  // Fetch expenses
  const fetchExpenses = async (pageNum, limitNum, buildingFilter = '') => {
    try {
      setLoading(true);
      const params = { page: pageNum + 1, limit: limitNum };
      if (buildingFilter) params.buildingId = buildingFilter;
      const response = await axios.get(`${BASE_URL}/building-expenses`, {
        params,
        withCredentials: true,
      });
      console.log('Expenses response:', response.data);
      const responseData = response.data;
      // Support multiple response shapes
      const data = responseData.expenses ?? responseData.data ?? responseData ?? [];
      const pagination = responseData.pagination ?? responseData.meta ?? {};
      const sanitizedExpenses = sanitizeRows(Array.isArray(data) ? data : []);
      setExpenses(sanitizedExpenses);
      setSearchResults(sanitizedExpenses);
      setTotalExpenses(Number(pagination.total) || sanitizedExpenses.length);
      setPageSize(Number(pagination.limit) || 10);
    } catch (err) {
      console.error('Fetch expenses error:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError(`Failed to fetch expenses: ${err.response?.data?.message || err.message}`);
        setSnackbarMessage(`Failed to fetch expenses: ${err.response?.data?.message || err.message}`);
        setSnackbarOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Approve expense
  const handleApproveExpense = async (expenseId) => {
    try {
      setLoading(true);
      await axios.put(
        `${BASE_URL}/expenses/${expenseId}/approve`,
        {},
        { withCredentials: true }
      );
      setSnackbarMessage('Expense approved successfully');
      setSnackbarOpen(true);
      await fetchExpenses(page, pageSize, buildingId);
      setViewExpenseOpen(false);
      setSelectedExpense(null);
    } catch (err) {
      console.error('Approve expense error:', err);
      setSnackbarMessage(err.response?.data?.error || 'Failed to approve expense');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Create expense
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.buildingId) errors.buildingId = 'Building is required';
    if (!formData.expenseType) errors.expenseType = 'Expense type is required';
    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0)
      errors.amount = 'Valid amount is required';
    if (!formData.description) errors.description = 'Description is required';
    if (!formData.date) errors.date = 'Date is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${BASE_URL}/building-expenses`,
        {
          buildingId: formData.buildingId,
          expenseType: formData.expenseType,
          amount: Number(formData.amount),
          description: formData.description,
          date: formData.date,
        },
        { withCredentials: true }
      );
      setSnackbarMessage('Expense created successfully');
      setSnackbarOpen(true);
      setAddExpenseOpen(false);
      setFormData({
        buildingId: '',
        expenseType: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setFormErrors({});
      await fetchExpenses(page, pageSize, buildingId);
    } catch (err) {
      console.error('Create expense error:', err);
      setSnackbarMessage(err.response?.data?.error || 'Failed to create expense');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
    fetchExpenses(page, pageSize, buildingId);
  }, [page, pageSize, buildingId]);

  const handleViewExpense = (expense) => {
    setSelectedExpense(expense);
    setViewExpenseOpen(true);
  };

  const handleCloseViewExpense = () => {
    setViewExpenseOpen(false);
    setSelectedExpense(null);
  };

  const handleOpenAddExpense = () => {
    setAddExpenseOpen(true);
  };

  const handleCloseAddExpense = () => {
    setAddExpenseOpen(false);
    setFormData({
      buildingId: '',
      expenseType: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setFormErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleBuildingFilterChange = (event) => {
    setBuildingId(event.target.value);
    setPage(0);
  };

  const expenseColumns = [
    {
      field: 'actions',
      headerName: 'View',
      width: 80,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleViewExpense(params.row)}
          sx={{
            color: params.row.status === 'APPROVED' ? theme?.palette?.greenAccent?.main : theme?.palette?.secondary?.main,
            borderColor: params.row.status === 'APPROVED' ? theme?.palette?.grey[500] : theme?.palette?.greenAccent?.main,
            '&:hover': {
              borderColor: params.row.status === 'APPROVED' ? theme?.palette?.grey[500] : theme?.palette?.greenAccent?.main,
            },
          }}
        >
          <VisibilityIcon />
        </Button>
      ),
    },
    { field: 'description', headerName: 'Description', width: 250 },
    { field: 'amount', headerName: 'Amount (Ksh)', width: 150, type: 'number' },
    { field: 'buildingName', headerName: 'Building', width: 200 },
    { field: 'expenseType', headerName: 'Expense Type', width: 150 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          sx={{
                
             backgroundColor: params.value === 'PENDING' ? theme?.palette?.secondary?.main : theme?.palette?.greenAccent?.main,
            //color: params.value === 'PENDING' ? theme?.palette?.text?.primary : theme?.palette?.greenAccent?.main,
            border: params.value === 'PENDING' ? `2px solid ${theme?.palette?.secondary?.main}` : `2px solid ${theme?.palette?.greenAccent?.main}`,
          }}
        />
      ),
    },  
    {
      field: 'date',
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
          return 'Invalid Date';
        }
      },
    },
  ];

  // Updated expense types to match the provided options
  const expenseTypes = ['REPAIR', 'MAINTENANCE', 'RENOVATION', 'UTILITY', 'OTHER'];

  return (
    <Box
      sx={{
        width: '100%',
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
        <TitleComponent title="Expenses" />
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <FormControl sx={{ width: '300px' }}>
          <InputLabel>Filter by Building</InputLabel>
          <Select
            value={buildingId}
            onChange={handleBuildingFilterChange}
            label="Filter by Building"
          >
            <MenuItem value="">All Buildings</MenuItem>
            {buildings.map((building) => (
              <MenuItem key={building.id} value={building.id}>
                {building.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
          startIcon={<AddIcon />}
          onClick={handleOpenAddExpense}
          sx={{
            backgroundColor: theme?.palette?.greenAccent?.main,
            color: '#fff',
            '&:hover': { backgroundColor: theme?.palette?.greenAccent?.dark },
          }}
        >
          Add Expense
        </Button>
      </Box>

      {/* Expenses Panel */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>Expenses</Typography>
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
                columns={expenseColumns}
                getRowId={(row) => row.id}
                paginationMode="server"
                rowCount={totalExpenses}
                page={page}
                pageSize={pageSize}
                rowsPerPageOptions={[5, 10, 20]}
                onPageChange={(newPage) => setPage(newPage)}
                onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
                sx={{
                  minWidth: 1200,
                  '& .MuiDataGrid-row': {
                    backgroundColor: (theme) => (row) =>
                      row.status === 'APPROVED' ? theme?.palette?.grey[200] : 'inherit',
                  },
                }}
                components={{
                  Toolbar: () => (
                    <GridToolbarContainer>
                      <GridToolbarExport />
                    </GridToolbarContainer>
                  ),
                }}
              />
            )}
          </ErrorBoundary>
        </Paper>
      </Box>

      {/* View Expense Dialog */}
      <Dialog open={viewExpenseOpen} onClose={handleCloseViewExpense} maxWidth="sm" fullWidth>
        <DialogTitle>Expense Details</DialogTitle>
        <DialogContent>
          {selectedExpense ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <Typography><strong>Description:</strong> {selectedExpense.description}</Typography>
              <Typography><strong>Amount:</strong> Ksh {selectedExpense.amount}</Typography>
              <Typography><strong>Building:</strong> {selectedExpense.buildingName}</Typography>
              <Typography><strong>Expense Type:</strong> {selectedExpense.expenseType}</Typography>
              <Typography>
                <strong>Status:</strong>{' '}
                <Chip
                  label={selectedExpense.status}
                  sx={{
                    //backgroundColor: selectedExpense.status === 'PENDING' ? '#fff' : theme?.palette?.grey[500],
                    color: selectedExpense.status === 'PENDING' ? theme?.palette?.text?.primary : '#fff',
                    border: selectedExpense.status === 'PENDING' ? `1px solid ${theme?.palette?.grey[300]}` : 'none',
                  }}
                />
              </Typography>
              <Typography><strong>Date:</strong> {new Date(selectedExpense.date).toLocaleString()}</Typography>
              <Typography><strong>Created At:</strong> {new Date(selectedExpense.createdAt).toLocaleString()}</Typography>
              <Typography><strong>Updated At:</strong> {new Date(selectedExpense.updatedAt).toLocaleString()}</Typography>
            </Box>
          ) : (
            <Typography>Loading expense details...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          {selectedExpense?.status === 'PENDING' && (
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={() => handleApproveExpense(selectedExpense.id)}
              disabled={loading}
              sx={{
                backgroundColor: theme?.palette?.greenAccent?.main,
                color: '#fff',
                '&:hover': { backgroundColor: theme?.palette?.greenAccent?.dark },
              }}
            >
              {loading ? 'Approving...' : 'Approve'}
            </Button>
          )}
          <Button onClick={handleCloseViewExpense} disabled={loading}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={addExpenseOpen} onClose={handleCloseAddExpense} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Expense</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth error={!!formErrors.buildingId}>
              <InputLabel>Building</InputLabel>
              <Select
                name="buildingId"
                value={formData.buildingId}
                onChange={handleFormChange}
                label="Building"
                required
              >
                <MenuItem value="">Select Building</MenuItem>
                {buildings.map((building) => (
                  <MenuItem key={building.id} value={building.id}>
                    {building.name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.buildingId && (
                <Typography color="error" variant="caption">{formErrors.buildingId}</Typography>
              )}
            </FormControl>
            <FormControl fullWidth error={!!formErrors.expenseType}>
              <InputLabel>Expense Type</InputLabel>
              <Select
                name="expenseType"
                value={formData.expenseType}
                onChange={handleFormChange}
                label="Expense Type"
                variant="outlined"
                required
              >
                <MenuItem value="">Select Expense Type</MenuItem>
                <MenuItem value="REPAIR">REPAIR</MenuItem>
                <MenuItem value="MAINTENANCE">MAINTENANCE</MenuItem>
                <MenuItem value="RENOVATION">RENOVATION</MenuItem>
                <MenuItem value="UTILITY">UTILITY</MenuItem>
                <MenuItem value="OTHER">OTHER</MenuItem>
              </Select>
              {formErrors.expenseType && (
                <Typography color="error" variant="caption">{formErrors.expenseType}</Typography>
              )}
            </FormControl>
            <TextField
              label="Amount (Ksh)"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleFormChange}
              fullWidth
              required
              error={!!formErrors.amount}
              helperText={formErrors.amount}
            />
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              fullWidth
              required
              multiline
              rows={3}
              error={!!formErrors.description}
              helperText={formErrors.description}
            />
            <TextField
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleFormChange}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              error={!!formErrors.date}
              helperText={formErrors.date}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={handleCreateExpense}
            disabled={loading}
            sx={{
              backgroundColor: theme?.palette?.greenAccent?.main,
              color: '#fff',
              '&:hover': { backgroundColor: theme?.palette?.greenAccent?.dark },
            }}
          >
            {loading ? 'Creating...' : 'Create'}
          </Button>
          <Button onClick={handleCloseAddExpense} disabled={loading}>
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

export default ExpensesScreen;