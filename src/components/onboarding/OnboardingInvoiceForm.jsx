import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme } from '@mui/material/styles';

export default function OnboardingInvoiceForm({
  invoiceData,
  errors,
  loading,
  suggestedItems,
  checkedSuggestions,
  onToggleSuggestion,
  onApplySuggestions,
  onInvoiceChange,
  onAddItem,
  onRemoveItem,
  onBack,
  onSkip,
  onSubmit,
}) {
  const theme = useTheme();

  return (
    <form onSubmit={onSubmit}>
      <Grid container spacing={2}>
        {/* ── Suggested onboarding items panel ── */}
        {suggestedItems.length > 0 && (
          <Grid item xs={12}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 1,
                borderColor: theme?.palette?.greenAccent?.main || 'primary.main',
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Suggested Onboarding Items
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1.5 }}>
                Select the charges to include in this onboarding invoice, then click &quot;Apply
                Selected Items&quot;.
              </Typography>
              <Grid container spacing={1}>
                {suggestedItems.map((item, i) => (
                  <Grid item xs={12} sm={6} key={i}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!checkedSuggestions[i]}
                          onChange={() => onToggleSuggestion(i)}
                          size="small"
                          sx={{ color: theme?.palette?.greenAccent?.main }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">{item.description}</Typography>
                          <Chip
                            label={`KES ${Number(item.amount).toLocaleString()}`}
                            size="small"
                            sx={{
                              bgcolor: theme?.palette?.greenAccent?.main || 'success.main',
                              color: '#fff',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
              <Button
                variant="contained"
                size="small"
                onClick={onApplySuggestions}
                sx={{
                  mt: 2,
                  backgroundColor: theme?.palette?.greenAccent?.main || 'success.main',
                  color: '#fff',
                  '&:hover': { opacity: 0.9 },
                }}
              >
                Apply Selected Items
              </Button>
            </Paper>
          </Grid>
        )}

        {/* ── Manual invoice items table ── */}
        <Grid item xs={12}>
          <Typography variant="h6">Billable Items (Optional)</Typography>
          <Typography variant="caption" color="textSecondary">
            Add invoice items if applicable. You can skip this step if no invoice is needed.
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
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
                {invoiceData.invoiceItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={item.description}
                        onChange={(e) => onInvoiceChange(index, 'description', e.target.value)}
                        error={!!errors[`item${index}_description`]}
                        helperText={errors[`item${index}_description`]}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        type="number"
                        value={item.amount}
                        onChange={(e) =>
                          onInvoiceChange(index, 'amount', parseFloat(e.target.value))
                        }
                        error={!!errors[`item${index}_amount`]}
                        helperText={errors[`item${index}_amount`]}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          onInvoiceChange(index, 'quantity', parseInt(e.target.value))
                        }
                        error={!!errors[`item${index}_quantity`]}
                        helperText={errors[`item${index}_quantity`]}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {item.amount && item.quantity
                        ? `KES ${(item.amount * item.quantity).toFixed(2)}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => onRemoveItem(index)}
                        disabled={invoiceData.invoiceItems.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button
            startIcon={<AddIcon />}
            onClick={onAddItem}
            sx={{ mt: 2, bgcolor: theme?.palette?.greenAccent?.main }}
          >
            Add Item
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          fullWidth
          sx={{ color: theme?.palette?.grey[300], borderColor: theme?.palette?.grey[300] }}
        >
          Back
        </Button>
        <Button
          variant="outlined"
          onClick={onSkip}
          fullWidth
          sx={{ color: theme?.palette?.grey[300], borderColor: theme?.palette?.grey[300] }}
        >
          Skip
        </Button>
        <Button
          variant="contained"
          type="submit"
          fullWidth
          disabled={loading}
          sx={{ backgroundColor: theme?.palette?.greenAccent?.main, color: '#fff' }}
        >
          {loading ? 'Creating...' : 'Next: Utility Readings'}
        </Button>
      </Box>
    </form>
  );
}

OnboardingInvoiceForm.propTypes = {
  invoiceData: PropTypes.shape({
    invoiceItems: PropTypes.arrayOf(
      PropTypes.shape({
        description: PropTypes.string,
        amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        quantity: PropTypes.number,
      })
    ).isRequired,
  }).isRequired,
  errors: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  suggestedItems: PropTypes.array.isRequired,
  checkedSuggestions: PropTypes.object.isRequired,
  onToggleSuggestion: PropTypes.func.isRequired,
  onApplySuggestions: PropTypes.func.isRequired,
  onInvoiceChange: PropTypes.func.isRequired,
  onAddItem: PropTypes.func.isRequired,
  onRemoveItem: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
