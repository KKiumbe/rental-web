import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  TextField,
  Container,
  Paper,
  Autocomplete,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  Chip,
} from '@mui/material';
import { getTheme } from '../../store/theme';
import TitleComponent from '../../components/title';
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { addMonths } from 'date-fns';

const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";

function SendBillsScreen() {
  const [message, setMessage]                       = useState('');
  const [sending, setSending]                       = useState(false);
  const [selectedPeriod, setSelectedPeriod]         = useState(null);
  const [selectedBuilding, setSelectedBuilding]     = useState(null);
  const [buildings, setBuildings]                   = useState([]);
  const [buildingsLoading, setBuildingsLoading]     = useState(false);
  const [snackbarOpen, setSnackbarOpen]             = useState(false);
  const [snackbarMessage, setSnackbarMessage]       = useState('');

  // Single-customer state
  const [allCustomers, setAllCustomers]                 = useState([]);
  const [allCustomersLoading, setAllCustomersLoading]   = useState(false);
  const [selectedCustomer, setSelectedCustomer]     = useState(null);
  const [sendingOne, setSendingOne]                 = useState(false);
  const [oneMessage, setOneMessage]                 = useState('');

  const theme = getTheme();

  // Allow up to next month (bills are generated early)
  const maxDate = addMonths(new Date(), 1);

  const fetchBuildings = useCallback(async () => {
    try {
      setBuildingsLoading(true);
      const res = await axios.get(`${BASEURL}/buildings`, { params: { minimal: true }, withCredentials: true });
      setBuildings(res.data.buildings || []);
    } catch {
      setSnackbarMessage('Failed to load buildings');
      setSnackbarOpen(true);
    } finally {
      setBuildingsLoading(false);
    }
  }, []);

  const fetchAllCustomers = useCallback(async () => {
    setAllCustomersLoading(true);
    try {
      const [tenantsResult, waterResult] = await Promise.allSettled([
        axios.get(`${BASEURL}/customers`, { withCredentials: true }),
        axios.get(`${BASEURL}/water-only-customers`, { withCredentials: true }),
      ]);

      const tenants =
        tenantsResult.status === 'fulfilled'
          ? (tenantsResult.value.data.customers || []).map((c) => ({ ...c, type: 'tenant' }))
          : [];

      const waterCustomers =
        waterResult.status === 'fulfilled'
          ? (waterResult.value.data.data || []).map((c) => ({ ...c, type: 'water' }))
          : [];

      if (tenantsResult.status === 'rejected') {
        setSnackbarMessage('Could not load tenants');
        setSnackbarOpen(true);
      }
      if (waterResult.status === 'rejected') {
        setSnackbarMessage('Could not load water customers');
        setSnackbarOpen(true);
      }

      setAllCustomers([...tenants, ...waterCustomers]);
    } finally {
      setAllCustomersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuildings();
    fetchAllCustomers();
  }, [fetchBuildings, fetchAllCustomers]);

  const formatPeriod = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  const handleSendBills = async () => {
    if (!selectedPeriod) {
      setSnackbarMessage('Please select a billing period');
      setSnackbarOpen(true);
      return;
    }
    setSending(true);
    setMessage('');
    try {
      const payload = { period: formatPeriod(selectedPeriod) };
      if (selectedBuilding) payload.buildingID = selectedBuilding.id;
      const res = await axios.post(`${BASEURL}/send-bills`, payload, { withCredentials: true });
      setMessage(res.data.message || 'Bills sent successfully');
      setSelectedPeriod(null);
      setSelectedBuilding(null);
    } catch (err) {
      setMessage(err.response?.data?.error || err.response?.data?.message || 'Error sending bills');
    } finally {
      setSending(false);
    }
  };

  const handleSendOneBill = async () => {
    if (!selectedCustomer) {
      setSnackbarMessage('Please select a customer');
      setSnackbarOpen(true);
      return;
    }
    setSendingOne(true);
    setOneMessage('');
    try {
      const payload =
        selectedCustomer.type === 'water'
          ? { waterCustomerId: selectedCustomer.id }
          : { customerId: selectedCustomer.id };
      const res = await axios.post(`${BASEURL}/send-bill`, payload, { withCredentials: true });
      setOneMessage(res.data.message || 'Bill sent successfully');
      setSelectedCustomer(null);
    } catch (err) {
      setOneMessage(err.response?.data?.error || err.response?.data?.message || 'Error sending bill');
    } finally {
      setSendingOne(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ pt: 3, ml: 20 }}>
      <TitleComponent title="Bills Center" />

      {/* ── Send to All / Building ── */}
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Send Bills
        </Typography>

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            views={["year", "month"]}
            label="Billing Period"
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            maxDate={maxDate}
            renderInput={(params) => (
              <TextField {...params} fullWidth margin="normal" helperText="Select billing month (next month allowed)" />
            )}
          />
        </LocalizationProvider>

        <Autocomplete
          options={buildings}
          getOptionLabel={(o) => o.name || `Building ${o.id}`}
          value={selectedBuilding}
          onChange={(_, v) => setSelectedBuilding(v)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter by Building (optional — blank = all)"
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
        />

        <Button
          variant="contained"
          onClick={handleSendBills}
          disabled={sending || !selectedPeriod}
          sx={{ mt: 2, bgcolor: theme.palette.greenAccent.main }}
          startIcon={sending ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {sending ? 'Sending…' : selectedBuilding ? `Send to ${selectedBuilding.name}` : 'Send to All Buildings'}
        </Button>

        {message && (
          <Box sx={{ mt: 2 }}>
            <Typography color={message.toLowerCase().includes('error') ? 'error' : 'success.main'}>
              {message}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* ── Send to Specific Tenant ── */}
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Send Bill to Specific Tenant
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Sends the latest available bill (next month if ready, otherwise current month)
        </Typography>

        <Autocomplete
          options={allCustomers}
          getOptionLabel={(o) =>
            `${o.firstName} ${o.lastName || ''}`.trim() || o.phoneNumber || `Customer ${o.id}`
          }
          value={selectedCustomer}
          onChange={(_, v) => setSelectedCustomer(v)}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <span>{option.firstName} {option.lastName || ''}</span>
                {option.type === 'water' && (
                  <Chip label="Water" size="small" color="info" sx={{ ml: 'auto', fontSize: 11 }} />
                )}
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search Tenant or Water Customer"
              variant="outlined"
              fullWidth
              margin="normal"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {allCustomersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <Button
          variant="contained"
          onClick={handleSendOneBill}
          disabled={sendingOne || !selectedCustomer}
          sx={{ mt: 2, bgcolor: theme.palette.greenAccent.main }}
          startIcon={sendingOne ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {sendingOne ? 'Sending…' : selectedCustomer ? `Send Bill to ${selectedCustomer.firstName}` : 'Send Bill'}
        </Button>

        {oneMessage && (
          <Box sx={{ mt: 2 }}>
            <Typography color={oneMessage.toLowerCase().includes('error') ? 'error' : 'success.main'}>
              {oneMessage}
            </Typography>
          </Box>
        )}
      </Paper>

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="warning">{snackbarMessage}</Alert>
      </Snackbar>
    </Container>
  );
}

export default SendBillsScreen;
