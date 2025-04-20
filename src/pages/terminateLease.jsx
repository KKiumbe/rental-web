import React, { useEffect, useState, Component } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  Stack,
  Alert,
  Snackbar,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { getTheme } from "../store/theme";

// Axios instance
const BASEURL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000/api'; // Updated to match backend URL
const api = axios.create({
  baseURL: BASEURL,
  withCredentials: true,
});

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          Error rendering page: {this.state.error?.message || "Unknown error"}
        </Alert>
      );
    }
    return this.props.children;
  }
}

const stages = [
  { label: "Termination Details", key: "DETAILS" },
  { label: "Media Upload", key: "MEDIA" },
  { label: "Record Damages", key: "DAMAGES" },
  { label: "Create Invoices", key: "INVOICES" },
  { label: "Mark Vacated", key: "VACATED" },
];

// Step 1: Termination Details Component
const DetailsStep = ({ form, setForm, errors, setErrors }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDateChange = (date) => {
    setForm((prev) => ({ ...prev, terminationDate: date }));
    setErrors((prev) => ({ ...prev, terminationDate: "" }));
  };

  return (
    <Box>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label="Termination Date"
          value={form.terminationDate}
          onChange={handleDateChange}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              margin="normal"
              error={!!errors.terminationDate}
              helperText={errors.terminationDate}
            />
          )}
          minDate={new Date()}
        />
      </LocalizationProvider>

      <TextField
        fullWidth
        label="Reason for Termination"
        name="reason"
        value={form.reason}
        onChange={handleChange}
        margin="normal"
        error={!!errors.reason}
        helperText={errors.reason}
        multiline
        rows={3}
      />

      <TextField
        fullWidth
        label="Additional Notes"
        name="notes"
        value={form.notes}
        onChange={handleChange}
        margin="normal"
        multiline
        rows={3}
      />
    </Box>
  );
};

