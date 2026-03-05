import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Grid,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function CustomerForm({
  formData,
  errors,
  loading,
  buildings,
  buildingsLoading,
  units,
  unitsLoading,
  selectedBuildingId,
  onCustomerChange,
  onBuildingChange,
  onUnitChange,
  onCancel,
  onSubmit,
}) {
  const theme = useTheme();

  return (
    <form onSubmit={onSubmit}>
      <Grid container spacing={2}>
        {/* Building */}
        <Grid item xs={12}>
          <FormControl
            fullWidth
            variant="outlined"
            size="small"
            error={!!errors.buildingId}
            disabled={buildingsLoading}
          >
            <InputLabel>Building</InputLabel>
            <Select value={selectedBuildingId} onChange={onBuildingChange} label="Building">
              <MenuItem value="">
                <em>{buildingsLoading ? 'Loading...' : 'Select a building'}</em>
              </MenuItem>
              {buildings.map((building) => (
                <MenuItem key={building.id} value={building.id}>
                  {building.name} (Landlord: {building.landlord?.firstName || 'Unknown'})
                </MenuItem>
              ))}
            </Select>
            {errors.buildingId && (
              <Typography color="error" variant="caption">
                {errors.buildingId}
              </Typography>
            )}
          </FormControl>
        </Grid>

        {/* Unit */}
        <Grid item xs={12}>
          <FormControl
            fullWidth
            variant="outlined"
            size="small"
            error={!!errors.unitId}
            disabled={!selectedBuildingId || unitsLoading}
          >
            <InputLabel>Unit</InputLabel>
            <Select name="unitId" value={formData.unitId} onChange={onUnitChange} label="Unit">
              <MenuItem value="">
                <em>
                  {unitsLoading ? 'Loading...' : units.length === 0 ? 'No units available' : 'Select a unit'}
                </em>
              </MenuItem>
              {units.map((unit) => (
                <MenuItem
                  key={unit.id}
                  value={unit.id}
                  disabled={unit.status === 'OCCUPIED'}
                  sx={{
                    color: unit.status === 'OCCUPIED' ? 'text.disabled' : 'text.primary',
                    backgroundColor:
                      unit.status === 'OCCUPIED' ? 'action.disabledBackground' : 'inherit',
                    '&:hover': {
                      backgroundColor:
                        unit.status === 'OCCUPIED' ? 'action.disabledBackground' : 'action.hover',
                    },
                  }}
                >
                  {unit.unitNumber} {unit.status === 'OCCUPIED' ? '(Occupied)' : ''}
                </MenuItem>
              ))}
            </Select>
            {errors.unitId && (
              <Typography color="error" variant="caption">
                {errors.unitId}
              </Typography>
            )}
          </FormControl>
        </Grid>

        {/* Name */}
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={onCustomerChange}
            error={!!errors.firstName}
            helperText={errors.firstName}
            variant="outlined"
            size="small"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={onCustomerChange}
            error={!!errors.lastName}
            helperText={errors.lastName}
            variant="outlined"
            size="small"
          />
        </Grid>

        {/* Email */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            value={formData.email}
            onChange={onCustomerChange}
            error={!!errors.email}
            helperText={errors.email}
            variant="outlined"
            size="small"
          />
        </Grid>

        {/* Phone numbers */}
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Phone Number *"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={onCustomerChange}
            error={!!errors.phoneNumber}
            helperText={errors.phoneNumber}
            variant="outlined"
            size="small"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Secondary Phone Number"
            name="secondaryPhoneNumber"
            value={formData.secondaryPhoneNumber}
            onChange={onCustomerChange}
            error={!!errors.secondaryPhoneNumber}
            helperText={errors.secondaryPhoneNumber}
            variant="outlined"
            size="small"
          />
        </Grid>

        {/* National ID */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="National ID"
            name="nationalId"
            value={formData.nationalId}
            onChange={onCustomerChange}
            error={!!errors.nationalId}
            helperText={errors.nationalId}
            variant="outlined"
            size="small"
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          fullWidth
          sx={{ color: theme?.palette?.grey[300], borderColor: theme?.palette?.grey[300] }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          type="submit"
          fullWidth
          disabled={loading}
          sx={{ backgroundColor: theme?.palette?.greenAccent?.main, color: '#fff' }}
        >
          {loading ? 'Creating...' : 'Next: Create Invoice'}
        </Button>
      </Box>
    </form>
  );
}

CustomerForm.propTypes = {
  formData: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  buildings: PropTypes.array.isRequired,
  buildingsLoading: PropTypes.bool.isRequired,
  units: PropTypes.array.isRequired,
  unitsLoading: PropTypes.bool.isRequired,
  selectedBuildingId: PropTypes.string.isRequired,
  onCustomerChange: PropTypes.func.isRequired,
  onBuildingChange: PropTypes.func.isRequired,
  onUnitChange: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
