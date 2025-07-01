import React, { useState, useEffect } from 'react';
import {
  Tabs, Tab, Box, TextField, Button, Typography, Autocomplete,
  MenuItem, Select, InputLabel, FormControl, Container, CircularProgress,
  Snackbar, Alert,
} from '@mui/material';
import { getTheme } from '../store/theme';
import axios from 'axios';
import TitleComponent from '../components/title';
import { useAuthStore } from '../store/authStore';

function SmsScreen() {
  const { currentUser } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [landlordID, setLandlordID] = useState('');
  const [buildingID, setBuildingID] = useState('');
  const [landlords, setLandlords] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);

  const theme = getTheme();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // Fetch landlords and buildings
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const [landlordsRes, buildingsRes] = await Promise.all([
          axios.get(`${BASE_URL}/landlords`, { withCredentials: true }),
          axios.get(`${BASE_URL}/buildings`, { params: { limit: 100 }, withCredentials: true }),
        ]);
        setLandlords(landlordsRes.data.landlords || []);
        setBuildings(buildingsRes.data.buildings || []);
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to fetch landlords or buildings', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const resetFields = () => {
    setPhoneNumber('');
    setMessage('');
    setLandlordID('');
    setBuildingID('');
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    resetFields();
  };

  const handleSearchChange = (event, value) => {
    setSearchQuery(value);
    if (/^\d+$/.test(value) || value.length < 2) {
      setSearchResults([]);
      return;
    }
    fetchSearchResults();
  };

  const fetchSearchResults = async () => {
    setIsSearching(true);
    try {
      const { data } = await axios.get(`${BASE_URL}/search-customer-by-name`, {
        params: { name: searchQuery },
        withCredentials: true,
      });
      setSearchResults(data.customers || data);
    } catch (error) {
      console.error('Error fetching search results:', error);
      setSearchResults([]);
      setSnackbar({ open: true, message: 'Failed to fetch customers', severity: 'error' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSend = async (type) => {
    if (!message) {
      setSnackbar({ open: true, message: 'Please enter a message', severity: 'error' });
      return;
    }

    let url, body;
    if (type === 'single' || type === 'new') {
      if (!phoneNumber) {
        setSnackbar({ open: true, message: 'Please enter a phone number', severity: 'error' });
        return;
      }
      url = `${BASE_URL}/send-sms`;
      body = { mobile: phoneNumber, message };
    } else if (type === 'all') {
      url = `${BASE_URL}/send-to-all`;
      body = { message };
    } else if (type === 'group') {
      if (!landlordID && !buildingID) {
        setSnackbar({ open: true, message: 'Please select a landlord or building', severity: 'error' });
        return;
      }
      url = `${BASE_URL}/send-to-group`;
      body = { message };
      if (landlordID) body.landlordID = landlordID;
      if (buildingID) body.buildingID = buildingID;
    }

    setLoading(true);
    try {
      const response = await axios.post(url, body, {
        withCredentials: true,
      });
      setSnackbar({
        open: true,
        message: response.data.message || `${type.charAt(0).toUpperCase() + type.slice(1)} SMS sent successfully!`,
        severity: 'success',
      });
      resetFields();
    } catch (error) {
      console.error('Error sending SMS:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to send SMS. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      sx={{
        ml: { xs: 10, sm: 20 },
        width: '100%',
      }}
    >
      <Typography
        variant="h4"
        sx={{ color: theme.palette.primary.contrastText, mb: 2 }}
      >
        <TitleComponent title="SMS Center" />
      </Typography>

      <Box
        sx={{
          maxWidth: '100%',
          ml: { xs: 0, sm: 2 },
          mt: 4,
          p: 3,
          borderRadius: 2,
        }}
      >
      <Tabs
  value={tabValue}
  onChange={handleTabChange}
  variant="scrollable"
  scrollButtons="auto"
  aria-label="sms tabs"
  sx={{
    mb: 3,
    border: `1px solid ${theme.palette.primary.light}`,
    borderRadius: 2,
    '& .MuiTab-root': { color: theme.palette.primary.contrastText },
    '& .Mui-selected': { color: theme.palette.primary.contrastText },
  }}
>
  <Tab label="Single SMS" />
  <Tab label="New Customer SMS" />
  <Tab label="All Customers" />
  <Tab label="Group SMS" />
</Tabs>

        <Box>
          {tabValue === 0 && (
            <>
              <Autocomplete
                freeSolo
                options={searchResults}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.phoneNumber})`}
                onInputChange={handleSearchChange}
                onChange={(event, value) => setPhoneNumber(value ? value.phoneNumber : '')}
                loading={isSearching}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Customer by Name"
                    fullWidth
                    margin="normal"
                    sx={{ bgcolor: theme.palette.primary.light }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isSearching ? <CircularProgress color="primary" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
              <TextField
                label="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                fullWidth
                margin="normal"
               
              />
              <TextField
                label="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                fullWidth
                multiline
                rows={4}
                margin="normal"
              
              />
              <Button
                variant="contained"
                onClick={() => handleSend('single')}
                sx={{ mt: 2, bgcolor: theme.palette.greenAccent.main }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Send SMS'}
              </Button>
            </>
          )}
          {tabValue === 1 && (
            <>
              <TextField
                label="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                fullWidth
                margin="normal"
                required
              
              />
              <TextField
                label="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                fullWidth
                multiline
                rows={4}
                margin="normal"
                required
              
              />
              <Button
                variant="contained"
                onClick={() => handleSend('new')}
                sx={{ mt: 2, bgcolor: theme.palette.greenAccent.main }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Send SMS'}
              </Button>
            </>
          )}
          {tabValue === 2 && (
            <>
              <TextField
                label="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                fullWidth
                multiline
                rows={4}
                margin="normal"
                sx={{ bgcolor: theme.palette.primary.light }}
              />
              <Button
                variant="contained"
                onClick={() => handleSend('all')}
                sx={{ mt: 2, bgcolor: theme.palette.greenAccent.main }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Send to All'}
              </Button>
            </>
          )}
          {tabValue === 3 && (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel >
                  Select Landlord (Optional)
                </InputLabel>
                <Select
                  value={landlordID}
                  onChange={(e) => setLandlordID(e.target.value)}
                  label="Select Landlord (Optional)"
                  
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {landlords.map((landlord) => (
                    <MenuItem key={landlord.id} value={landlord.id}>
                      {landlord.name || `${landlord.firstName} ${landlord.lastName}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel >
                  Select Building (Optional)
                </InputLabel>
                <Select
                  value={buildingID}
                  onChange={(e) => setBuildingID(e.target.value)}
                  label="Select Building (Optional)"
                 
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {buildings.map((building) => (
                    <MenuItem key={building.id} value={building.id}>
                      {building.buildingName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                fullWidth
                multiline
                rows={4}
                margin="normal"
                
              />
              <Button
                variant="contained"
                onClick={() => handleSend('group')}
                sx={{ mt: 2, bgcolor: theme.palette.greenAccent.main }}
                disabled={loading || (!landlordID && !buildingID)}
              >
                {loading ? <CircularProgress size={24} /> : 'Send to Group'}
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default SmsScreen;