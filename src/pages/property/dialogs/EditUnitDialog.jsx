import PropTypes from 'prop-types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Button, Grid, TextField, FormControl, InputLabel, Select,
  MenuItem, Typography, Box, IconButton, CircularProgress,
} from '@mui/material';
import EditIcon   from '@mui/icons-material/Edit';
import CloseIcon  from '@mui/icons-material/Close';

const CHARGE_FIELDS = [
  { label: 'Monthly Charge (Ksh)',       name: 'monthlyCharge' },
  { label: 'Deposit Amount (Ksh)',        name: 'depositAmount' },
  { label: 'Water Deposit Amount (Ksh)', name: 'waterDepositAmount' },
  { label: 'Garbage Charge (Ksh)',       name: 'garbageCharge' },
  { label: 'Service Charge (Ksh)',       name: 'serviceCharge' },
  { label: 'Security Charge (Ksh)',      name: 'securityCharge' },
  { label: 'Amenities Charge (Ksh)',     name: 'amenitiesCharge' },
  { label: 'Generator Charge (Ksh)',     name: 'backupGeneratorCharge' },
];

export default function EditUnitDialog({
  open,
  loading,
  formData,
  onClose,
  onChange,
  onSubmit,
  theme,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="action" />
          <Typography variant="h6" fontWeight={700}>Edit Unit</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Unit Number"
              name="unitNumber"
              value={formData.unitNumber}
              onChange={onChange}
              required
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select name="status" value={formData.status} onChange={onChange} label="Status">
                <MenuItem value="VACANT">Vacant</MenuItem>
                <MenuItem value="OCCUPIED">Occupied</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                <MenuItem value="OCCUPIED_PENDING_PAYMENT">Occupied Pending Payment</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {CHARGE_FIELDS.map(({ label, name }) => (
            <Grid item xs={12} sm={6} key={name}>
              <TextField
                label={label}
                name={name}
                type="number"
                value={formData[name]}
                onChange={onChange}
                fullWidth
                size="small"
                inputProps={{ min: 0 }}
              />
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disableElevation
          disabled={loading}
          sx={{
            backgroundColor: theme?.palette?.greenAccent?.main,
            color: '#fff',
            fontWeight: 600,
            '&:hover': { backgroundColor: theme?.palette?.greenAccent?.dark },
          }}
        >
          {loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

EditUnitDialog.propTypes = {
  open:     PropTypes.bool.isRequired,
  loading:  PropTypes.bool.isRequired,
  formData: PropTypes.object.isRequired,
  onClose:  PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  theme:    PropTypes.object,
};
