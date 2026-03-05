import { useEffect, useState, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';
import { Box, Typography, Paper, Snackbar, Alert, Divider } from '@mui/material';
import TitleComponent from '../../components/title';
import { useAuthStore } from '../../store/authStore';

import OnboardingStepper from '../../components/onboarding/OnboardingStepper';
import CustomerForm from '../../components/onboarding/CustomerForm';
import OnboardingInvoiceForm from '../../components/onboarding/OnboardingInvoiceForm';
import UtilityReadingsForm from '../../components/onboarding/UtilityReadingsForm';
import OnboardingConfirmation from '../../components/onboarding/OnboardingConfirmation';
import BulkUploadForm from '../../components/onboarding/BulkUploadForm';

// ── Error Boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <Typography color="error" sx={{ p: 2 }}>
          Error rendering page: {this.state.error?.message || 'Unknown error'}
        </Typography>
      );
    }
    return this.props.children;
  }
}
ErrorBoundary.propTypes = { children: PropTypes.node };

// ── Page component ──────────────────────────────────────────────────────────
export default function CreateCustomerScreen() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // ── Stepper ──
  const [activeStep, setActiveStep] = useState(0);
  const [customerId, setCustomerId] = useState(null);

  // ── Step 1: customer details ──
  const [formData, setFormData] = useState({
    unitId: '',
    buildingId: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    secondaryPhoneNumber: '',
    nationalId: '',
  });
  const [buildings, setBuildings] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(false);

  // ── Step 2: invoice ──
  const [invoiceData, setInvoiceData] = useState({
    invoiceItems: [{ description: '', amount: '', quantity: 1 }],
  });
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [checkedSuggestions, setCheckedSuggestions] = useState({});

  // ── Step 3: utility readings ──
  const [utilityReadings, setUtilityReadings] = useState([{ type: 'water', reading: '' }]);

  // ── Bulk upload ──
  const [bulkBuildingId, setBulkBuildingId] = useState('');
  const [file, setFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkErrors, setBulkErrors] = useState([]);

  // ── Shared ──
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  const notify = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // ── Auth guard ──
  useEffect(() => {
    if (!currentUser) navigate('/login');
  }, [currentUser, navigate]);

  // ── Fetch buildings ──
  const fetchBuildings = async () => {
    try {
      setBuildingsLoading(true);
      const response = await axios.get(`${BASE_URL}/buildings`, {
        params: { minimal: true },
        withCredentials: true,
      });
      const data = response.data;
      setBuildings(data.buildings ?? data.data ?? []);
    } catch (error) {
      notify(error.response?.data?.message || 'Failed to load buildings. Please try again.', 'error');
    } finally {
      setBuildingsLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch units when building changes ──
  const fetchUnits = async (buildingId) => {
    try {
      setUnitsLoading(true);
      setUnits([]);
      const response = await axios.get(`${BASE_URL}/buildings/${buildingId}`, {
        withCredentials: true,
      });
      const fetched = response.data?.units || [];
      setUnits(fetched);
      if (fetched.length === 0) notify('No units available for the selected building.', 'warning');
    } catch (error) {
      notify(error.response?.data?.message || 'Failed to load units. Please try again.', 'error');
      setUnits([]);
    } finally {
      setUnitsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBuildingId) {
      fetchUnits(selectedBuildingId);
    } else {
      setUnits([]);
      setFormData((prev) => ({ ...prev, unitId: '' }));
    }
  }, [selectedBuildingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 1 handlers ──
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleBuildingChange = (e) => {
    const id = e.target.value;
    setSelectedBuildingId(id);
    setFormData((prev) => ({ ...prev, buildingId: id, unitId: '' }));
    setErrors((prev) => ({ ...prev, buildingId: '', unitId: '' }));
    setSuggestedItems([]);
    setCheckedSuggestions({});
    setInvoiceData({ invoiceItems: [{ description: '', amount: '', quantity: 1 }] });
  };

  const handleUnitChange = (e) => {
    const unitId = e.target.value;
    setFormData((prev) => ({ ...prev, unitId }));
    setErrors((prev) => ({ ...prev, unitId: '' }));

    const unit = units.find((u) => u.id === unitId);
    if (unit) {
      const suggestions = [];
      if (unit.monthlyCharge) suggestions.push({ description: 'Rent', amount: unit.monthlyCharge, quantity: 1 });
      if (unit.depositAmount) suggestions.push({ description: 'Rent Deposit', amount: unit.depositAmount, quantity: 1 });
      if (unit.waterRate != null) suggestions.push({ description: 'Water Deposit', amount: unit.waterRate, quantity: 1 });
      if (unit.garbageCharge) suggestions.push({ description: 'Garbage Charge', amount: unit.garbageCharge, quantity: 1 });
      if (unit.serviceCharge) suggestions.push({ description: 'Service Charge', amount: unit.serviceCharge, quantity: 1 });

      setSuggestedItems(suggestions);
      const checked = {};
      suggestions.forEach((_, i) => { checked[i] = true; });
      setCheckedSuggestions(checked);
    } else {
      setSuggestedItems([]);
      setCheckedSuggestions({});
    }
  };

  const validateCustomerForm = () => {
    const errs = {};
    if (!formData.unitId) errs.unitId = 'Unit is required';
    if (!formData.buildingId) errs.buildingId = 'Building is required';
    if (!formData.firstName && !formData.lastName)
      errs.firstName = 'At least one of firstName or lastName is required';
    if (!formData.phoneNumber) errs.phoneNumber = 'Phone number is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Invalid email format';
    if (formData.phoneNumber && !/^\+?\d{10,15}$/.test(formData.phoneNumber))
      errs.phoneNumber = 'Invalid phone number format';
    if (formData.secondaryPhoneNumber && !/^\+?\d{10,15}$/.test(formData.secondaryPhoneNumber))
      errs.secondaryPhoneNumber = 'Invalid secondary phone number format';
    return errs;
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const errs = validateCustomerForm();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (!currentUser?.tenantId) { notify('Tenant ID is missing. Please log in again.', 'error'); return; }

    setLoading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/customers`,
        { ...formData, tenantId: currentUser.tenantId, unitId: formData.unitId || null },
        { withCredentials: true }
      );
      setCustomerId(response.data.data.id);
      notify(response.data.message || 'Customer created successfully', 'success');
      setActiveStep(1);
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to create customer. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 handlers ──
  const handleToggleSuggestion = (index) => {
    setCheckedSuggestions((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleApplySuggestions = () => {
    const selected = suggestedItems.filter((_, i) => checkedSuggestions[i]);
    if (selected.length === 0) { notify('No items selected. Please check at least one suggested item.', 'warning'); return; }
    setInvoiceData({ invoiceItems: selected.map((s) => ({ ...s })) });
    notify('Suggested items applied to the invoice.', 'success');
  };

  const handleInvoiceChange = (index, field, value) => {
    setInvoiceData((prev) => {
      const items = [...prev.invoiceItems];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, invoiceItems: items };
    });
    setErrors((prev) => ({ ...prev, [`item${index}_${field}`]: '' }));
  };

  const handleAddItem = () => {
    setInvoiceData((prev) => ({
      ...prev,
      invoiceItems: [...prev.invoiceItems, { description: '', amount: '', quantity: 1 }],
    }));
  };

  const handleRemoveItem = (index) => {
    setInvoiceData((prev) => ({
      ...prev,
      invoiceItems: prev.invoiceItems.filter((_, i) => i !== index),
    }));
  };

  const validateInvoiceForm = () => {
    const errs = {};
    invoiceData.invoiceItems.forEach((item, index) => {
      const hasDesc = item.description && item.description.toString().trim() !== '';
      const hasAmt = item.amount !== '' && item.amount != null;
      if (hasDesc || hasAmt) {
        if (!hasDesc) errs[`item${index}_description`] = 'Description is required';
        if (!hasAmt || Number(item.amount) <= 0) errs[`item${index}_amount`] = 'Valid amount is required';
        if (!item.quantity || item.quantity <= 0) errs[`item${index}_quantity`] = 'Valid quantity is required';
      }
    });
    return errs;
  };

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const errs = validateInvoiceForm();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const filledItems = invoiceData.invoiceItems.filter(
      (item) =>
        (item.description && item.description.toString().trim() !== '') ||
        (item.amount !== '' && item.amount != null && Number(item.amount) > 0)
    );

    if (filledItems.length === 0) {
      notify('No invoice items provided. Proceeding to utility readings.', 'info');
      setActiveStep(2);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/customer-onboarding-invoice`,
        { customerId, isSystemGenerated: false, invoiceItems: filledItems },
        { withCredentials: true }
      );
      notify(response.data.message || 'Invoice created successfully', 'success');
      setActiveStep(2);
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to create invoice. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipInvoice = () => { notify('Invoice creation skipped', 'info'); setActiveStep(2); };

  // ── Step 3 handlers ──
  const handleUtilityChange = (index, field, value) => {
    setUtilityReadings((prev) => {
      const readings = [...prev];
      readings[index] = { ...readings[index], [field]: value };
      return readings;
    });
    setErrors((prev) => ({ ...prev, [`reading${index}_${field}`]: '' }));
  };

  const handleAddReading = () => {
    setUtilityReadings((prev) => [...prev, { type: 'water', reading: '' }]);
  };

  const handleRemoveReading = (index) => {
    setUtilityReadings((prev) => prev.filter((_, i) => i !== index));
  };

  const validateUtilityReadings = () => {
    const errs = {};
    utilityReadings.forEach((r, i) => {
      if (r.reading && (isNaN(r.reading) || r.reading < 0))
        errs[`reading${i}_reading`] = 'Reading must be a non-negative number';
    });
    return errs;
  };

  const handleUtilitySubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const errs = validateUtilityReadings();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      let submitted = false;
      for (const r of utilityReadings) {
        if (r.reading && !isNaN(r.reading) && r.reading >= 0) {
          await axios.post(
            `${BASE_URL}/water-reading`,
            { unitId: formData.unitId, reading: parseFloat(r.reading) },
            { withCredentials: true }
          );
          submitted = true;
        }
      }
      notify(submitted ? 'Utility readings saved successfully' : 'No valid readings provided', 'success');
      setActiveStep(3);
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save utility readings. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipUtility = () => { notify('Utility readings skipped', 'info'); setActiveStep(3); };

  // ── Step 4 handler ──
  const handleConfirmation = () => {
    notify('Customer onboarding completed', 'success');
    setTimeout(() => navigate(`/customer-details/${customerId}`), 2000);
  };

  // ── Bulk upload handlers ──
  const handleBulkBuildingChange = (e) => setBulkBuildingId(e.target.value);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && !['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(selected.type)) {
      notify('Invalid file type. Please upload a CSV or Excel file.', 'error');
      return;
    }
    if (selected && selected.size > 5 * 1024 * 1024) {
      notify('File size exceeds 5MB limit.', 'error');
      return;
    }
    setFile(selected);
    setBulkErrors([]);
  };

  const handleTemplateDownload = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BASE_URL}/templates/customers.csv`, { credentials: 'include' });
      if (!response.ok) throw new Error('Template file not found');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customers.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      notify('Template downloaded successfully', 'success');
    } catch {
      notify('Failed to download template. Please contact support.', 'error');
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkBuildingId) { notify('Please select a building for bulk upload', 'error'); return; }
    if (!file) { notify('Please select a file to upload', 'error'); return; }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('buildingId', bulkBuildingId);

    setBulkLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/upload-customers-withbuildingId`, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      notify(response.data.message || 'Bulk upload completed successfully', 'success');
      if (response.data.errors?.length > 0) setBulkErrors(response.data.errors);
      setFile(null);
      setBulkBuildingId('');
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to upload customers. Please try again.', 'error');
      if (err.response?.data?.errors) setBulkErrors(err.response.data.errors);
    } finally {
      setBulkLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <CustomerForm
            formData={formData}
            errors={errors}
            loading={loading}
            buildings={buildings}
            buildingsLoading={buildingsLoading}
            units={units}
            unitsLoading={unitsLoading}
            selectedBuildingId={selectedBuildingId}
            onCustomerChange={handleCustomerChange}
            onBuildingChange={handleBuildingChange}
            onUnitChange={handleUnitChange}
            onCancel={() => navigate('/customers')}
            onSubmit={handleCustomerSubmit}
          />
        );
      case 1:
        return (
          <OnboardingInvoiceForm
            invoiceData={invoiceData}
            errors={errors}
            loading={loading}
            suggestedItems={suggestedItems}
            checkedSuggestions={checkedSuggestions}
            onToggleSuggestion={handleToggleSuggestion}
            onApplySuggestions={handleApplySuggestions}
            onInvoiceChange={handleInvoiceChange}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onBack={() => setActiveStep(0)}
            onSkip={handleSkipInvoice}
            onSubmit={handleInvoiceSubmit}
          />
        );
      case 2:
        return (
          <UtilityReadingsForm
            utilityReadings={utilityReadings}
            errors={errors}
            loading={loading}
            onUtilityChange={handleUtilityChange}
            onAddReading={handleAddReading}
            onRemoveReading={handleRemoveReading}
            onBack={() => setActiveStep(1)}
            onSkip={handleSkipUtility}
            onSubmit={handleUtilitySubmit}
          />
        );
      case 3:
        return (
          <OnboardingConfirmation
            onBack={() => setActiveStep(2)}
            onFinish={handleConfirmation}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', p: 3, ml: 5 }}>
      <Typography variant="h5" gutterBottom>
        <TitleComponent title="Add Tenant" />
      </Typography>

      <ErrorBoundary>
        <Paper sx={{ width: '80%', maxWidth: 900, p: 4, mx: 'auto', mt: 5 }}>
          <OnboardingStepper activeStep={activeStep} />
          {renderStep()}
          <Divider sx={{ my: 4 }} />
          <BulkUploadForm
            buildings={buildings}
            buildingsLoading={buildingsLoading}
            bulkBuildingId={bulkBuildingId}
            file={file}
            bulkLoading={bulkLoading}
            bulkErrors={bulkErrors}
            onBuildingChange={handleBulkBuildingChange}
            onFileChange={handleFileChange}
            onTemplateDownload={handleTemplateDownload}
            onSubmit={handleBulkUpload}
          />
        </Paper>
      </ErrorBoundary>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
