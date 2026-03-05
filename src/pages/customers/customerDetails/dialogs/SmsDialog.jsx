import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Button,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SmsIcon from "@mui/icons-material/Sms";

export default function SmsDialog({
  open,
  onClose,
  customer,
  smsMessage,
  setSmsMessage,
  sending,
  onSend,
}) {
  const theme = useTheme();
  const blue  = theme.palette?.blueAccent?.main || "#1976d2";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
        <SmsIcon color="action" fontSize="small" />
        <Typography variant="h6" fontWeight={700}>
          Send SMS
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          To: {customer?.phoneNumber}
        </Typography>
        <TextField
          fullWidth
          label="Message"
          multiline
          rows={4}
          value={smsMessage}
          onChange={(e) => setSmsMessage(e.target.value)}
          size="small"
        />
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} disabled={sending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSend}
          disabled={sending || !smsMessage.trim()}
          sx={{
            bgcolor: blue,
            color: "#fff",
            fontWeight: 600,
            "&:hover": { bgcolor: theme.palette?.blueAccent?.dark || "#1565c0" },
          }}
        >
          {sending ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Send"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

SmsDialog.propTypes = {
  open:        PropTypes.bool.isRequired,
  onClose:     PropTypes.func.isRequired,
  customer:    PropTypes.object,
  smsMessage:  PropTypes.string.isRequired,
  setSmsMessage: PropTypes.func.isRequired,
  sending:     PropTypes.bool.isRequired,
  onSend:      PropTypes.func.isRequired,
};
