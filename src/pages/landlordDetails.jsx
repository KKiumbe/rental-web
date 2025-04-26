import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Snackbar,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TitleComponent from '../components/title';
import { getTheme } from '../store/theme';
import { useAuthStore } from '../store/authStore';

export default function LandlordDetailsScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const theme = getTheme();
  const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://taqa.co.ke/api';

  const [landlord, setLandlord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const fetchLandlord = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/landlord/${id}`, {
        withCredentials: true,
      });
      console.log('Fetched landlord details:', response.data);
      setLandlord(response.data.landlord);
    } catch (error) {
      console.error('Error fetching landlord details:', error);
      if (error.response?.status === 404) {
        setSnackbarMessage('Landlord not found.');
      } else if (error.response?.status === 401) {
        setSnackbarMessage('Unauthorized. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setSnackbarMessage(error.response?.data?.message || 'Failed to load landlord details.');
      }
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchLandlord();
    }
  }, [currentUser, id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  const handleBack = () => {
    navigate('/landlords');
  };

  const handleViewBuilding = (buildingId) => {
    navigate(`/building-details/${buildingId}`);
  };

  return (
    <Box sx={{  minHeight: '100vh', p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ ml: 5 }}>
        <TitleComponent title="Landlord Details" />
      </Typography>

      <Paper sx={{ width: '80%', maxWidth: 900, p: 4, mx: 'auto', mt: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Landlord Details</Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ color: theme?.palette?.greenAccent?.main, borderColor: theme?.palette?.greenAccent?.main }}
          >
            Back to Landlords
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : !landlord ? (
          <Typography color="textSecondary" sx={{ p: 2 }}>
            Landlord not found.
          </Typography>
        ) : (
          <>
            {/* Landlord Details */}
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Landlord Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  First Name
                </Typography>
                <Typography variant="body1">{landlord.firstName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Last Name
                </Typography>
                <Typography variant="body1">{landlord.lastName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Email
                </Typography>
                <Typography variant="body1">{landlord.email || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Phone Number
                </Typography>
                <Typography variant="body1">{landlord.phoneNumber}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                <Typography variant="body1">{landlord.status}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Created At
                </Typography>
                <Typography variant="body1">{formatDate(landlord.createdAt)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Updated At
                </Typography>
                <Typography variant="body1">{formatDate(landlord.updatedAt)}</Typography>
              </Grid>
            </Grid>

            {/* Buildings Information */}
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Buildings
            </Typography>
            {landlord.buildings && landlord.buildings.length > 0 ? (
              landlord.buildings.map((building) => (
                <Box key={building.id} sx={{ mb: 2, p: 2, borderRadius: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Building ID
                      </Typography>
                      <Typography variant="body1">{building.id}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Building Name
                      </Typography>
                      <Typography variant="body1">{building.name || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleViewBuilding(building.id)}
                        sx={{ backgroundColor: theme?.palette?.greenAccent?.main, color: '#fff' }}
                      >
                        View Details
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ))
            ) : (
              <Typography color="textSecondary">No buildings associated with this landlord.</Typography>
            )}
          </>
        )}
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}