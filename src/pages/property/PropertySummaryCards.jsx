import PropTypes from 'prop-types';
import { Box, Typography, Paper } from '@mui/material';
import ApartmentIcon         from '@mui/icons-material/Apartment';
import MeetingRoomIcon       from '@mui/icons-material/MeetingRoom';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PeopleAltIcon         from '@mui/icons-material/PeopleAlt';

const StatCard = ({ icon, label, value, color, theme }) => (
  <Paper
    elevation={0}
    sx={{
      flex: 1,
      minWidth: 160,
      p: 2.5,
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      bgcolor: theme?.palette?.background?.paper,
    }}
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${color}18`,
        color,
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  </Paper>
);

StatCard.propTypes = {
  icon:  PropTypes.node,
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  color: PropTypes.string,
  theme: PropTypes.object,
};

/* ─── PropertySummaryCards ──────────────────────────────────────────────────── */
export default function PropertySummaryCards({
  totalBuildings,
  totalUnits,
  totalOccupied,
  occupancyRate,
  theme,
}) {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <StatCard
        icon={<ApartmentIcon />}
        label="Total Properties"
        value={totalBuildings}
        color={theme?.palette?.blueAccent?.main || '#1976d2'}
        theme={theme}
      />
      <StatCard
        icon={<MeetingRoomIcon />}
        label="Total Units"
        value={totalUnits}
        color="#7b1fa2"
        theme={theme}
      />
      <StatCard
        icon={<CheckCircleOutlineIcon />}
        label="Occupied Units"
        value={totalOccupied}
        color={theme?.palette?.greenAccent?.main || '#388e3c'}
        theme={theme}
      />
      <StatCard
        icon={<PeopleAltIcon />}
        label="Occupancy Rate"
        value={`${occupancyRate}%`}
        color="#f57c00"
        theme={theme}
      />
    </Box>
  );
}

PropertySummaryCards.propTypes = {
  totalBuildings: PropTypes.number.isRequired,
  totalUnits:     PropTypes.number.isRequired,
  totalOccupied:  PropTypes.number.isRequired,
  occupancyRate:  PropTypes.number.isRequired,
  theme:          PropTypes.object,
};
