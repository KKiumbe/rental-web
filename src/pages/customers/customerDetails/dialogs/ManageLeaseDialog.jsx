import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Button,
  Typography,
  CircularProgress,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Box,
  Alert,
  TextField,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DescriptionIcon from "@mui/icons-material/Description";
import { formatDate } from "../helpers";

export default function ManageLeaseDialog({
  open,
  onClose,
  customer,
  sending,
  selectedUnitId,
  onUnitChange,
  leaseFile,
  setLeaseFile,
  onLeaseUpload,
  onLeaseDownload,
  openTerminateDialog,
  setOpenTerminateDialog,
  terminationReason,
  setTerminationReason,
  terminationDate,
  setTerminationDate,
  onConfirmTerminate,
}) {
  const theme = useTheme();
  const green = theme.palette?.greenAccent?.main || "#388e3c";

  const selectedUnit = customer?.units?.find((u) => u.id === selectedUnitId);

  return (
    <>
      {/* ── Main Manage Lease Dialog ──────────────────────────────────────── */}
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
          <DescriptionIcon color="action" fontSize="small" />
          <Typography variant="h6" fontWeight={700}>
            Manage Lease
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          {sending && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

          {/* Unit selector */}
          <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
            <InputLabel>Select Unit</InputLabel>
            <Select
              value={selectedUnitId}
              label="Select Unit"
              onChange={(e) => onUnitChange(e.target.value)}
              disabled={sending}
            >
              {customer?.units?.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  Unit {u.unitNumber} — {u.building?.name || "N/A"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* End Lease section */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              End Lease
            </Typography>
            {selectedUnit?.leaseFileUrl ? (
              <Alert
                severity="success"
                icon={<DescriptionIcon fontSize="inherit" />}
                sx={{ mb: 1.5, borderRadius: 1.5 }}
              >
                Lease document on file · Started {formatDate(selectedUnit?.leaseStartDate)}
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 1.5 }}>
                No lease document on file — you can still end the lease below.
              </Alert>
            )}
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Button
                variant="contained"
                color="error"
                onClick={() => setOpenTerminateDialog(true)}
                disabled={sending}
                sx={{ fontWeight: 600 }}
              >
                End Lease
              </Button>
              {selectedUnit?.leaseFileUrl && (
                <Button
                  variant="outlined"
                  startIcon={<DescriptionIcon />}
                  onClick={() => onLeaseDownload(selectedUnitId)}
                  disabled={sending}
                  sx={{ fontWeight: 600 }}
                >
                  Download Document
                </Button>
              )}
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Upload lease document */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
              {selectedUnit?.leaseFileUrl ? "Replace Lease Document" : "Upload Lease Document (optional)"}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
              PDF only · max 5 MB
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="outlined"
                component="label"
                size="small"
                sx={{ fontWeight: 600 }}
              >
                {leaseFile ? leaseFile.name : "Choose PDF…"}
                <input
                  type="file"
                  accept=".pdf"
                  hidden
                  onChange={(e) => setLeaseFile(e.target.files[0])}
                />
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={onLeaseUpload}
                disabled={sending || !leaseFile || !selectedUnitId}
                sx={{
                  bgcolor: green,
                  color: "#fff",
                  fontWeight: 600,
                  "&:hover": { bgcolor: theme.palette?.greenAccent?.dark || "#2e7d32" },
                }}
              >
                {sending ? (
                  <CircularProgress size={14} sx={{ color: "#fff" }} />
                ) : (
                  "Upload"
                )}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={onClose} disabled={sending}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── End Lease Confirm Dialog ───────────────────────────────────────── */}
      <Dialog
        open={openTerminateDialog}
        onClose={() => {
          setOpenTerminateDialog(false);
          setTerminationReason("");
          setTerminationDate("");
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            End Lease
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          {sending && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ending lease for Unit <strong>{selectedUnit?.unitNumber}</strong>
            {!selectedUnit?.leaseFileUrl && (
              <Box
                component="span"
                display="block"
                sx={{ mt: 0.5, color: "warning.main", fontSize: "0.8rem" }}
              >
                ⚠ No lease document on file — the lease will still be marked as ended.
              </Box>
            )}
          </Typography>
          <TextField
            fullWidth
            label="Vacate Date (optional)"
            type="date"
            value={terminationDate}
            onChange={(e) => setTerminationDate(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
            helperText="Leave blank to use today's date"
            disabled={sending}
          />
          <TextField
            fullWidth
            label="Reason (optional)"
            multiline
            rows={3}
            value={terminationReason}
            onChange={(e) => setTerminationReason(e.target.value)}
            size="small"
            placeholder="e.g. Tenant requested early exit, lease expired…"
            disabled={sending}
          />
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button
            onClick={() => {
              setOpenTerminateDialog(false);
              setTerminationReason("");
              setTerminationDate("");
            }}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={onConfirmTerminate}
            disabled={sending}
            sx={{ fontWeight: 600 }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

ManageLeaseDialog.propTypes = {
  open:                 PropTypes.bool.isRequired,
  onClose:              PropTypes.func.isRequired,
  customer:             PropTypes.object,
  sending:              PropTypes.bool.isRequired,
  selectedUnitId:       PropTypes.string.isRequired,
  onUnitChange:         PropTypes.func.isRequired,
  leaseFile:            PropTypes.object,
  setLeaseFile:         PropTypes.func.isRequired,
  onLeaseUpload:        PropTypes.func.isRequired,
  onLeaseDownload:      PropTypes.func.isRequired,
  openTerminateDialog:  PropTypes.bool.isRequired,
  setOpenTerminateDialog: PropTypes.func.isRequired,
  terminationReason:    PropTypes.string.isRequired,
  setTerminationReason: PropTypes.func.isRequired,
  terminationDate:      PropTypes.string.isRequired,
  setTerminationDate:   PropTypes.func.isRequired,
  onConfirmTerminate:   PropTypes.func.isRequired,
};
