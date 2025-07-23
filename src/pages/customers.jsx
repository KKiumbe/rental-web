import React, { useEffect, useState, useCallback } from 'react';
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
} from '@mui/material';
import TitleComponent from '../components/title';
import { getTheme } from '../store/theme';
import { Link, useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import { useAuthStore } from '../store/authStore';

// Simple error boundary
const ErrorBoundary = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [children]);

  if (hasError) {
    return fallback;
  }

  try {
    return children;
  } catch (error) {
    setHasError(true);
    return fallback;
  }
};

const CustomersScreen = () => {
  const [customers, setCustomers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const theme = getTheme();

  const BASEURL = import.meta.env.VITE_BASE_URL || 'https://taqa.co.ke/api';

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Sanitize customer rows
  const sanitizeRows = useCallback(
    (rows) => {
      const sanitized = rows.map((customer, index) => ({
        ...customer,
        id: customer.id || `fallback-${index}`,
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phoneNumber: customer.phoneNumber || '',
        secondaryPhoneNumber: customer.secondaryPhoneNumber || '',
        nationalId: customer.nationalId || '',
        status: customer.status || 'Unknown',
        closingBalance: customer.closingBalance ?? 0,
        leaseFileUrl: customer.leaseFileUrl || '',
        leaseStartDate: customer.leaseStartDate
          ? new Date(customer.leaseStartDate).toLocaleDateString()
          : '',
        leaseEndDate: customer.leaseEndDate
          ? new Date(customer.leaseEndDate).toLocaleDateString()
          : '',
        unitId: customer.unitId || '',
        unitNumber: customer.unit?.unitNumber || 'None',
        monthlyCharge: customer.CustomerUnit?.unit.monthlyCharge ?? 0,
        depositAmount: customer.unit?.depositAmount ?? 0,
        buildingName: customer.unit?.building?.name || 'Unassigned',
        createdAt: customer.createdAt
          ? new Date(customer.createdAt).toLocaleDateString()
          : '',
        updatedAt: customer.updatedAt
          ? new Date(customer.updatedAt).toLocaleDateString()
          : '',
      }));
      console.log('Sanitized rows:', sanitized);
      return sanitized;
    },
    []
  );

  const fetchCustomers = useCallback(
    async (page, pageSize) => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${BASEURL}/customers`, {
          params: { page: page + 1, limit: pageSize },
          withCredentials: true,
        });
        const { customers, total } = response.data;
        if (!Array.isArray(customers)) {
          throw new Error('Invalid response: customers is not an array');
        }
        const sanitizedCustomers = sanitizeRows(customers);
        setCustomers(sanitizedCustomers);
        setTotalCustomers(total || sanitizedCustomers.length);
        setSearchResults(sanitizedCustomers);
      } catch (err) {
        console.error('Error fetching customers:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to fetch customers');
          setSnackbarMessage('Failed to fetch customers');
          setSnackbarOpen(true);
        }
      } finally {
        setLoading(false);
      }
    },
    [BASEURL, navigate, sanitizeRows]
  );

  useEffect(() => {
    fetchCustomers(page, pageSize);
  }, [page, pageSize, fetchCustomers]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(sanitizeRows(customers));
      setTotalCustomers(customers.length);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const isPhoneNumber = /^\+?\d+$/.test(searchQuery);
      const response = await axios.get(`${BASEURL}/search-customers`, {
        params: {
          phone: isPhoneNumber ? searchQuery : undefined,
          name: !isPhoneNumber ? searchQuery : undefined,
          page: page + 1,
          limit: pageSize,
        },
        withCredentials: true,
      });
      const { customers, total } = response.data;
      if (!Array.isArray(customers)) {
        throw new Error('Invalid response: customers is not an array');
      }
      const sanitizedResults = sanitizeRows(customers);
      setSearchResults(sanitizedResults);
      setTotalCustomers(total || sanitizedResults.length);
    } catch (error) {
      console.error('Error searching customers:', error);
      setSnackbarMessage('Error searching customers');
      setSnackbarOpen(true);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setSearchResults(sanitizeRows(customers));
    setTotalCustomers(customers.length);
    setPage(0);
    setSelectedTenantId(null);
    setStartDate('');
    setEndDate('');
  };

  const selectedTenant = customers.find((c) => c.id === selectedTenantId);
  const selectedTenantName = selectedTenant
    ? `${selectedTenant.firstName} ${selectedTenant.lastName} (${selectedTenant.unitNumber})`
    : 'No tenant selected';

  const handleDownloadStatement = async () => {
    if (!selectedTenantId) {
      setSnackbarMessage('Please select a tenant from the grid');
      setSnackbarOpen(true);
      return;
    }
    if (!startDate || !endDate) {
      setSnackbarMessage('Please select a date range');
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await axios.post(
        `${BASEURL}/customer-statement`,
        { customerId: selectedTenantId, startDate, endDate },
        {
          withCredentials: true,
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customer_statement_${selectedTenantId}_${startDate}_to_${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbarMessage('Statement downloaded successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error downloading statement:', error);
      setSnackbarMessage(`Failed to download statement: ${error.response?.data?.message || error.message}`);
      setSnackbarOpen(true);
    }
  };

  const handleEmailBill = async () => {
    if (!selectedTenantId) {
      setSnackbarMessage('Please select a tenant from the grid');
      setSnackbarOpen(true);
      return;
    }
    try {
      await axios.post(`${BASEURL}/bills/email/${selectedTenantId}`, {}, { withCredentials: true });
      setSnackbarMessage('Bill sent via email successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error sending email bill:', error);
      setSnackbarMessage(`Failed to send email bill: ${error.response?.data?.message || error.message}`);
      setSnackbarOpen(true);
    }
  };

  const handleSMSBill = async () => {
  

    try {
      console.log('Sending SMS bill for:', { customerId: selectedTenantId, startDate, endDate });
      const response = await axios.post(
        `${BASEURL}/send-bill`,
        { customerId: selectedTenantId},
        { withCredentials: true }
      );
      console.log('SMS bill response:', response.data);
      setSnackbarMessage('SMS bill sent successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error sending SMS bill:', error);
      setSnackbarMessage(`Failed to send SMS bill: ${error.response?.data?.message || error.message}`);
      setSnackbarOpen(true);
    }
  };

  const columns = [
    {
      field: 'actions',
      headerName: 'View',
      width: 100,
      renderCell: (params) => (
        <IconButton component={Link} to={`/customer-details/${params.row.id}`}>
          <VisibilityIcon />
        </IconButton>
      ),
    },
    {
      field: 'edit',
      headerName: 'Edit',
      width: 100,
      renderCell: (params) => (
        <IconButton component={Link} to={`/customer-edit/${params.row.id}`}>
          <EditIcon />
        </IconButton>
      ),
    },
    { field: 'firstName', headerName: 'First Name', width: 150 },
    { field: 'lastName', headerName: 'Last Name', width: 150 },
    { field: 'phoneNumber', headerName: 'Phone Number', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'nationalId', headerName: 'National ID', width: 150 },
    {
      field: 'closingBalance',
      headerName: 'Closing Balance',
      width: 120,
      type: 'number',
      //valueFormatter: ({ value }) => (value != null ? `Ksh ${Number(value).toFixed(2)}` : 'Ksh 0.00'),
    },
    {
      field: 'monthlyCharge',
      headerName: 'Monthly Rent',
      width: 120,
      type: 'number',
      //valueFormatter: ({ value }) => (value != null ? `Ksh ${Number(value).toFixed(2)}` : 'Ksh 0.00'),
    },
    {
      field: 'depositAmount',
      headerName: 'Deposit Amount',
      width: 120,
      type: 'number',
      //valueFormatter: ({ value }) => (value != null ? `Ksh ${Number(value).toFixed(2)}` : 'Ksh 0.00'),
    },
    { field: 'buildingName', headerName: 'Building', width: 150 },
    { field: 'unitNumber', headerName: 'Unit Number', width: 120 },
    { field: 'status', headerName: 'Status', width: 100 },
    { field: 'leaseStartDate', headerName: 'Lease Start', width: 120 },
    { field: 'leaseEndDate', headerName: 'Lease End', width: 120 },
  ];

  return (
    <ErrorBoundary
      fallback={
        <Box sx={{ ml: 10, mt: 5 }}>
          <Typography color="error">
            Error rendering tenants table. Please try again or contact support.
          </Typography>
        </Box>
      }
    >
      <Box sx={{ bgcolor: theme?.palette?.background?.paper, minHeight: '100vh' }}>
        <Typography
          component="div"
          variant="h5"
          gutterBottom
          sx={{ padding: 3, ml: 5 }}
        >
          <TitleComponent title="Tenants" />
        </Typography>

        {/* Search Bar */}
        <Box sx={{ display: 'flex', gap: 2, marginBottom: 2, ml: 10 }}>
          <TextField
            label="Search by Name or Phone"
            variant="outlined"
            size="small"
            sx={{
              width: '400px',
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: theme?.palette?.grey[300] },
                '&:hover fieldset': {
                  borderColor: theme?.palette?.greenAccent?.main,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme?.palette?.greenAccent?.main,
                },
              },
              '& .MuiInputLabel-root': { color: theme?.palette?.grey[100] },
              '& .MuiInputBase-input': { color: theme?.palette?.grey[100] },
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearch}
            disabled={isSearching}
            sx={{ width: '150px' }}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleResetSearch}
            sx={{ width: '150px' }}
          >
            Reset
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
        </Box>

        {/* Tenant Action Panel */}
        <Box sx={{ display: 'flex', gap: 2, marginBottom: 2, ml: 10, alignItems: 'center' }}>
          <Typography variant="body1" sx={{ width: '250px', color: theme?.palette?.grey[100] }}>
            {selectedTenantName}
          </Typography>
          <TextField
            label="Start Date"
            type="date"
            variant="outlined"
            size="small"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              width: '150px',
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: theme?.palette?.grey[300] },
                '&:hover fieldset': {
                  borderColor: theme?.palette?.greenAccent?.main,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme?.palette?.greenAccent?.main,
                },
              },
            }}
            disabled={!selectedTenantId}
          />
          <TextField
            label="End Date"
            type="date"
            variant="outlined"
            size="small"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              width: '150px',
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: theme?.palette?.grey[300] },
                '&:hover fieldset': {
                  borderColor: theme?.palette?.greenAccent?.main,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme?.palette?.greenAccent?.main,
                },
              },
            }}
            disabled={!selectedTenantId}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleDownloadStatement}
            sx={{ width: '150px' }}
            disabled={!selectedTenantId || !startDate || !endDate}
          >
            Download Statement
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleEmailBill}
            sx={{ width: '150px' }}
            disabled={!selectedTenantId}
          >
            Email Bill
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSMSBill}
            sx={{ width: '150px' }}
            disabled={!selectedTenantId}
          >
            SMS Bill
          </Button>
        </Box>

        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '80vh',
              ml: 20,
            }}
          >
            <CircularProgress size={30} />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ ml: 10 }}>
            {error}
          </Typography>
        ) : (
          <Paper sx={{ width: '90%', overflow: 'auto', height: 500, ml: 10 }}>
            <DataGrid
              rows={searchResults}
              columns={columns}
              getRowId={(row) => row.id}
              page={page}
              pageSize={pageSize}
              rowCount={totalCustomers}
              paginationMode="server"
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newPageSize) => {
                setPageSize(newPageSize);
                setPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50]}
              checkboxSelection
              disableMultipleSelection
              selectionModel={selectedTenantId ? [selectedTenantId] : []}
              onRowSelectionModelChange={(newSelection) => {
                console.log('Selected tenant ID:', newSelection);
                const newTenantId = newSelection.length > 0 ? newSelection[0] : null;
                if (newTenantId !== selectedTenantId) {
                  setSelectedTenantId(newTenantId);
                  setStartDate('');
                  setEndDate('');
                }
              }}
              sx={{ minWidth: 900, maxWidth: 1400 }}
              components={{
                Toolbar: () => (
                  <GridToolbarContainer>
                    <GridToolbarExport />
                  </GridToolbarContainer>
                ),
              }}
            />
          </Paper>
        )}

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </Box>
    </ErrorBoundary>
  );
};

export default CustomersScreen;