import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";

export default function DeleteDialog({ open, onClose, customer, sending, onDelete }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>
          Delete Tenant
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        <DialogContentText>
          Are you sure you want to delete{" "}
          <strong>
            {customer?.firstName} {customer?.lastName}
          </strong>
          ? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} disabled={sending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onDelete}
          disabled={sending}
          sx={{ fontWeight: 600 }}
        >
          {sending ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

DeleteDialog.propTypes = {
  open:     PropTypes.bool.isRequired,
  onClose:  PropTypes.func.isRequired,
  customer: PropTypes.object,
  sending:  PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
};
