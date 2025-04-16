import React, { useState } from 'react';
import { 
  Tabs, Tab, Box, TextField, Button, Typography, Autocomplete, 
  MenuItem, Select, InputLabel, FormControl, Container, CircularProgress,
  Snackbar,
  Alert,
  colors
} from '@mui/material';
import { getTheme } from '../store/theme';
import axios from 'axios';
import TitleComponent from '../components/title';



function SmsScreen() {
  const [tabValue, setTabValue] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });


  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const theme = getTheme();
  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";
  const resetFields = () => {
    setPhoneNumber('');
    setMessage('');
    setSelectedDay('');
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
      const { data } = await axios.get(`${BASEURL}/search-customer-by-name`, {
        params: { name: searchQuery },
        withCredentials: true,
      });
      setSearchResults(data.customers || data); // Assuming response is an array
    } catch (error) {
      console.error("Error fetching search results:", error);
      setSearchResults([]);
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
      url = `${BASEURL}/send-sms`;
      body = { mobile: phoneNumber, message };
    } else if (type === 'all') {
      url = `${BASEURL}/send-to-all`;
      body = { message };
    } else if (type === 'group') {
      if (!selectedDay) {
        setSnackbar({ open: true, message: 'Please select a day', severity: 'error' });
        return;
      }
      url = `${BASEURL}/send-to-group`;
      body = { day: selectedDay };
    }
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
  
      if (response.ok) {
        setSnackbar({ open: true, message: `${type.charAt(0).toUpperCase() + type.slice(1)} SMS sent successfully!`, severity: 'success' });
        resetFields();
      } else {
        throw new Error('Failed to send SMS');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      setSnackbar({ open: true, message: 'Failed to send SMS. Please try again.', severity: 'error' });
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
          sx={{ color: theme.palette.primary.contrastText, mb: 2}} // Primary color for title
        >
          <TitleComponent title= "SMS Center"/>
        </Typography>
         
      <Box
        sx={{
          maxWidth: '100%',
          ml: { xs: 0, sm: 2 }, // Additional 16px left shift on small+ screens
          mt: 4,
          p: 3,
          borderRadius: 2,
        
        }}
      >


      
       

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
          sx={{
            mb: 3,
            border: `1px solid ${theme.palette.primary.light}`, // Border color
            
         
           // Medium grey for tabs
            borderRadius: 2,
           
            '& .MuiTab-root': { color: theme.palette.primary.contrastText }, // Unselected tabs
            '& .Mui-selected': { color: theme.palette.primary.contrastText , }, // Selected tab
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
                getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.phoneNumber})`} // Display full name and phone
                onInputChange={handleSearchChange}
                onChange={(event, value) => setPhoneNumber(value ? value.phoneNumber : '')} // Set phoneNumber from selection
                loading={isSearching}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Customer by Name"
                    fullWidth
                    margin="normal"
                    sx={{ bgcolor: theme.palette.primary.light[100]}} // Medium grey input
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
                sx={{ bgcolor: theme.palette.primary.light[100] }} // Medium grey input
              />
              <TextField
                label="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                fullWidth
                multiline
                rows={4}
                margin="normal"
                sx={{ bgcolor: theme.palette.primary.light[100] }} // Medium grey input
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleSend('single')}
                sx={{ mt: 2, bgcolor: theme.palette.greenAccent.main }} // Primary button
              >
                Send SMS
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
                sx={{ bgcolor: theme.palette.primary.light[100] }} // Medium grey input
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
                sx={{ bgcolor: theme.palette.primary.light[100] }} // Medium grey input
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleSend('new')}
                sx={{ mt: 2, bgcolor: theme.palette.greenAccent.main }} // Primary button
              >
                Send SMS
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
                sx={{ bgcolor: theme.palette.primary.light[100] }} // Medium grey input
              />
              <Button
                variant="contained"
                color="greenAccent"
                onClick={() => handleSend('all')}
                sx={{ mt: 2, bgcolor: theme.palette.greenAccent.main }} // Green accent button
              >
                Send to All
              </Button>
            </>
          )}
          {tabValue === 3 && (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel sx={{ color: theme.palette.primary.main }}>
                  Select Service Day
                </InputLabel>
                <Select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  label="Select Service Day"
                  sx={{ bgcolor: theme.palette.grey[300] }} // Medium grey input
                >
                  {daysOfWeek.map((day) => (
                    <MenuItem key={day} value={day}>{day}</MenuItem>
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
                sx={{ bgcolor: theme.palette.primary.light[100] }} // Medium grey input
              />
              <Button
                variant="contained"
                color="greenAccent"
                onClick={() => handleSend('group')}
                sx={{ mt: 2, bgcolor: theme.palette.greenAccent.main }} // Green accent button
              >
                Send to Group
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>


  );
}

export default SmsScreen;