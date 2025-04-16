import React, { useState } from 'react';
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



const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";
// Days of the week options
const daysOfWeek = [
  { label: 'Monday', value: 'Monday' },
  { label: 'Tuesday', value: 'Tuesday' },
  { label: 'Wednesday', value: 'Wednesday' },
  { label: 'Thursday', value: 'Thursday' },
  { label: 'Friday', value: 'Friday' },
  { label: 'Saturday', value: 'Saturday' },
  { label: 'Sunday', value: 'Sunday' },
];

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
  const [phoneNumber, setPhoneNumber] = useState(''); // For phone number display
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  // State for send bills per day
  const [day, setDay] = useState(null);
  const theme = getTheme();
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setMessage('');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedCustomer(null);
    setPhoneNumber('');
    setSearchPerformed(false);
    setIsPhoneSearch(false);
    setDay(null);
  };

  // 1. Send Bills to All
  const handleSendBillsToAll = async () => {
    try {
      const response = await axios.post(`${BASEURL}/send-bills`, {}, { withCredentials: true });
      setMessage(response.data.message);
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
    setPhoneNumber(customer.phoneNumber || customer.phone || ''); // Populate phone number
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
      const response = await axios.post(`${BASEURL}/send-bill`, 
        { customerId: selectedCustomer.customerId }, // Only customerId sent
        { withCredentials: true }
      );
      setMessage(response.data.message);
      setSelectedCustomer(null);
      setPhoneNumber('');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error sending bill');
    }
  };

  // 3. Send Bills to Group (Per Day)
  const handleSendBillsToGroup = async () => {
    if (!day) {
      setMessage('Please select a day');
      return;
    }
    try {
      const response = await axios.post(`${BASEURL}/send-bill-perday`, { day: day.value });
      setMessage(response.data.message);
      setDay(null);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error sending bills');
    }
  };

  return (
    <Container maxWidth="md" sx={{width: '100%', padding: 3, 
      ml:20
     }}>


<Typography
              
              // Primary color for title
              sx={{ width: '100%', textAlign: 'center', mb: 2, color: theme.palette.primary.contrastText }}
              >

          <TitleComponent title="Bills Center"  />
               
              </Typography>
      <Paper elevation={3}>

        <Box sx={{ }}>
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
              color: theme.palette.primary.main,
              '&  .MuiTabs-selected': { color: theme.palette.secondary.dark},
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

          {/* Tab 2: Send Bills to Group */}
          {tabValue === 2 && (
            <>
              <Typography variant="h6" gutterBottom>
                Send Bills to Group (Per Day)
              </Typography>
              <Autocomplete
                options={daysOfWeek}
                getOptionLabel={(option) => option.label}
                value={day}
                onChange={(event, newValue) => setDay(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Day of the Week"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                  />
                )}
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