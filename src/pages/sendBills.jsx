import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Button,
  TextField,
  Container,
  Paper,
  Autocomplete,
  CircularProgress,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { getTheme } from '../store/theme';
import TitleComponent from '../components/title';
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";

function SendBillsScreen() {
  const [tabValue, setTabValue] = useState(0);
  const [message, setMessage] = useState('');
  // States for customer search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isPhoneSearch, setIsPhoneSearch] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  // State for period in Send Bills to All
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  // States for send bills per landlord or building
  const [landlords, setLandlords] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [selectedLandlord, setSelectedLandlord] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [landlordsLoading, setLandlordsLoading] = useState(false);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [groupPeriod, setGroupPeriod] = useState(null);
  const theme = getTheme();

  // Fetch landlords
  const fetchLandlords = async () => {
    try {
      setLandlordsLoading(true);
      const response = await axios.get(`${BASEURL}/landlords`, {
        withCredentials: true,
      });
      setLandlords(response.data.landlords || []);
    } catch (error) {
      console.error('Error fetching landlords:', error);
      setSnackbarMessage('Failed to load landlords');
      setSnackbarOpen(true);
    } finally {
      setLandlordsLoading(false);
    }
  };

  // Fetch buildings
  const fetchBuildings = async () => {
    try {
      setBuildingsLoading(true);
      const response = await axios.get(`${BASEURL}/buildings`, {
        params: { minimal: true },
        withCredentials: true,
      });
      setBuildings(response.data.buildings || []);
    } catch (error) {
      console.error('Error fetching buildings:', error);
      setSnackbarMessage('Failed to load buildings');
      setSnackbarOpen(true);
    } finally {
      setBuildingsLoading(false);
    }
  };

  // Fetch landlords and buildings on component mount
  useEffect(() => {
    fetchLandlords();
    fetchBuildings();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setMessage('');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedCustomer(null);
    setPhoneNumber('');
    setSearchPerformed(false);
    setIsPhoneSearch(false);
    setSelectedLandlord(null);
    setSelectedBuilding(null);
    setSelectedPeriod(null);
    setGroupPeriod(null);
  };

  // Format the selected period to YYYY-MM
  const formatPeriod = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  // 1. Send Bills to All
  const handleSendBillsToAll = async () => {
    if (!selectedPeriod) {
      setSnackbarMessage("Please select a billing period");
      setSnackbarOpen(true);
      return;
    }

    const period = formatPeriod(selectedPeriod);
    try {
      const response = await axios.post(
        `${BASEURL}/send-bills`,
        { period },
        { withCredentials: true }
      );
      setMessage(response.data.message);
      setSelectedPeriod(null);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error sending bills');
    }
  };

  // 2. Search Customers (by name or phone)
  const handleNameSearch = async (value) => {
    if (/^\d+$/.test(value)) {
      setIsPhoneSearch(true);
      setSearchResults([]);
      setSearchQuery(value);
      setSearchPerformed(false);
      return;
    }

    setIsSearching(true);
    if (!value.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      const response = await axios.get(`${BASEURL}/search-customer-by-name`, {
        params: { name: value },
        withCredentials: true,
      });
      console.log(`Name search response: ${JSON.stringify(response.data)}`);
      setSearchResults(Array.isArray(response.data) ? response.data : []);
      setSearchPerformed(true);
    } catch (error) {
      console.error("Error searching customers:", error.response);
      setSnackbarMessage(error.response?.data?.message || "Error searching customers.");
      setSearchResults([]);
      setSnackbarOpen(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchByPhone = async () => {
    setIsSearching(true);
    setSearchPerformed(true);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (searchQuery.length < 10) {
      setSnackbarMessage("Please enter at least 10 digits for phone search");
      setSnackbarOpen(true);
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      const response = await axios.get(`${BASEURL}/search-customer-by-phone`, {
        params: { phone: searchQuery },
        withCredentials: true,
      });
      console.log(`Phone search response: ${JSON.stringify(response.data)}`);
      const customer = response.data;
      setSearchResults(customer ? [customer] : []);
    } catch (error) {
      console.error("Error searching customers:", error.response);
      setSnackbarMessage(error.response?.data?.message || "No customer found");
      setSearchResults([]);
      setSnackbarOpen(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setPhoneNumber(customer.phoneNumber || customer.phone || '');
    setSearchResults([]);
    setSearchPerformed(false);
    setIsPhoneSearch(false);
  };

  // Send Bill to Selected Customer (only customerId in request body)
  const handleSendBillToCustomer = async () => {
    if (!selectedCustomer) {
      setMessage('Please select a customer');
      return;
    }
    try {
      const response = await axios.post(
        `${BASEURL}/send-bill`,
        { customerId: selectedCustomer.customerId },
        { withCredentials: true }
      );
      setMessage(response.data.message);
      setSelectedCustomer(null);
      setPhoneNumber('');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error sending bill');
    }
  };

  // 3. Send Bills to Group (Per Landlord or Building)
  const handleSendBillsToGroup = async () => {
    if (!groupPeriod) {
      setMessage('Please select a billing period');
      return;
    }
    if (!selectedLandlord && !selectedBuilding) {
      setMessage('Please select a landlord or building');
      return;
    }

    const period = formatPeriod(groupPeriod);
    const payload = { period };
    if (selectedLandlord) {
      payload.landlordID = selectedLandlord.id;
    } else if (selectedBuilding) {
      payload.buildingID = selectedBuilding.id;
    }

    try {
      const response = await axios.post(
        `${BASEURL}/send-bill-per-landlord-or-building`,
        payload,
        { withCredentials: true }
      );
      setMessage(response.data.message);
      setSelectedLandlord(null);
      setSelectedBuilding(null);
      setGroupPeriod(null);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error sending bills');
    }
  };

  return (
    <Container maxWidth="md" sx={{ width: '100%', padding: 3, ml: 20 }}>
      <Typography
        sx={{ width: '100%', textAlign: 'center', mb: 2, color: theme.palette.primary.contrastText }}
      >
        <TitleComponent title="Bills Center" />
      </Typography>
      <Paper elevation={3}>
        <Box>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            centered
            sx={{
              mb: 3,
              border: `1px solid ${theme.palette.primary.light}`,
              borderRadius: 2,
              '& .MuiTab-root': { color: theme.palette.primary.contrastText },
              '& .Mui-selected': { color: theme.palette.greenAccent },
              '& .MuiTabs-indicator': { backgroundColor: theme.palette.greenAccent.main },
            }}
          >
            <Tab label="Send Bills to All" />
            <Tab label="Send Bill to One Customer" />
            <Tab label="Send Bills to Group" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Tab 0: Send Bills to All */}
          {tabValue === 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Send Bills to All Customers
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  views={["year", "month"]}
                  label="Select Billing Period (Year-Month)"
                  value={selectedPeriod}
                  onChange={(newValue) => setSelectedPeriod(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      margin="normal"
                      helperText="Format: YYYY-MM (e.g., 2025-04)"
                    />
                  )}
                  maxDate={new Date()}
                />
              </LocalizationProvider>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendBillsToAll}
                sx={{ mt: 2, bgcolor: theme.palette.greenAccent.main }}
              >
                Send Now
              </Button>
            </>
          )}

          {/* Tab 1: Send Bill to One Customer */}
          {tabValue === 1 && (
            <>
              <Typography variant="h6" gutterBottom>
                Send Bill to One Customer
              </Typography>
              {!selectedCustomer ? (
                <Box>
                  <Autocomplete
                    freeSolo
                    options={searchResults}
                    getOptionLabel={(option) => `${option.name} (${option.phoneNumber || option.phone})`}
                    loading={isSearching}
                    onInputChange={(e, value) => {
                      setSearchQuery(value);
                      if (!isPhoneSearch) handleNameSearch(value);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search by Name or Phone"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                  {isPhoneSearch && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSearchByPhone}
                      sx={{ mt: 2, bgcolor: theme.palette.greenAccent.main }}
                    >
                      Search by Phone
                    </Button>
                  )}
                  {searchPerformed && searchResults.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1">Search Results:</Typography>
                      <List>
                        {searchResults.map((customer) => (
                          <ListItem
                            key={customer.customerId}
                            button
                            onClick={() => handleCustomerSelect(customer)}
                            sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
                          >
                            <ListItemText
                              primary={customer?.firstName}
                              secondary={customer?.phoneNumber}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  {searchPerformed && searchResults.length === 0 && (
                    <Typography sx={{ mt: 2 }}>No customers found.</Typography>
                  )}
                </Box>
              ) : (
                <Box>
                  <TextField
                    label="Customer Name"
                    value={selectedCustomer.name}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="Phone Number"
                    value={phoneNumber}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    InputProps={{ readOnly: true }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSendBillToCustomer}
                    sx={{ mt: 2, bgcolor: theme.palette.greenAccent.main }}
                  >
                    Send Bill
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setPhoneNumber('');
                    }}
                    sx={{ mt: 2, ml: 2 }}
                  >
                    Change Customer
                  </Button>
                </Box>
              )}
            </>
          )}

          {/* Tab 2: Send Bills to Group (Per Landlord or Building) */}
          {tabValue === 2 && (
            <>
              <Typography variant="h6" gutterBottom>
                Send Bills to Group (Per Landlord or Building)
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  views={["year", "month"]}
                  label="Select Billing Period (Year-Month)"
                  value={groupPeriod}
                  onChange={(newValue) => setGroupPeriod(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      margin="normal"
                      helperText="Format: YYYY-MM (e.g., 2025-04)"
                    />
                  )}
                  maxDate={new Date()}
                />
              </LocalizationProvider>
              <Autocomplete
                options={landlords}
                getOptionLabel={(option) => option.name || `Landlord ${option.id}`}
                value={selectedLandlord}
                onChange={(event, newValue) => {
                  setSelectedLandlord(newValue);
                  if (newValue) setSelectedBuilding(null);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Landlord"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {landlordsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                disabled={!!selectedBuilding}
              />
              <Autocomplete
                options={buildings}
                getOptionLabel={(option) => option.name || `Building ${option.id}`}
                value={selectedBuilding}
                onChange={(event, newValue) => {
                  setSelectedBuilding(newValue);
                  if (newValue) setSelectedLandlord(null);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Building"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {buildingsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                disabled={!!selectedLandlord}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendBillsToGroup}
                sx={{ mt: 2, bgcolor: theme.palette.greenAccent.main }}
              >
                Send Bills
              </Button>
            </>
          )}

          {/* Response Message */}
          {message && (
            <Box sx={{ mt: 2 }}>
              <Typography color={message.includes('Error') ? 'error' : 'success'}>
                {message}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Snackbar for search errors */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="error">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default SendBillsScreen;