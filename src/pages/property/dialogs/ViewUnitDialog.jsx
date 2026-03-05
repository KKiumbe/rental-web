import PropTypes from 'prop-types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Button, Grid, Typography, Box, IconButton, CircularProgress,
} from '@mui/material';
import EditIcon        from '@mui/icons-material/Edit';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import CloseIcon       from '@mui/icons-material/Close';
import { statusChip }  from '../unitColumns';
import { formatDate }  from '../propertyHelpers';

export default function ViewUnitDialog({
  open,
  loading,
  unit,
  onClose,
  onSwitchToEdit,
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
          <MeetingRoomIcon color="action" />
          <Typography variant="h6" fontWeight={700}>Unit Details</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : unit ? (
          <Grid container spacing={2}>
            {[
              { label: 'Unit Number',      value: unit.unitNumber },
              { label: 'Status',           value: statusChip(unit.status) },
              { label: 'Monthly Rent',     value: `Ksh ${Number(unit.monthlyCharge || 0).toLocaleString()}` },
              { label: 'Deposit',          value: `Ksh ${Number(unit.depositAmount || 0).toLocaleString()}` },
              { label: 'Garbage Charge',   value: unit.garbageCharge   ? `Ksh ${Number(unit.garbageCharge).toLocaleString()}`   : '—' },
              { label: 'Service Charge',   value: unit.serviceCharge   ? `Ksh ${Number(unit.serviceCharge).toLocaleString()}`   : '—' },
              { label: 'Security Charge',  value: unit.securityCharge  ? `Ksh ${Number(unit.securityCharge).toLocaleString()}`  : '—' },
              { label: 'Amenities Charge', value: unit.amenitiesCharge ? `Ksh ${Number(unit.amenitiesCharge).toLocaleString()}` : '—' },
              { label: 'Generator Charge', value: unit.backupGeneratorCharge ? `Ksh ${Number(unit.backupGeneratorCharge).toLocaleString()}` : '—' },
              { label: 'Created',          value: formatDate(unit.createdAt) },
            ].map(({ label, value }) => (
              <Grid item xs={6} key={label}>
                <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                <Typography variant="body2" fontWeight={600} component="div">{value}</Typography>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography color="text.secondary">No unit selected.</Typography>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={onSwitchToEdit}
          disabled={loading || !unit}
        >
          Edit
        </Button>
        <Button onClick={onClose} variant="contained" disableElevation>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

ViewUnitDialog.propTypes = {
  open:          PropTypes.bool.isRequired,
  loading:       PropTypes.bool.isRequired,
  unit:          PropTypes.object,
  onClose:       PropTypes.func.isRequired,
  onSwitchToEdit:PropTypes.func.isRequired,
};
