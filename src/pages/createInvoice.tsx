import React, { useEffect, useState, useCallback } from "react";
import {
  TextField,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Typography,
  Autocomplete,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import TitleComponent from "../components/title";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/authStore";
import debounce from "lodash/debounce";

const CreateInvoice = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const darkMode = useThemeStore((state) => state.darkMode);
  const currentUser = useAuthStore((state) => state.currentUser);

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]); // List of invoice items
  const [newItem, setNewItem] = useState({ description: "", amount: "", quantity: "" }); // New item form
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPhoneSearch, setIsPhoneSearch] = useState(false);
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);

  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";

  // Debug theme
  useEffect(() => {
    console.log("Theme Mode:", theme.palette.mode);
    console.log("background.default:", theme.palette.background.default);
    console.log("background.paper:", theme.palette.background.paper);
  }, [theme, darkMode]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // Clean search query
  const cleanSearchQuery = (query) => query.replace(/\s*\([^)]+\)/g, "").trim();

  // Unified search handler
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const isPhoneNumber = /^\d+$/.test(query);

    try {
      const url = isPhoneNumber
        ? `${BASEURL}/search-customer-by-phone`
        : `${BASEURL}/search-customer-by-name`;
      const params = isPhoneNumber ? { phone: query } : { name: cleanSearchQuery(query) };

      if (isPhoneNumber && query.length < 10) {
        setSearchResults([]);
        return;
      }

      const response = await axios.get(url, { params, withCredentials: true });
      const results = isPhoneNumber
        ? [response.data]
        : Array.isArray(response.data) ? response.data : [];

      setSearchResults(results.length ? results : []);
      if (!results.length) {
        setSnackbar({
          open: true,
          message: isPhoneNumber ? "No customer found with that phone number" : "No customer found with that name",
          severity: "info",
        });
      }
    } catch (error) {
      console.error("Search error:", error.response || error);
      setSnackbar({
        open: true,
        message: error.response?.status === 404
          ? isPhoneNumber
            ? "No customer found with that phone number"
            : "No customer found with that name"
          : `Error searching customers: ${error.response?.data?.message || error.message}`,
        severity: "error",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced phone search
  const debouncedPhoneSearch = useCallback(
    debounce((query) => {
      if (isPhoneSearch) handleSearch(query);
    }, 500),
    [isPhoneSearch]
  );

  // Handle input change for search
  const handleInputChange = (e, value) => {
    const newValue = e ? e.target.value : value;
    setSearchQuery(newValue);
    setIsPhoneSearch(/^\d+$/.test(newValue));
    setSelectedCustomer(null);

    if (isPhoneSearch) {
      debouncedPhoneSearch(newValue);
    } else {
      handleSearch(newValue);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (event, newValue) => {
    setSelectedCustomer(newValue);
    if (!isPhoneSearch && newValue) {
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  // Handle new item form changes
  const handleNewItemChange = (field) => (e) => {
    setNewItem((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Add new invoice item
  const handleAddItem = () => {
    const { description, amount, quantity } = newItem;
    if (!description || !amount || !quantity) {
      setSnackbar({ open: true, message: "Please fill in all item fields", severity: "error" });
      return;
    }
    const parsedAmount = parseFloat(amount);
    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setSnackbar({ open: true, message: "Amount must be a positive number", severity: "error" });
      return;
    }
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setSnackbar({ open: true, message: "Quantity must be a positive integer", severity: "error" });
      return;
    }

    setInvoiceItems((prev) => [
      ...prev,
      {
        description,
        amount: parsedAmount,
        quantity: parsedQuantity,
      },
    ]);
    setNewItem({ description: "", amount: "", quantity: "" });
    setSnackbar({ open: true, message: "Item added successfully", severity: "success" });
  };

  // Remove invoice item
  const handleRemoveItem = (index) => {
    setInvoiceItems((prev) => prev.filter((_, i) => i !== index));
    setSnackbar({ open: true, message: "Item removed successfully", severity: "info" });
  };

  // Create invoice for a single customer
  const handleCreateInvoice = async () => {
    if (!selectedCustomer) {
      setSnackbar({ open: true, message: "Please select a customer", severity: "error" });
      return;
    }
    if (invoiceItems.length === 0 && !selectedCustomer.unitId) {
      setSnackbar({
        open: true,
        message: "At least one invoice item is required for customers without a unit",
        severity: "error",
      });
      return;
    }

    const invoiceData = {
      customerId: selectedCustomer.id,
      isSystemGenerated: false,
      invoiceItems: invoiceItems,
    };

    setLoading(true);
    try {
      const response = await axios.post(`${BASEURL}/create-invoice`, invoiceData, {
        withCredentials: true,
      });
      setSnackbar({ open: true, message: "Invoice created successfully!", severity: "success" });
      navigate(`/get-invoice/${response.data.data.id}`);
    } catch (error) {
      console.error("Error creating invoice:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to create invoice. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Open the generate invoices dialog
  const handleGenerateAllClick = () => {
    setOpenGenerateDialog(true);
  };

  // Generate invoices for all active customers
  const handleGenerateAllConfirm = async () => {
    setLoading(true);
    setOpenGenerateDialog(false);
    try {
      await axios.post(`${BASEURL}/generate-invoices-for-all`, {}, { withCredentials: true });
      setSnackbar({
        open: true,
        message: "Invoices generated successfully for all active customers!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error generating invoices for all:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to generate invoices. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Render search results for phone search
  const renderPhoneSearchResults = () =>
    searchResults.length > 0 ? (
      <Card sx={{ mt: 2, mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Search Results</Typography>
          {searchResults.map((customer) => (
            <Box
              key={customer.id}
              sx={{ p: 1, cursor: "pointer", "&:hover": { backgroundColor: theme.palette.grey[100] } }}
              onClick={() => setSelectedCustomer(customer)}
            >
              <Typography>{`${customer.firstName} ${customer.lastName} (${customer.phoneNumber})`}</Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    ) : (
      !isSearching &&
      searchQuery &&
      searchQuery.length >= 10 && (
        <Card sx={{ mt: 2, mb: 2 }}>
          <CardContent>
            <Typography variant="h6">Search Results</Typography>
            <Typography>No customer found with phone number: {searchQuery}</Typography>
          </CardContent>
        </Card>
      )
    );

  // Render selected customer
  const renderSelectedCustomer = () =>
    selectedCustomer && (
      <Card sx={{ mt: 2, mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Selected Customer</Typography>
          <Typography>Name: {`${selectedCustomer.firstName} ${selectedCustomer.lastName}`}</Typography>
          <Typography>Phone: {selectedCustomer.phoneNumber}</Typography>
          <Typography>Category: {selectedCustomer.category || "N/A"}</Typography>
          <Typography>Monthly Charge: {selectedCustomer.monthlyCharge || "N/A"}</Typography>
          <Typography>Closing Balance: {selectedCustomer.closingBalance || 0}</Typography>
          <Typography>Unit: {selectedCustomer.unitId ? "Assigned" : "Not Assigned"}</Typography>
        </CardContent>
      </Card>
    );

  // Render invoice items table
  const renderInvoiceItems = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6">Added Items</Typography>
      {invoiceItems.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoiceItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.amount.toFixed(2)}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{(item.amount * item.quantity).toFixed(2)}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleRemoveItem(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography>No items added yet. {selectedCustomer?.unitId ? "You can create an invoice without items for this customer." : "At least one item is required."}</Typography>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
       
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 0,
      }}
    >
      {/* Generate Invoices for All Button */}
      <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end", width: "100%", maxWidth: 600 }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleGenerateAllClick}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Generate Invoices for All Customers"}
        </Button>
      </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: 600, width: "100%" }}>
        <TitleComponent title="Create an Invoice" />

        {/* Search Input */}
        {isPhoneSearch ? (
          <TextField
            label="Search Customer by Phone"
            variant="outlined"
            value={searchQuery}
            onChange={handleInputChange}
            fullWidth
            disabled={isSearching}
            inputProps={{ maxLength: 15 }}
            sx={{ mb: 2 }}
          />
        ) : (
          <Autocomplete
            options={searchResults}
            getOptionLabel={(option) => `${option?.firstName} ${option?.lastName} (${option?.phoneNumber})`}
            onInputChange={handleInputChange}
            onChange={handleCustomerSelect}
            loading={isSearching}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Customer by Name"
                variant="outlined"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: isSearching ? <CircularProgress size={20} /> : params.InputProps.endAdornment,
                }}
              />
            )}
            sx={{ mb: 2 }}
          />
        )}

        {/* Phone Search Results */}
        {isPhoneSearch && renderPhoneSearchResults()}

        {/* Selected Customer */}
        {renderSelectedCustomer()}

        {/* Invoice Items Form */}
        {selectedCustomer && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Add Invoice Item</Typography>
            <TextField
              label="Description"
              value={newItem.description}
              onChange={handleNewItemChange("description")}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Amount"
              value={newItem.amount}
              onChange={handleNewItemChange("amount")}
              fullWidth
              margin="normal"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label="Quantity"
              value={newItem.quantity}
              onChange={handleNewItemChange("quantity")}
              fullWidth
              margin="normal"
              type="number"
              inputProps={{ min: 1, step: 1 }}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 1 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
              >
                Add
              </Button>
            </Box>

            {/* Added Items */}
            {renderInvoiceItems()}
          </Box>
        )}

        {/* Create Invoice Button */}
        {selectedCustomer && (
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateInvoice}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Create Invoice"}
            </Button>
          </Box>
        )}
      </Box>

      {/* Generate Invoices for All Confirmation Dialog */}
      <Dialog
        open={openGenerateDialog}
        onClose={() => setOpenGenerateDialog(false)}
        aria-labelledby="generate-dialog-title"
        aria-describedby="generate-dialog-description"
      >
        <DialogTitle id="generate-dialog-title">Confirm Generate Invoices</DialogTitle>
        <DialogContent>
          <DialogContentText id="generate-dialog-description">
            This action will create invoices for all active customers and update their balances. This cannot be undone. Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGenerateDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleGenerateAllConfirm} color="primary" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateInvoice;