import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  MenuItem,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Modal,
  FormControl,
  InputLabel,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import axios from 'axios';
import { getTheme } from '../store/theme';
import TitleComponent from '../components/title';

const CustomerEditScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = getTheme();
  const BASEURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000/api';
  const [loading, setLoading] = useState(true);
  const [originalData, setOriginalData] = useState(null);
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    secondaryPhoneNumber: '',
    nationalId: '',
    status: '',
    closingBalance: '',
    leaseFileUrl: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [openLeaseModal, setOpenLeaseModal] = useState(false);
  const [leaseFile, setLeaseFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [openTerminateDialog, setOpenTerminateDialog] = useState(false);

  const formatNumberWithCommas = (number) => {
    if (!number && number !== 0) return '';
    const num = Number(number);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
  };

  const cleanNumberInput = (value) => {
    if (!value) return '';
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return parts[0] + '.' + parts[1];
    return cleaned;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const customerResponse = await axios.get(`${BASEURL}/customer-details/${id}`, {
          withCredentials: true,
        });
        const fetchedData = customerResponse.data;

        const normalizedData = {
          firstName: fetchedData.firstName || '',
          lastName: fetchedData.lastName || '',
          email: fetchedData.email || '',
          phoneNumber: fetchedData.phoneNumber || '',
          secondaryPhoneNumber: fetchedData.secondaryPhoneNumber || '',
          nationalId: fetchedData.nationalId || '',
          status: fetchedData.status || '',
          closingBalance:
            fetchedData.closingBalance !== null && fetchedData.closingBalance !== undefined
              ? fetchedData.closingBalance.toString()
              : '',
          leaseFileUrl: fetchedData.leaseFileUrl || '',
        };

        setCustomerData(normalizedData);
        setOriginalData(normalizedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbar({
          open: true,
          message: 'Error fetching data: ' + error.message,
          severity: 'error',
        });
        setLoading(false);
      }
    };
    fetchData();
  }, [id, BASEURL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'closingBalance') {
      const cleanedValue = cleanNumberInput(value);
      setCustomerData((prev) => ({
        ...prev,
        [name]: cleanedValue,
      }));
    } else {
      setCustomerData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const getChangedFields = () => {
    const changedFields = {};
    for (const key in customerData) {
      if (customerData[key] !== originalData[key]) {
        if (key === 'closingBalance') {
          changedFields[key] = customerData[key] ? parseFloat(customerData[key]) : null;
        } else {
          changedFields[key] = customerData[key];
        }
      }
    }
    return changedFields;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const changedData = getChangedFields();
      if (Object.keys(changedData).length === 0) {
        setSnackbar({
          open: true,
          message: 'No changes detected',
          severity: 'info',
        });
        setLoading(false);
        return;
      }
      await axios.put(`${BASEURL}/customers/${id}`, changedData, {
        withCredentials: true,
      });
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Customer changes saved successfully!',
        severity: 'success',
      });
      setTimeout(() => {
        navigate('/customers');
      }, 2000);
    } catch (error) {
      console.error('Error updating customer:', error);
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Error updating customer: ' + (error.response?.data?.message || error.message),
        severity: 'error',
      });
    }
  };

  const handleLeaseUpload = async () => {
    if (!leaseFile) {
      setSnackbar({
        open: true,
        message: 'Please select a PDF file to upload.',
        severity: 'error',
      });
      return;
    }
    if (leaseFile.type !== 'application/pdf') {
      setSnackbar({
        open: true,
        message: 'Only PDF files are allowed.',
        severity: 'error',
      });
      return;
    }
    if (leaseFile.size > 5 * 1024 * 1024) {
      setSnackbar({
        open: true,
        message: 'File size exceeds 5MB.',
        severity: 'error',
      });
      return;
    }
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('leaseFile', leaseFile);
      formData.append('customerId', id);

      await axios.post(`${BASEURL}/upload-lease`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCustomerData((prev) => ({
        ...prev,
        leaseFileUrl: `Uploads/leases/${leaseFile.name}`,
      }));
      setOriginalData((prev) => ({
        ...prev,
        leaseFileUrl: `Uploads/leases/${leaseFile.name}`,
      }));
      setLeaseFile(null);
      setOpenLeaseModal(false);
      setSnackbar({
        open: true,
        message: 'Lease uploaded successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error uploading lease:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to upload lease agreement.',
        severity: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  const handleLeaseDownload = async () => {
    setSending(true);
    try {
      const response = await axios.get(`${BASEURL}/download-lease/${id}`, {
        withCredentials: true,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lease_${customerData.firstName}_${customerData.lastName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSnackbar({
        open: true,
        message: 'Lease downloaded successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error downloading lease:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to download lease agreement.',
        severity: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  const handleTerminateLease = () => {
    setOpenTerminateDialog(true);
  };

  const confirmTerminateLease = async () => {
    setSending(true);
    try {
      await axios.post(`${BASEURL}/terminate-lease/${id}`, {}, { withCredentials: true });
      setCustomerData((prev) => ({
        ...prev,
        leaseFileUrl: '',
      }));
      setOriginalData((prev) => ({
        ...prev,
        leaseFileUrl: '',
      }));
      setOpenLeaseModal(false);
      setOpenTerminateDialog(false);
      setSnackbar({
        open: true,
        message: 'Lease terminated successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error terminating lease:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to terminate lease.',
        severity: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
    if (snackbar.severity === 'success' && !openLeaseModal && !openTerminateDialog) {
      navigate('/customers');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ maxWidth: 900, minWidth: 600, ml: 10 }}>
      <Paper elevation={3} sx={{ p: 4, mt: 4, minWidth: 800 }}>
        <Typography variant="h4" gutterBottom>
          <TitleComponent title={`Edit ${customerData?.firstName}'s Details`} />
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <TextField
              label="First Name"
              name="firstName"
              value={customerData.firstName}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Last Name"
              name="lastName"
              value={customerData.lastName}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={customerData.email}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Phone Number"
              name="phoneNumber"
              value={customerData.phoneNumber}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Secondary Phone Number"
              name="secondaryPhoneNumber"
              value={customerData.secondaryPhoneNumber}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="National ID"
              name="nationalId"
              value={customerData.nationalId}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              select
              label="Status"
              name="status"
              value={customerData.status || ''}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
            </TextField>
            <TextField
              label="Closing Balance"
              name="closingBalance"
              type="text"
              value={formatNumberWithCommas(customerData.closingBalance)}
              onChange={handleChange}
              fullWidth
            />
          </Box>
          <Box sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || sending}
              sx={{ mr: 2, backgroundColor: theme.palette.greenAccent.main }}
            >
              {loading ? 'Updating...' : 'Update Customer'}
            </Button>
            <Button
              variant="contained"
              onClick={() => setOpenLeaseModal(true)}
              disabled={loading || sending}
              sx={{ mr: 2, backgroundColor: theme.palette.greenAccent.main }}
            >
              Manage Lease
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate('/customers')}
              disabled={loading || sending}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>

      <Modal open={openLeaseModal} onClose={() => setOpenLeaseModal(false)}>
        <Box
          sx={{
            p: 4,
            bgcolor: 'background.paper',
            borderRadius: 2,
            width: 400,
            mx: 'auto',
            mt: '10%',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Manage Lease
          </Typography>
          {snackbar.open && openLeaseModal && (
            <Alert severity={snackbar.severity} sx={{ mb: 2 }} onClose={handleCloseSnackbar}>
              {snackbar.message}
            </Alert>
          )}
          {!customerData.leaseFileUrl ? (
            <>
              <Typography variant="body1" mb={2}>
                No lease agreement found. Upload a new lease agreement (PDF only, max 5MB).
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel shrink htmlFor="lease-upload">
                  Upload Lease Agreement
                </InputLabel>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setLeaseFile(e.target.files[0])}
                  id="lease-upload"
                  style={{ marginTop: '16px' }}
                />
              </FormControl>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleLeaseUpload}
                  disabled={sending || !leaseFile}
                >
                  {sending ? 'Uploading...' : 'Upload Lease'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setOpenLeaseModal(false)}
                  disabled={sending}
                >
                  Cancel
                </Button>
              </Stack>
            </>
          ) : (
            <>
              <Typography variant="body1" mb={2}>
                Lease agreement exists. You can download or terminate the lease.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleLeaseDownload}
                  disabled={sending}
                >
                  {sending ? 'Downloading...' : 'Download Lease'}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleTerminateLease}
                  disabled={sending}
                >
                  {sending ? 'Processing...' : 'Terminate Lease'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setOpenLeaseModal(false)}
                  disabled={sending}
                  color={theme.palette.secondary.contrastText}
                >
                  Cancel
                </Button>
              </Stack>
            </>
          )}
        </Box>
      </Modal>

      <Dialog open={openTerminateDialog} onClose={() => setOpenTerminateDialog(false)}>
        <DialogTitle>Confirm Lease Termination</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to terminate the lease for {customerData.firstName} {customerData.lastName}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTerminateDialog(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={confirmTerminateLease} color="error" disabled={sending}>
            {sending ? 'Terminating...' : 'Terminate'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CustomerEditScreen;