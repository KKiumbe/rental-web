import PropTypes from 'prop-types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Button, TextField, Typography, Box, Paper, Chip,
  IconButton, CircularProgress, InputAdornment,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SearchIcon    from '@mui/icons-material/Search';
import CloseIcon     from '@mui/icons-material/Close';

export default function AssignUnitDialog({
  open,
  unit,
  customerSearchQuery,
  onSearchQueryChange,
  customerSearchResults,
  isSearching,
  assignmentLoading,
  onClose,
  onAssign,
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
          <PersonAddIcon color="action" />
          <Typography variant="h6" fontWeight={700}>
            Assign Unit {unit?.unitNumber}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        {/* Current tenants */}
        {unit?.customers?.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              fontWeight={700}
              display="block"
              sx={{ mb: 1 }}
            >
              Current Tenants
            </Typography>
            {unit.customers.map((c) => (
              <Paper
                key={c.id}
                variant="outlined"
                sx={{ p: 1.5, mb: 1, borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}
              >
                <PeopleAltIcon color="action" fontSize="small" />
                <Box>
                  <Typography variant="body2" fontWeight={600}>{c.firstName} {c.lastName}</Typography>
                  <Typography variant="caption" color="text.secondary">{c.phoneNumber}</Typography>
                </Box>
              </Paper>
            ))}
            <Divider sx={{ my: 2 }} />
          </Box>
        )}

        {/* Search */}
        <Typography
          variant="overline"
          color="text.secondary"
          fontWeight={700}
          display="block"
          sx={{ mb: 1.5 }}
        >
          Search &amp; Assign Tenant
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by name or phone number…"
          value={customerSearchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {isSearching
                  ? <CircularProgress size={16} />
                  : <SearchIcon fontSize="small" color="action" />}
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Results */}
        {customerSearchResults.length > 0 && (
          <Box sx={{ maxHeight: 280, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {customerSearchResults.map((customer) => {
              const alreadyAssigned = unit?.customers?.some((c) => c.id === customer.id);
              return (
                <Paper
                  key={customer.id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    borderColor: alreadyAssigned ? 'error.main' : 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PeopleAltIcon color="action" fontSize="small" />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {customer.firstName} {customer.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{customer.phoneNumber}</Typography>
                    </Box>
                  </Box>
                  {alreadyAssigned ? (
                    <Chip label="Assigned" size="small" color="error" variant="outlined" />
                  ) : (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => onAssign(customer.id)}
                      disabled={assignmentLoading}
                      sx={{
                        backgroundColor: theme?.palette?.greenAccent?.main,
                        color: '#fff',
                        fontWeight: 600,
                        '&:hover': { backgroundColor: theme?.palette?.greenAccent?.dark },
                      }}
                    >
                      {assignmentLoading
                        ? <CircularProgress size={14} sx={{ color: '#fff' }} />
                        : 'Assign'}
                    </Button>
                  )}
                </Paper>
              );
            })}
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} variant="contained" disableElevation disabled={assignmentLoading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

AssignUnitDialog.propTypes = {
  open:                  PropTypes.bool.isRequired,
  unit:                  PropTypes.object,
  customerSearchQuery:   PropTypes.string.isRequired,
  onSearchQueryChange:   PropTypes.func.isRequired,
  customerSearchResults: PropTypes.array.isRequired,
  isSearching:           PropTypes.bool.isRequired,
  assignmentLoading:     PropTypes.bool.isRequired,
  onClose:               PropTypes.func.isRequired,
  onAssign:              PropTypes.func.isRequired,
  theme:                 PropTypes.object,
};
