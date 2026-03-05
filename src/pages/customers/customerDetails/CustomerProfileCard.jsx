import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Avatar,
  Chip,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DescriptionIcon       from "@mui/icons-material/Description";
import PersonIcon            from "@mui/icons-material/Person";
import HomeIcon              from "@mui/icons-material/Home";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { formatDate, getInitials, statusChip } from "./helpers";

/* ─── InfoRow ───────────────────────────────────────────────────────────────── */
const InfoRow = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600}>
      {value || "—"}
    </Typography>
  </Box>
);
InfoRow.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

/* ─── CustomerProfileCard ───────────────────────────────────────────────────── */
export default function CustomerProfileCard({
  customer,
  isDark,
  sending,
  onActivateOpen,
  onLeaseDownload,
}) {
  const theme = useTheme();
  const blue  = theme.palette?.blueAccent?.main  || "#1976d2";
  const green = theme.palette?.greenAccent?.main || "#388e3c";

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        bgcolor: theme.palette.background.paper,
      }}
    >
      {/* ── Card header ───────────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          flexWrap: "wrap",
        }}
      >
        <Avatar sx={{ bgcolor: blue, width: 52, height: 52, fontSize: "1.2rem", fontWeight: 700 }}>
          {getInitials(customer.firstName, customer.lastName)}
        </Avatar>

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="h6" fontWeight={700}>
              {customer.firstName} {customer.lastName}
            </Typography>
            {statusChip(customer.status, isDark ? "dark" : "light")}
            {customer.status === "PENDING" && (
              <Tooltip title="Activate tenant">
                <IconButton size="small" onClick={onActivateOpen} sx={{ color: green }}>
                  <CheckCircleOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {customer.email || "No email on file"}
          </Typography>
        </Box>

        <Box sx={{ textAlign: "right" }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Outstanding Balance
          </Typography>
          <Typography
            variant="h6"
            fontWeight={700}
            color={(customer.closingBalance || 0) > 0 ? "error.main" : "success.main"}
          >
            Ksh {Number(customer.closingBalance || 0).toLocaleString()}
          </Typography>
        </Box>
      </Box>

      {/* ── Contact + Units ────────────────────────────────────────────────── */}
      <Box sx={{ p: 2.5 }}>
        <Grid container spacing={3}>
          {/* Contact */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <PersonIcon fontSize="small" sx={{ color: blue }} />
              <Typography variant="overline" fontWeight={700} color="text.secondary">
                Contact
              </Typography>
            </Box>
            <Stack spacing={1.5}>
              <InfoRow label="Phone"           value={customer.phoneNumber} />
              <InfoRow label="Secondary Phone" value={customer.secondaryPhoneNumber} />
              <InfoRow label="Email"           value={customer.email} />
              <InfoRow label="National ID"     value={customer.nationalId} />
            </Stack>
          </Grid>

          {/* Units */}
          <Grid item xs={12} sm={6} md={9}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <HomeIcon fontSize="small" sx={{ color: green }} />
              <Typography variant="overline" fontWeight={700} color="text.secondary">
                {customer.units?.length > 1 ? "Units" : "Unit"}
              </Typography>
            </Box>

            {customer.units?.length > 0 ? (
              <Grid container spacing={2}>
                {customer.units.map((unit) => (
                  <Grid item xs={12} sm={6} md={4} key={unit.id}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2" fontWeight={700}>
                          Unit {unit.unitNumber}
                        </Typography>
                        <Chip
                          label={unit.status}
                          size="small"
                          sx={{
                            bgcolor:
                              unit.status === "OCCUPIED"
                                ? (isDark ? "#1b5e20" : "#e8f5e9")
                                : (isDark ? "#0d2744" : "#e3f2fd"),
                            color:
                              unit.status === "OCCUPIED"
                                ? (isDark ? "#a5d6a7" : "#2e7d32")
                                : (isDark ? "#90caf9" : "#1565c0"),
                            fontWeight: 600,
                            fontSize: "0.68rem",
                          }}
                        />
                      </Box>
                      <Stack spacing={0.8}>
                        <InfoRow label="Building"    value={unit.building?.name} />
                        <InfoRow label="Rent"        value={unit.monthlyCharge ? `Ksh ${Number(unit.monthlyCharge).toLocaleString()}` : undefined} />
                        <InfoRow label="Unit Type"   value={unit.unitType?.replace(/_/g, " ")} />
                        <InfoRow label="Lease Start" value={formatDate(unit.leaseStartDate)} />
                        <InfoRow label="Lease End"   value={formatDate(unit.leaseEndDate)} />
                      </Stack>
                      {unit.leaseFileUrl && (
                        <Button
                          size="small"
                          startIcon={<DescriptionIcon />}
                          onClick={() => onLeaseDownload(unit.id)}
                          disabled={sending}
                          sx={{ mt: 1.5, color: green, fontWeight: 600, p: 0, textTransform: "none" }}
                        >
                          Download Lease
                        </Button>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No unit assigned.
              </Typography>
            )}
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}

CustomerProfileCard.propTypes = {
  customer: PropTypes.object.isRequired,
  isDark: PropTypes.bool.isRequired,
  sending: PropTypes.bool.isRequired,
  onActivateOpen: PropTypes.func.isRequired,
  onLeaseDownload: PropTypes.func.isRequired,
};
