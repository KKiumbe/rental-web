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
} from '@mui/material';
import { getTheme } from '../../store/theme';
import TitleComponent from '../../components/title';
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

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
  const theme = getTheme();

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

  useEffect(() => { fetchBuildings(); }, [fetchBuildings]);

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

  return (
    <Container maxWidth="sm" sx={{ pt: 3, ml: 20 }}>
      <TitleComponent title="Bills Center" />
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Send Bills
        </Typography>

        {/* Period picker — restricted to current month and earlier */}
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            views={["year", "month"]}
            label="Billing Period"
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            maxDate={new Date()}
            renderInput={(params) => (
              <TextField {...params} fullWidth margin="normal" helperText="Current month or earlier" />
            )}
          />
        </LocalizationProvider>

        {/* Optional building filter */}
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

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="warning">{snackbarMessage}</Alert>
      </Snackbar>
    </Container>
  );
}

export default SendBillsScreen;
