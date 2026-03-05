import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme } from '@mui/material/styles';

export default function UtilityReadingsForm({
  utilityReadings,
  errors,
  loading,
  onUtilityChange,
  onAddReading,
  onRemoveReading,
  onBack,
  onSkip,
  onSubmit,
}) {
  const theme = useTheme();

  return (
    <form onSubmit={onSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6">Initial Utility Readings (Optional)</Typography>
          <Typography variant="caption" color="textSecondary">
            Enter initial utility readings if applicable. You can skip this step if no readings are
            available.
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Utility Type</TableCell>
                  <TableCell>Reading</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {utilityReadings.map((reading, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <FormControl fullWidth variant="outlined" size="small">
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={reading.type}
                          onChange={(e) => onUtilityChange(index, 'type', e.target.value)}
                          label="Type"
                        >
                          <MenuItem value="water">Water</MenuItem>
                          <MenuItem value="gas">Gas</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        type="number"
                        value={reading.reading}
                        onChange={(e) => onUtilityChange(index, 'reading', e.target.value)}
                        error={!!errors[`reading${index}_reading`]}
                        helperText={errors[`reading${index}_reading`]}
                        variant="outlined"
                        size="small"
                        inputProps={{ step: '0.01' }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => onRemoveReading(index)}
                        disabled={utilityReadings.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button startIcon={<AddIcon />} onClick={onAddReading} sx={{ mt: 2 }}>
            Add Reading
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
          {loading ? 'Saving...' : 'Next: Confirmation'}
        </Button>
      </Box>
    </form>
  );
}

UtilityReadingsForm.propTypes = {
  utilityReadings: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      reading: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ).isRequired,
  errors: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  onUtilityChange: PropTypes.func.isRequired,
  onAddReading: PropTypes.func.isRequired,
  onRemoveReading: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
