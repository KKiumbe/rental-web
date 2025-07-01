import { useState, useEffect } from 'react';
import {
  Tabs,
  Tab,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  LinearProgress,
  Snackbar,
  Alert,
  Container,
} from '@mui/material';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { getTheme } from '../store/theme';
import TitleComponent from '../components/title';

const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";

const reportData = {
  customers: [
    { name: 'All Tenants', description: 'List of all Tenants customers', endpoint: `${BASEURL}/reports/customers` },
    { name: 'Dormant Tenants', description: 'Tenants with no recent activity', endpoint: `${BASEURL}/reports/dormant` },
    {
      name: 'Tenants by landlord',
      description: 'Tenants categorized by the landlord',
      endpoint: `${BASEURL}/reports/tenant-per-landlord`,
    },
  ],
  invoices: [
    { name: 'Monthly Invoices', description: 'Invoices issued this month', endpoint: `${BASEURL}/reports/monthly-invoice` },
    { name: 'Age Analysis', description: 'Invoice aging report', endpoint: `${BASEURL}/reports/age-analysis` },
    {
      name: 'High Debt Customers',
      description: 'Customers with arrears > 2x monthly charge',
      endpoint: `${BASEURL}/reports/customers-debt-high`,
    },
    {
      name: 'Low Debt Customers',
      description: 'Customers with arrears < monthly charge',
      endpoint: `${BASEURL}/reports/customers-debt-low`,
    },
  ],
  payments: [
    { name: 'Monthly Payments', description: 'All payments this month', endpoint: `${BASEURL}/reports/payments` },
    { name: 'Mpesa Payments', description: 'Payments via Mpesa', endpoint: `${BASEURL}/reports/mpesa` },
    { name: 'All Receipts', description: 'All issued receipts', endpoint: `${BASEURL}/reports/receipts` },
    { name: 'Income Report', description: 'Total income summary', endpoint: `${BASEURL}/reports/income` },
  ],
  landlordSummaries: [
    {
      name: 'Total Rent per Landlord',
      description: 'Total rent collected per landlord',
      endpoint: `${BASEURL}/reports/landlord-rent`,
    },
    {
      name: 'Income per Building',
      description: 'Income per building across all landlords',
      endpoint: `${BASEURL}/reports/income-per-building`,
    },
    {
      name: 'Income per Landlord',
      description: 'Detailed income per landlord with building breakdown',
      endpoint: `${BASEURL}/reports/income-per-landlord`,
    },
  ],
};

const ReportScreen = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [downloading, setDownloading] = useState({});
  const [progress, setProgress] = useState({});
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const theme = getTheme();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDownload = async (endpoint, reportName) => {
    setDownloading((prev) => ({ ...prev, [endpoint]: true }));
    setProgress((prev) => ({ ...prev, [endpoint]: 0 }));

    try {
      const response = await axios.get(endpoint, {
        responseType: 'blob',
        withCredentials: true,
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress((prev) => ({ ...prev, [endpoint]: percentCompleted }));
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setNotification({ open: true, message: `${reportName} downloaded successfully!`, severity: 'success' });
    } catch (error) {
      console.error('Error downloading report:', error);
      setNotification({ open: true, message: 'Failed to download report. Please try again.', severity: 'error' });
    } finally {
      setDownloading((prev) => ({ ...prev, [endpoint]: false }));
      setProgress((prev) => ({ ...prev, [endpoint]: 0 }));
    }
  };

  const renderTabContent = (tabData) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Report Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tabData.map((report, index) => (
            <TableRow key={index}>
              <TableCell>{report.name}</TableCell>
              <TableCell>{report.description}</TableCell>
              <TableCell>
                <Box sx={{ position: 'relative' }}>
                  <Button
                    variant="contained"
                    sx={{ backgroundColor: theme.palette.greenAccent.main }}
                    onClick={() => handleDownload(report.endpoint, report.name)}
                    disabled={downloading[report.endpoint]}
                  >
                    {downloading[report.endpoint] ? 'Downloading...' : 'Download'}
                  </Button>
                  {downloading[report.endpoint] && (
                    <LinearProgress
                      variant="determinate"
                      value={progress[report.endpoint] || 0}
                      sx={{ position: 'absolute', bottom: -4, left: 0, right: 0 }}
                    />
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Container sx={{ width: '100%', ml: 20 }}>
      <Box>
        <Typography variant="h5" gutterBottom>
          <TitleComponent title="Reports Center" />
        </Typography>
       <Tabs
  value={activeTab}
  onChange={handleTabChange}
  aria-label="report tabs"
  variant="scrollable"
  scrollButtons="auto"
  sx={{
    minWidth: 500,
    maxWidth: 1200,
    width: '100%',
    color: theme.palette.primary.contrastText,
    mb: 3,
    border: `1px solid ${theme.palette.primary.light}`,
    borderRadius: 2,
    '& .MuiTab-root': { color: theme.palette.primary.contrastText },
    '& .Mui-selected': { backgroundColor: theme.palette.greenAccent.main },
  }}
>
  <Tab label="Customers" />
  <Tab label="Invoices" />
  <Tab label="Payments" />
  <Tab label="Landlord Summaries" />
</Tabs>

        <Box sx={{ mt: 2 }}>
          {activeTab === 0 && renderTabContent(reportData.customers)}
          {activeTab === 1 && renderTabContent(reportData.invoices)}
          {activeTab === 2 && renderTabContent(reportData.payments)}
          {activeTab === 3 && renderTabContent(reportData.landlordSummaries)}
        </Box>
      </Box>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ReportScreen;