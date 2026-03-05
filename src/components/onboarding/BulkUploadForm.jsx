import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useTheme } from '@mui/material/styles';

export default function BulkUploadForm({
  buildings,
  buildingsLoading,
  bulkBuildingId,
  file,
  bulkLoading,
  bulkErrors,
  onBuildingChange,
  onFileChange,
  onTemplateDownload,
  onSubmit,
}) {
  const theme = useTheme();

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Bulk Upload Customers
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2" component="div">
          <strong>Required Fields and Formats:</strong>
          <ul>
            <li>
              <strong>phoneNumber</strong> (Required): 10-15 digits, optionally starting with +
              (e.g., 0722324076 or +254722324076). Rows with missing or duplicate phone numbers are
              skipped.
            </li>
            <li>
              <strong>unitNumber</strong> (Required): Unique unit identifier (e.g., A101, Unit-1).
              Must not already exist for the selected building.
            </li>
            <li>
              <strong>firstName</strong> (Optional): Customer&apos;s first name. At least one of
              firstName or lastName is required.
            </li>
            <li>
              <strong>lastName</strong> (Optional): Customer&apos;s last name. If firstName is
              missing, lastName is used for both.
            </li>
            <li>
              <strong>email</strong> (Optional): Valid email format (e.g., john.doe@example.com).
            </li>
            <li>
              <strong>closingBalance</strong> (Optional): Non-negative number for initial balance
              (e.g., 1000.50).
            </li>
          </ul>
          <strong>Accepted File Formats:</strong> CSV or Excel (.csv, .xlsx).
          <br />
          <Button
            variant="text"
            onClick={onTemplateDownload}
            sx={{ padding: 0, textTransform: 'none', color: theme?.palette?.primary?.contrastText }}
          >
            Download Sample CSV Template
          </Button>
        </Typography>
      </Alert>

      <form onSubmit={onSubmit}>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Building</InputLabel>
              <Select
                value={bulkBuildingId}
                onChange={onBuildingChange}
                label="Building"
                disabled={buildingsLoading || bulkLoading}
              >
                <MenuItem value="">
                  <em>{buildingsLoading ? 'Loading...' : 'Select a building'}</em>
                </MenuItem>
                {buildings.map((building) => (
                  <MenuItem key={building.id} value={building.id}>
                    {building.name} (Landlord: {building.landlord?.firstName || 'Unknown'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadFileIcon />}
              fullWidth
              disabled={bulkLoading}
              sx={{ backgroundColor: theme?.palette?.greenAccent?.main, color: '#fff' }}
            >
              {file ? file.name : 'Choose File'}
              <input type="file" hidden accept=".csv,.xlsx" onChange={onFileChange} />
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              type="submit"
              fullWidth
              disabled={bulkLoading || !file || !bulkBuildingId}
              sx={{ backgroundColor: theme?.palette?.greenAccent?.main, color: '#fff' }}
            >
              {bulkLoading ? <CircularProgress size={24} color="inherit" /> : 'Upload Customers'}
            </Button>
          </Grid>
        </Grid>
      </form>

      {bulkErrors.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" color="error">
            Upload Errors
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Row</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bulkErrors.map((error, index) => (
                  <TableRow key={index}>
                    <TableCell>{error.row}</TableCell>
                    <TableCell>{error.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}

BulkUploadForm.propTypes = {
  buildings: PropTypes.array.isRequired,
  buildingsLoading: PropTypes.bool.isRequired,
  bulkBuildingId: PropTypes.string.isRequired,
  file: PropTypes.object,
  bulkLoading: PropTypes.bool.isRequired,
  bulkErrors: PropTypes.array.isRequired,
  onBuildingChange: PropTypes.func.isRequired,
  onFileChange: PropTypes.func.isRequired,
  onTemplateDownload: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
