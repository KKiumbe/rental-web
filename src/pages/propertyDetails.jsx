import React, { useEffect, useState, Component } from 'react';
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
} from '@mui/material';
import TitleComponent from '../components/title';
import { getTheme } from '../store/theme';
import VisibilityIcon from '@mui/icons-material/Visibility';
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

const BuildingDetailsScreen = () => {
  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const theme = getTheme();
  const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://taqa.co.ke/api';

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
      console.log('Fetched building:', JSON.stringify(response.data));
      setBuilding(response.data);
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

  useEffect(() => {
    if (id) {
      fetchBuilding();
    }
  }, [id]);

  // Sanitize building data
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
            status: unit.status || 'UNKNOWN',
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
        ? data.units
            .flatMap((unit) =>
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
    console.log('Sanitized building:', JSON.stringify(sanitized));
    return sanitized;
  };

  const unitColumns = [
    {
      field: 'actions',
      headerName: 'View',
      width: 80,
      renderCell: (params) => (
        <IconButton component={Link} to={`/unit-details/${params.row.id}`}>
          <VisibilityIcon />
        </IconButton>
      ),
    },
    { field: 'unitNumber', headerName: 'Unit Number', width: 120 },
    {
      field: 'monthlyCharge',
      headerName: 'Monthly Charge ($)',
      width: 150,
      type: 'number',
      valueFormatter: ({ value }) => `$${Number(value).toFixed(2)}`,
    },
    {
      field: 'depositAmount',
      headerName: 'Deposit Amount ($)',
      width: 150,
      type: 'number',
      valueFormatter: ({ value }) => `$${Number(value).toFixed(2)}`,
    },
    {
      field: 'garbageCharge',
      headerName: 'Garbage Charge ($)',
      width: 150,
      type: 'number',
      valueFormatter: ({ value }) => `$${Number(value).toFixed(2)}`,
    },
    {
      field: 'serviceCharge',
      headerName: 'Service Charge ($)',
      width: 150,
      type: 'number',
      valueFormatter: ({ value }) => `$${Number(value).toFixed(2)}`,
    },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'customerCount', headerName: 'Customers', width: 100, type: 'number' },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 150,
      type: 'dateTime',
      valueFormatter: ({ value }) =>
        new Date(value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
    },
  ];

  const customerColumns = [
    {
      field: 'actions',
      headerName: 'View',
      width: 80,
      renderCell: (params) => (
        <IconButton component={Link} to={`/customer-details/${params.row.id}`}>
          <VisibilityIcon />
        </IconButton>
      ),
    },
    { field: 'firstName', headerName: 'First Name', width: 120 },
    { field: 'lastName', headerName: 'Last Name', width: 120 },
    { field: 'unitNumber', headerName: 'Unit Number', width: 120 },
    { field: 'email', headerName: 'Email', width: 150 },
    { field: 'phoneNumber', headerName: 'Phone Number', width: 130 },
    { field: 'secondaryPhoneNumber', headerName: 'Secondary Phone', width: 130 },
    { field: 'nationalId', headerName: 'National ID', width: 130 },
    {
      field: 'closingBalance',
      headerName: 'Closing Balance ($)',
      width: 150,
      type: 'number',
      valueFormatter: ({ value }) => `$${Number(value).toFixed(2)}`,
    },
    { field: 'status', headerName: 'Status', width: 100 },
    
  ];

  const sanitizedBuilding = building ? sanitizeBuilding(building) : null;

  return (
    <Box sx={{ bgcolor: theme?.palette?.background?.paper, minHeight: '100vh', p: 3 }}>
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

            {/* Units DataGrid */}
            <Typography variant="h6" gutterBottom>
              Units ({sanitizedBuilding.units.length})
            </Typography>
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
                components={{
                  Toolbar: () => (
                    <GridToolbarContainer>
                      <GridToolbarExport />
                    </GridToolbarContainer>
                  ),
                }}
              />
            </Paper>

            {/* Customers DataGrid */}
            <Typography variant="h6" gutterBottom>
              Customers ({sanitizedBuilding.customerCount})
            </Typography>
            <Paper sx={{ width: '100%' }}>
              <DataGrid
                rows={sanitizedBuilding.customers}
                columns={customerColumns}
                getRowId={(row) => row.id}
                initialState={{
                  pagination: { paginationModel: { pageSize: 5 } },
                }}
                pageSizeOptions={[5, 10, 20]}
                disableRowSelectionOnClick
                autoHeight
                components={{
                  Toolbar: () => (
                    <GridToolbarContainer>
                      <GridToolbarExport />
                    </GridToolbarContainer>
                  ),
                }}
              />
            </Paper>
          </Box>
        </ErrorBoundary>
      )}
    </Box>
  );
};

export default BuildingDetailsScreen;