// Step 2: Media Upload Component
const MediaUploadStep = ({ form, setForm, submitting, setSubmitting, setSnackbar }) => {
  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    setSubmitting(true);
    try {
      const uploadedMedia = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const response = await api.post("/upload-media", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          return {
            url: response.data.url,
            type: file.type.startsWith("image") ? "photo" : "video",
          };
        })
      );
      setForm((prev) => ({
        ...prev,
        media: [...prev.media, ...uploadedMedia],
      }));
      setSnackbar({ open: true, message: "Media uploaded successfully" });
    } catch (err) {
      console.error("Error uploading media:", err);
      setSnackbar({ open: true, message: "Failed to upload media." });
    } finally {
      setSubmitting(false);
      e.target.value = null;
    }
  };

  return (
    <Box>
      <Typography variant="body1" mb={2}>
        Upload photos or videos to document the condition of the house/unit.
      </Typography>
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleMediaUpload}
        disabled={submitting}
        style={{ marginBottom: "16px" }}
      />
      {form.media.length > 0 && (
        <List>
          {form.media.map((item, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <IconButton
                  edge="end"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      media: prev.media.filter((_, i) => i !== index),
                    }))
                  }
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText primary={`${item.type}: ${item.url}`} />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

// Step 3: Damages Component
const DamagesStep = ({ form, setForm, submitting, setSubmitting, errors, setErrors, setSnackbar }) => {
  const [damageForm, setDamageForm] = useState({ description: "", notes: "", media: [] });

  const handleDamageMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    setSubmitting(true);
    try {
      const uploadedMedia = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const response = await api.post("/upload-media", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          return {
            url: response.data.url,
            type: file.type.startsWith("image") ? "photo" : "video",
          };
        })
      );
      setDamageForm((prev) => ({
        ...prev,
        media: [...prev.media, ...uploadedMedia],
      }));
      setSnackbar({ open: true, message: "Media uploaded successfully" });
    } catch (err) {
      console.error("Error uploading damage media:", err);
      setSnackbar({ open: true, message: "Failed to upload media." });
    } finally {
      setSubmitting(false);
      e.target.value = null;
    }
  };

  const handleAddDamage = (description, notes, mediaFiles) => {
    setForm((prev) => ({
      ...prev,
      damages: [...prev.damages, { description, notes, media: mediaFiles || [] }],
    }));
  };

  const handleAddDamageSubmit = () => {
    if (!damageForm.description.trim()) {
      setErrors({ damageDescription: "Damage description is required" });
      return;
    }
    handleAddDamage(damageForm.description, damageForm.notes, damageForm.media);
    setDamageForm({ description: "", notes: "", media: [] });
    setErrors({});
    setSnackbar({ open: true, message: "Damage recorded successfully" });
  };

  return (
    <Box>
      <Typography variant="body1" mb={2}>
        Record any damages to the house/unit.
      </Typography>
      <TextField
        fullWidth
        label="Damage Description *"
        value={damageForm.description}
        onChange={(e) => setDamageForm((prev) => ({ ...prev, description: e.target.value }))}
        margin="normal"
        error={!!errors.damageDescription}
        helperText={errors.damageDescription}
      />
      <TextField
        fullWidth
        label="Notes"
        value={damageForm.notes}
        onChange={(e) => setDamageForm((prev) => ({ ...prev, notes: e.target.value }))}
        margin="normal"
        multiline
        rows={3}
      />
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleDamageMediaUpload}
        disabled={submitting}
        style={{ margin: "16px 0" }}
      />
      {damageForm.media.length > 0 && (
        <List>
          {damageForm.media.map((item, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <IconButton
                  edge="end"
                  onClick={() =>
                    setDamageForm((prev) => ({
                      ...prev,
                      media: prev.media.filter((_, i) => i !== index),
                    }))
                  }
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText primary={`${item.type}: ${item.url}`} />
            </ListItem>
          ))}
        </List>
      )}
      <Button
        variant="contained"
        onClick={handleAddDamageSubmit}
        disabled={submitting}
        sx={{ mt: 2 }}
      >
        Add Damage
      </Button>
      {form.damages.length > 0 && (
        <>
          <Typography variant="h6" mt={3}>
            Recorded Damages
          </Typography>
          <List>
            {form.damages.map((damage, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        damages: prev.damages.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={damage.description}
                  secondary={damage.notes || `${damage.media.length} media files`}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );
};

// Step 4: Invoices Component
const InvoicesStep = ({ form, setForm, submitting, setSubmitting, errors, setErrors, setSnackbar }) => {
  const [invoiceItemForm, setInvoiceItemForm] = useState({ description: "", amount: "", quantity: 1 });
  const [tempInvoiceItems, setTempInvoiceItems] = useState([]);
  const currentUser = useAuthStore((state) => state.currentUser);

  useEffect(() => {
    console.log("form.customerId in InvoicesStep:", form.customerId);
    console.log("currentUser in InvoicesStep:", currentUser);
  }, [form.customerId, currentUser]);

  const handleAddInvoiceItem = () => {
    const { description, amount, quantity } = invoiceItemForm;

    // Validate inputs
    if (!description.trim()) {
      setErrors({ invoiceDescription: "Invoice description is required" });
      return;
    }
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setErrors({ invoiceAmount: "Valid amount is required" });
      return;
    }
    if (quantity && (isNaN(quantity) || parseInt(quantity) <= 0)) {
      setErrors({ invoiceQuantity: "Valid quantity is required" });
      return;
    }

    // Add item to temporary list
    const newItem = { description, amount: parseFloat(amount), quantity: parseInt(quantity) || 1 };
    setTempInvoiceItems((prev) => [...prev, newItem]);
    console.log("Added invoice item:", newItem);
    setInvoiceItemForm({ description: "", amount: "", quantity: 1 });
    setErrors({});
  };

  const handleRemoveInvoiceItem = (index) => {
    setTempInvoiceItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddInvoice = async () => {
    // Validate customerId, invoice items, and currentUser
    if (!currentUser) {
      setErrors({ auth: "User not authenticated" });
      setSnackbar({ open: true, message: "Please log in to create an invoice." });
      return;
    }
    if (form.customerId.trim() === "") {
      setErrors({ customerId: "Customer ID is required" });
      setSnackbar({ open: true, message: "Customer ID is missing." });
      return;
    }
    if (tempInvoiceItems.length === 0) {
      setErrors({ invoiceItems: "At least one invoice item is required" });
      setSnackbar({ open: true, message: "Please add at least one invoice item." });
      return;
    }

    // Log the request body for debugging
    const requestBody = {
      customerId:  form.customerId,
      invoiceItems: tempInvoiceItems,
    };
    console.log("Sending request to /invoices:", requestBody);

    setSubmitting(true);
    try {
      const response = await api.post("/lease-terminate-invoice", requestBody);
      console.log("Invoice creation response:", response.data);

      setForm((prev) => ({
        ...prev,
        invoices: [...prev.invoices, ...tempInvoiceItems],
      }));
      setTempInvoiceItems([]);
      setSnackbar({ open: true, message: "Invoice created successfully" });
    } catch (err) {
      console.error("Error creating invoice:", err);
      console.log("Error response:", err.response?.data);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || "Failed to create invoice.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="body1" mb={2}>
        Create invoices for damages, to be paid against the customer’s deposit.
      </Typography>

      {/* Form to add individual invoice items */}
      <TextField
        fullWidth
        label="Invoice Item Description *"
        value={invoiceItemForm.description}
        onChange={(e) =>
          setInvoiceItemForm((prev) => ({ ...prev, description: e.target.value }))
        }
        margin="normal"
        error={!!errors.invoiceDescription}
        helperText={errors.invoiceDescription}
      />
      <TextField
        fullWidth
        label="Amount *"
        type="number"
        value={invoiceItemForm.amount}
        onChange={(e) =>
          setInvoiceItemForm((prev) => ({ ...prev, amount: e.target.value }))
        }
        margin="normal"
        error={!!errors.invoiceAmount}
        helperText={errors.invoiceAmount}
      />
      <TextField
        fullWidth
        label="Quantity"
        type="number"
        value={invoiceItemForm.quantity}
        onChange={(e) =>
          setInvoiceItemForm((prev) => ({ ...prev, quantity: e.target.value }))
        }
        margin="normal"
        error={!!errors.invoiceQuantity}
        helperText={errors.invoiceQuantity || "Default is 1"}
      />
      <Button
        variant="contained"
        onClick={handleAddInvoiceItem}
        disabled={submitting}
        sx={{ mt: 2, mr: 2 }}
      >
        Add Item
      </Button>
      <Button
        variant="contained"
        onClick={handleAddInvoice}
        disabled={submitting || tempInvoiceItems.length === 0}
        sx={{ mt: 2 }}
      >
        Create Invoice
      </Button>

      {/* Display temporary invoice items */}
      {tempInvoiceItems.length > 0 && (
        <>
          <Typography variant="h6" mt={3}>
            Invoice Items to Create
          </Typography>
          <List>
            {tempInvoiceItems.map((item, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveInvoiceItem(index)}
                    disabled={submitting}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={item.description}
                  secondary={`Amount: ${item.amount} | Quantity: ${item.quantity}`}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* Display created invoices */}
      {form.invoices.length > 0 && (
        <>
          <Typography variant="h6" mt={3}>
            Created Invoices
          </Typography>
          <List>
            {form.invoices.map((invoice, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        invoices: prev.invoices.filter((_, i) => i !== index),
                      }))
                    }
                    disabled={submitting}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={invoice.description}
                  secondary={`Amount: ${invoice.amount} | Quantity: ${invoice.quantity || 1}`}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* Display errors */}
      {(errors.customerId || errors.invoiceItems || errors.auth) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors.customerId || errors.invoiceItems || errors.auth}
        </Alert>
      )}
    </Box>
  );
};

// Step 5: Vacated Component
const VacatedStep = ({ form }) => (
  <Box>
    <Typography variant="body1" mb={2}>
      Confirm that the customer has vacated the unit. This will finalize the lease termination.
    </Typography>
    <Typography variant="body2" mb={2}>
      <strong>Summary:</strong>
      <br />
      Termination Date: {form.terminationDate ? new Date(form.terminationDate).toLocaleDateString() : "N/A"}
      <br />
      Reason: {form.reason || "N/A"}
      <br />
      Media Files: {form.media.length}
      <br />
      Damages Recorded: {form.damages.length}
      <br />
      Invoices Created: {form.invoices.length} (Total: {form.invoices.reduce((sum, inv) => sum + inv.amount, 0)})
    </Typography>
  </Box>
);

// Main TerminateLease Component
const TerminateLease = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const theme = getTheme();

  const [customer, setCustomer] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState({
    customerId: id,
    terminationDate: null,
    reason: "",
    notes: "",
    media: [],
    damages: [],
    invoices: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  // Validate id and log customerId and currentUser
  useEffect(() => {
    if (!id) {
      setError("Invalid customer ID.");
      setLoading(false);
    }
    console.log("Current form.customerId:", form.customerId);
    console.log("Current user:", currentUser);
  }, [id, form.customerId, currentUser]);

  // Fetch customer and saved progress
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setError("User not authenticated.");
        setLoading(false);
        return;
      }

      try {
        const [customerResponse, progressResponse] = await Promise.all([
          api.get(`/customer-details/${id}`),
          api.get(`/lease-termination-progress/${id}`),
        ]);
        console.log("Customer response:", customerResponse.data);
        setCustomer(customerResponse.data);
        const progress = progressResponse.data;
        if (progress && Object.keys(progress).length > 0) {
          setForm({
            customerId: id,
            terminationDate: progress.terminationDate ? new Date(progress.terminationDate) : null,
            reason: progress.reason || "",
            notes: progress.notes || "",
            media: progress.media || [],
            damages: progress.damages || [],
            invoices: progress.invoices || [],
          });
          const stepIndex = stages.findIndex((stage) => stage.key === progress.stage);
          setActiveStep(stepIndex !== -1 ? stepIndex : 0);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, currentUser]);

  // Save progress when changing stages
  const saveProgress = async (newStep) => {
    if (!currentUser) {
      setSnackbar({ open: true, message: "User not authenticated." });
      return;
    }

    try {
      await api.post(`/lease-termination-progress/${id}`, {
        customerId: id,
        stage: stages[newStep].key,
        terminationDate: form.terminationDate?.toISOString(),
        reason: form.reason,
        notes: form.notes,
        media: form.media,
        damages: form.damages,
        invoices: form.invoices,
      });
    } catch (err) {
      console.error("Error saving progress:", err);
      setError(err.response?.data?.message || "Failed to save progress.");
      setSnackbar({ open: true, message: "Failed to save progress." });
    }
  };

  // Validate form (only for Stage 1 if not skipped)
  const validateForm = () => {
    const newErrors = {};
    if (activeStep === 0 && form.terminationDate && !form.reason.trim()) {
      newErrors.reason = "Reason is required if termination date is provided";
    }
    return newErrors;
  };

  // Handle next step
  const handleNext = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const newStep = activeStep + 1;
    await saveProgress(newStep);
    setActiveStep(newStep);
  };

  // Handle previous step
  const handleBackStep = async () => {
    const newStep = activeStep - 1;
    await saveProgress(newStep);
    setActiveStep(newStep);
  };

  // Handle skip step
  const handleSkip = async () => {
    const newStep = activeStep + 1;
    await saveProgress(newStep);
    setActiveStep(newStep);
  };

  // Handle final submission
  const handleSubmit = async () => {
    if (!currentUser) {
      setSnackbar({ open: true, message: "User not authenticated." });
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/terminate-lease/${id}`, {
        customerId: id,
        terminationDate: form.terminationDate?.toISOString(),
        reason: form.reason,
        notes: form.notes,
        media: form.media,
        damages: form.damages,
        invoices: form.invoices,
      });

      setSnackbar({ open: true, message: "Lease terminated successfully" });
      setTimeout(() => {
        navigate(`/customer-details/${id}`);
      }, 2000);
    } catch (err) {
      console.error("Error finalizing termination:", err);
      setError(err.response?.data?.message || "Failed to terminate lease.");
      setSnackbar({ open: true, message: "Failed to terminate lease." });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(`/customer/${id}`);
  };

  // Handle Snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ open: false, message: "" });
  };

  return (
    <ErrorBoundary>
      <Container sx={{ py: 4, transition: "margin 0.3s ease-in-out" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ color: theme.palette.greenAccent.main, mr: 2 }}>
            <ArrowBackIcon sx={{ fontSize: 30 }} />
          </IconButton>
          <Typography variant="h4">
            Terminate Lease{customer ? ` for ${customer.fullName}` : ""}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
            <CircularProgress color="primary" size={50} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.includes("prisma") ? "Server error occurred. Please contact support." : error}
          </Alert>
        ) : (
          customer && (
            <Box sx={{ p: 3, bgcolor: "background.paper", borderRadius: 2, boxShadow: 1, maxWidth: 800 }}>
              <Typography variant="h6" mb={2}>
                End Lease Process
              </Typography>
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {stages.map((stage) => (
                  <Step key={stage.key}>
                    <StepLabel>{stage.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {activeStep === 0 && (
                <DetailsStep form={form} setForm={setForm} errors={errors} setErrors={setErrors} />
              )}
              {activeStep === 1 && (
                <MediaUploadStep
                  form={form}
                  setForm={setForm}
                  submitting={submitting}
                  setSubmitting={setSubmitting}
                  setSnackbar={setSnackbar}
                />
              )}
              {activeStep === 2 && (
                <DamagesStep
                  form={form}
                  setForm={setForm}
                  submitting={submitting}
                  setSubmitting={setSubmitting}
                  errors={errors}
                  setErrors={setErrors}
                  setSnackbar={setSnackbar}
                />
              )}
              {activeStep === 3 && (
                <InvoicesStep
                  form={form}
                  setForm={setForm}
                  submitting={submitting}
                  setSubmitting={setSubmitting}
                  errors={errors}
                  setErrors={setErrors}
                  setSnackbar={setSnackbar}
                />
              )}
              {activeStep === 4 && <VacatedStep form={form} />}

              <Stack direction="row" spacing={2} mt={3} justifyContent="space-between">
                <Stack direction="row" spacing={2}>
                  {activeStep > 0 && (
                    <Button
                      variant="outlined"
                      sx={{ color: theme.palette.grey[300], borderColor: theme.palette.grey[300] }}
                      onClick={handleBackStep}
                      disabled={submitting}
                    >
                      Previous
                    </Button>
                  )}
                  {activeStep < stages.length - 1 && (
                    <>
                      <Button
                        variant="contained"
                        sx={{ backgroundColor: theme.palette.greenAccent.main }}
                        onClick={handleNext}
                        disabled={submitting}
                      >
                        Next
                      </Button>
                      <Button
                        variant="outlined"
                        sx={{ color: theme.palette.grey[300], borderColor: theme.palette.grey[300] }}
                        onClick={handleSkip}
                        disabled={submitting}
                      >
                        Skip
                      </Button>
                    </>
                  )}
                  {activeStep === stages.length - 1 && (
                    <Button
                      variant="contained"
                      sx={{ backgroundColor: theme.palette.greenAccent.main }}
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : "Mark Vacated"}
                    </Button>
                  )}
                </Stack>
                <Button
                  variant="outlined"
                  sx={{ color: theme.palette.grey[300], borderColor: theme.palette.grey[300] }}
                  onClick={handleBack}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </Stack>
            </Box>
          )
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          message={snackbar.message}
        />
      </Container>
    </ErrorBoundary>
  );
};

export default TerminateLease;