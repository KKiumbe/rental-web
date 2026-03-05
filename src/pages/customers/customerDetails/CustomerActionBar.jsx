import PropTypes from "prop-types";
import { Box, Typography, Stack, Button, IconButton, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon         from "@mui/icons-material/ArrowBack";
import EditIcon              from "@mui/icons-material/Edit";
import DeleteIcon            from "@mui/icons-material/Delete";
import SmsIcon               from "@mui/icons-material/Sms";
import ReceiptIcon           from "@mui/icons-material/Receipt";
import DescriptionIcon       from "@mui/icons-material/Description";

export default function CustomerActionBar({
  customer,
  id,
  sending,
  selectedUnitId,
  onSmsOpen,
  onSendBill,
  onLeaseOpen,
  onDeleteOpen,
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const green = theme.palette?.greenAccent?.main || "#388e3c";
  const contrastText = theme.palette?.primary?.contrastText;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      {/* Back + title */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Tooltip title="Back">
          <IconButton
            onClick={() => navigate(-1)}
            size="small"
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            {customer.firstName} {customer.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Tenant Detail
          </Typography>
        </Box>
      </Box>

      {/* Actions */}
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button
          variant="outlined"
          size="small"
          startIcon={<SmsIcon />}
          onClick={onSmsOpen}
          disabled={sending || !customer.phoneNumber}
          sx={{
            fontWeight: 600,
            color: contrastText,
            borderColor: contrastText,
            "&:hover": { borderColor: contrastText, opacity: 0.85 },
          }}
        >
          SMS
        </Button>

        <Button
          variant="outlined"
          size="small"
          startIcon={<ReceiptIcon />}
          onClick={onSendBill}
          disabled={sending || !selectedUnitId}
          sx={{
            fontWeight: 600,
            color: contrastText,
            borderColor: contrastText,
            "&:hover": { borderColor: contrastText, opacity: 0.85 },
          }}
        >
          Send Invoice
        </Button>

        <Button
          variant="outlined"
          size="small"
          startIcon={<DescriptionIcon />}
          onClick={onLeaseOpen}
          disabled={sending || !customer.units?.length}
          sx={{
            fontWeight: 600,
            color: contrastText,
            borderColor: contrastText,
            "&:hover": { borderColor: contrastText, opacity: 0.85 },
          }}
        >
          Manage Lease
        </Button>

        <Button
          variant="contained"
          size="small"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/customer-edit/${id}`)}
          sx={{
            fontWeight: 600,
            bgcolor: green,
            color: "#fff",
            "&:hover": { bgcolor: theme.palette?.greenAccent?.dark || "#2e7d32" },
          }}
        >
          Edit
        </Button>

        <Button
          variant="contained"
          size="small"
          startIcon={<DeleteIcon />}
          color="error"
          onClick={onDeleteOpen}
          disabled={sending}
          sx={{ fontWeight: 600 }}
        >
          Delete
        </Button>
      </Stack>
    </Box>
  );
}

CustomerActionBar.propTypes = {
  customer: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  sending: PropTypes.bool.isRequired,
  selectedUnitId: PropTypes.string.isRequired,
  onSmsOpen: PropTypes.func.isRequired,
  onSendBill: PropTypes.func.isRequired,
  onLeaseOpen: PropTypes.func.isRequired,
  onDeleteOpen: PropTypes.func.isRequired,
};
