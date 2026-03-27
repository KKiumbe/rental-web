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
import ReceiptIcon from "@mui/icons-material/Receipt";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { addMonths } from "date-fns";

export default function SendBillDialog({
  open,
  onClose,
  customer,
  sending,
  onSend,
  selectedPeriod,
  setSelectedPeriod,
}) {
  const theme = useTheme();
  const green = theme.palette?.greenAccent?.main || "#388e3c";
  const maxDate = addMonths(new Date(), 1);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
        <ReceiptIcon color="action" fontSize="small" />
        <Typography variant="h6" fontWeight={700}>
          Send Invoice
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          To: {customer?.firstName} {customer?.lastName} &nbsp;·&nbsp; {customer?.phoneNumber}
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            views={["year", "month"]}
            label="Billing Period"
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            maxDate={maxDate}
            slotProps={{
              textField: {
                fullWidth: true,
                size: "small",
                helperText: "Select the month to bill for (next month allowed)",
              },
            }}
          />
        </LocalizationProvider>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} disabled={sending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSend}
          disabled={sending || !selectedPeriod}
          startIcon={sending ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <ReceiptIcon />}
          sx={{
            bgcolor: green,
            color: "#fff",
            fontWeight: 600,
            "&:hover": { bgcolor: theme.palette?.greenAccent?.dark || "#2e7d32" },
          }}
        >
          {sending ? "Sending…" : "Send Bill"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

SendBillDialog.propTypes = {
  open:            PropTypes.bool.isRequired,
  onClose:         PropTypes.func.isRequired,
  customer:        PropTypes.object,
  sending:         PropTypes.bool.isRequired,
  onSend:          PropTypes.func.isRequired,
  selectedPeriod:  PropTypes.instanceOf(Date),
  setSelectedPeriod: PropTypes.func.isRequired,
};
