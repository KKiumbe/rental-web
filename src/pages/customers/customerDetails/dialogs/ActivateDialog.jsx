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
import { useTheme } from "@mui/material/styles";

export default function ActivateDialog({
  open,
  onClose,
  customer,
  sending,
  onActivate,
  title = "Activate Tenant",
  bodyText,
}) {
  const theme = useTheme();
  const green = theme.palette?.greenAccent?.main || "#388e3c";

  const defaultBody = (
    <>
      Activate{" "}
      <strong>
        {customer?.firstName} {customer?.lastName}
      </strong>
      ? Ensure rent and deposit invoices have been paid.
    </>
  );

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
          {title}
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        <DialogContentText>
          {bodyText ?? defaultBody}
        </DialogContentText>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} disabled={sending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onActivate}
          disabled={sending}
          sx={{
            bgcolor: green,
            color: "#fff",
            fontWeight: 600,
            "&:hover": { bgcolor: theme.palette?.greenAccent?.dark || "#2e7d32" },
          }}
        >
          {sending ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Activate"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ActivateDialog.propTypes = {
  open:       PropTypes.bool.isRequired,
  onClose:    PropTypes.func.isRequired,
  customer:   PropTypes.object,
  sending:    PropTypes.bool.isRequired,
  onActivate: PropTypes.func.isRequired,
  title:      PropTypes.string,
  bodyText:   PropTypes.node,
};
