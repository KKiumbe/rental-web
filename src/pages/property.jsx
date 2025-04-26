import React, { useEffect, useState, Component } from 'react';
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
import AddIcon from '@mui/icons-material/Add'; // Import AddIcon for the button
import TitleComponent from '../components/title';
import { getTheme } from '../store/theme';
import { Link, useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
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
          Error rendering table: {this.state.error?.message || 'Unknown error'}
        </Typography>
      );
    }
    return this.props.children;
  }
}

const BuildingsScreen = () => {
  const [buildings, setBuildings] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Pagination State
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalBuildings, setTotalBuildings] = useState(0);

  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const theme = getTheme();

  const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://taqa.co.ke/api';

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Sanitize building rows
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
            gasRate: Number(building.gasRate ?? 0),
            waterRate: Number(building.waterRate ?? 0),
            createdAt: building.createdAt ? new Date(building.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: building.updatedAt ? new Date(building.updatedAt).toISOString() : new Date().toISOString(),
            landlord: building.landlord.name,
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
      console.log('Fetched buildings:', JSON.stringify(response.data));
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
      }
    } finally {
      setLoading(false);
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
      console.log('Fetched search results:', JSON.stringify(response.data));
      const searchData = Array.isArray(response.data.buildings)
        ? response.data.buildings
        : [];
      setSearchResults(sanitizeRows(searchData));
      setTotalBuildings(Number(response.data.total) || searchData.length);
    } catch (error) {
      console.error('Error searching buildings:', error);
      setSnackbarMessage('Error searching buildings.');
      setSnackbarOpen(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddProperty = () => {
    navigate('/add-property');
  };

  const columns = [
    {
      field: 'actions',
      headerName: 'View',
      width: 100,
      renderCell: (params) => (
        <IconButton
          component={Link}
          to={`/building-details/${params.row.id}`}
        >
          <VisibilityIcon />
        </IconButton>
      ),
    },
    {
      field: 'edit',
      headerName: 'Edit',
      width: 100,
      renderCell: (params) => (
        <IconButton
          component={Link}
          to={`/edit-building/${params.row.id}`}
        >
          <EditIcon />
        </IconButton>
      ),
    },
    { field: 'name', headerName: 'Building Name', width: 200 },
    { field: 'address', headerName: 'Address', width: 250 },
    {
      field: 'unitCount',
      headerName: 'Total Units',
      width: 120,
      type: 'number',
    },
    {
      field: 'occupiedUnits',
      headerName: 'Occupied Units',
      width: 150,
      type: 'number',
    },
    {
      field: 'gasRate',
      headerName: 'Gas Rate ($)',
      width: 120,
      type: 'number',
    },
    {
      field: 'waterRate',
      headerName: 'Water Rate ($)',
      width: 120,
      type: 'number',
    },
    {
      field: 'landlord',
      headerName: 'Landlord',
      width: 150,
    },
    {
      field: "createdAt",
      headerName: "Date",
      width: 200,
      renderCell: (params) => {
        const value = params?.value;
    
        if (!value) return "N/A";
    
        try {
          const date = new Date(value);
          date.setHours(date.getHours() - 1); // Optional: adjust for timezone
    
          const day = String(date.getDate()).padStart(2, '0');
          const month = date.toLocaleString('default', { month: 'short' });
          const year = date.getFullYear();
    
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
    
          return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
        } catch (error) {
          console.error("Invalid Date:", value);
          return "Invalid Date";
        }
      },
    }
  ];

  return (
    <Box sx={{ bgcolor: theme?.palette?.background?.paper, minHeight: '100vh' }}>
      <Typography
        component="div"
        variant="h5"
        gutterBottom
        sx={{ padding: 3, ml: 5 }}
      >
        <TitleComponent title="Buildings" />
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, marginBottom: 2, ml: 10, alignItems: 'center' }}>
        <TextField
          label="Search by Building or Landlord Name"
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
          }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSearch}
          disabled={isSearching}
          sx={{
            width: '200px',
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
          startIcon={<AddIcon />}
          onClick={handleAddProperty}
          sx={{
            backgroundColor: theme?.palette?.greenAccent?.main,
            color: '#fff',
            '&:hover': {
              backgroundColor: theme?.palette?.greenAccent?.dark,
            },
          }}
        >
          Add Property
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
        <Typography color="error">{error}</Typography>
      ) : (
        <Paper sx={{ width: '90%', overflow: 'auto', height: 500 }}>
          <ErrorBoundary>
            <DataGrid
              rows={searchResults}
              columns={columns}
              getRowId={(row) => row.id}
              pageSize={pageSize}
              rowCount={totalBuildings}
              paginationMode="server"
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
              rowsPerPageOptions={[10, 20, 50]}
              checkboxSelection
              disableSelectionOnClick
              sx={{ minWidth: 900, marginLeft: 'auto', ml: 10, maxWidth: 1400 }}
              components={{
                Toolbar: () => (
                  <GridToolbarContainer>
                    <GridToolbarExport />
                  </GridToolbarContainer>
                ),
              }}
            />
          </ErrorBoundary>
        </Paper>
      )}

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