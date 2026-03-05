/**
 * useBuildingColumns — returns column definitions for the Buildings DataGrid.
 * Pure function; pass theme + callbacks so nothing is closed over implicitly.
 */
import { Box, Typography, Chip, Tooltip, IconButton } from '@mui/material';
import { Link } from 'react-router-dom';
import VisibilityIcon  from '@mui/icons-material/Visibility';
import EditIcon        from '@mui/icons-material/Edit';
import ApartmentIcon   from '@mui/icons-material/Apartment';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PeopleAltIcon   from '@mui/icons-material/PeopleAlt';
import { formatDate }  from './propertyHelpers';

export function getBuildingColumns({ theme, selectedBuildingId, onLoadUnits }) {
  return [
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Building Details">
            <IconButton
              component={Link}
              to={`/building-details/${params.row.id}`}
              size="small"
              onClick={(e) => e.stopPropagation()}
              sx={{ color: theme?.palette?.blueAccent?.main }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Building">
            <IconButton
              component={Link}
              to={`/edit-building/${params.row.id}`}
              size="small"
              onClick={(e) => e.stopPropagation()}
              sx={{ color: theme?.palette?.greenAccent?.main }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Load Units Below">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onLoadUnits(params.row); }}
              sx={{
                color: selectedBuildingId === params.row.id
                  ? '#fff'
                  : theme?.palette?.grey?.[500],
                backgroundColor: selectedBuildingId === params.row.id
                  ? theme?.palette?.greenAccent?.main
                  : 'transparent',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: `${theme?.palette?.greenAccent?.main}22`,
                  color: theme?.palette?.greenAccent?.main,
                },
              }}
            >
              <MeetingRoomIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'name',
      headerName: 'Building Name',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ApartmentIcon fontSize="small" sx={{ color: theme?.palette?.blueAccent?.main, flexShrink: 0 }} />
          <Typography variant="body2" fontWeight={600} noWrap>{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'address',
      headerName: 'Address',
      flex: 1.5,
      minWidth: 160,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" noWrap>{params.value || '—'}</Typography>
      ),
    },
    {
      field: 'landlord',
      headerName: 'Landlord',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleAltIcon fontSize="small" sx={{ color: theme?.palette?.grey?.[500], flexShrink: 0 }} />
          <Typography variant="body2" noWrap>{params.value || '—'}</Typography>
        </Box>
      ),
    },
    {
      field: 'unitCount',
      headerName: 'Total Units',
      width: 110,
      type: 'number',
      renderCell: (params) => (
        <Chip
          icon={<MeetingRoomIcon sx={{ fontSize: '14px !important' }} />}
          label={params.value ?? 0}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600, borderColor: theme?.palette?.blueAccent?.main, color: theme?.palette?.blueAccent?.main }}
        />
      ),
    },
    {
      field: 'occupiedUnits',
      headerName: 'Occupied',
      width: 100,
      type: 'number',
      renderCell: (params) => (
        <Chip
          label={params.value ?? 0}
          size="small"
          sx={{
            fontWeight: 600,
            backgroundColor: params.value > 0 ? '#e8f5e9' : '#fafafa',
            color:           params.value > 0 ? '#2e7d32' : theme?.palette?.grey?.[500],
            border:          `1px solid ${params.value > 0 ? '#a5d6a7' : '#e0e0e0'}`,
          }}
        />
      ),
    },
    {
      field: 'waterRate',
      headerName: 'Water Rate',
      width: 120,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value ? `Ksh ${Number(params.value).toLocaleString()}` : '—'}
        </Typography>
      ),
    },
    {
      field: 'gasRate',
      headerName: 'Gas Rate',
      width: 110,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value ? `Ksh ${Number(params.value).toLocaleString()}` : '—'}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">{formatDate(params.value)}</Typography>
      ),
    },
  ];
}
