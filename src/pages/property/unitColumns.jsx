/**
 * getUnitColumns — returns column definitions for the Units DataGrid.
 */
import { Typography, Chip, Tooltip, IconButton, Button } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon       from '@mui/icons-material/Edit';
import PersonAddIcon  from '@mui/icons-material/PersonAdd';
import { STATUS_MAP, formatDate } from './propertyHelpers';

export const statusChip = (status) => {
  const s = STATUS_MAP[status] || { label: status, bg: '#f5f5f5', color: '#616161', border: '#e0e0e0' };
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{
        backgroundColor: s.bg,
        color:           s.color,
        border:          `1px solid ${s.border}`,
        fontWeight:      600,
        fontSize:        '0.7rem',
      }}
    />
  );
};

export function getUnitColumns({ theme, onView, onEdit, onAssign }) {
  return [
    {
      field: 'actions',
      headerName: '',
      width: 50,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="View Unit">
          <IconButton size="small" onClick={() => onView(params.row)}
            sx={{ color: theme?.palette?.blueAccent?.main }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: 'edit',
      headerName: '',
      width: 50,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Edit Unit">
          <IconButton size="small" onClick={() => onEdit(params.row)}
            sx={{ color: theme?.palette?.greenAccent?.main }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: 'assign',
      headerName: 'Assign',
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const occupied = params.row.status === 'OCCUPIED';
        return (
          <Tooltip title={occupied ? 'Unit is occupied' : 'Assign tenant'}>
            <span>
              <Button
                variant="contained"
                size="small"
                startIcon={<PersonAddIcon sx={{ fontSize: '14px !important' }} />}
                onClick={() => onAssign(params.row)}
                disabled={occupied}
                sx={{
                  fontSize: '0.7rem',
                  py: 0.4,
                  px: 1,
                  backgroundColor: occupied ? undefined : theme?.palette?.greenAccent?.main,
                  '&:hover': { backgroundColor: occupied ? undefined : theme?.palette?.greenAccent?.dark },
                }}
              >
                {occupied ? 'Occupied' : 'Assign'}
              </Button>
            </span>
          </Tooltip>
        );
      },
    },
    {
      field: 'unitNumber',
      headerName: 'Unit No.',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 160,
      renderCell: (params) => statusChip(params.value),
    },
    {
      field: 'monthlyCharge',
      headerName: 'Rent (Ksh)',
      width: 130,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500}>
          {Number(params.value).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'depositAmount',
      headerName: 'Deposit (Ksh)',
      width: 130,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2">{Number(params.value).toLocaleString()}</Typography>
      ),
    },
    {
      field: 'garbageCharge',
      headerName: 'Garbage (Ksh)',
      width: 130,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2">{params.value ? Number(params.value).toLocaleString() : '—'}</Typography>
      ),
    },
    {
      field: 'serviceCharge',
      headerName: 'Service (Ksh)',
      width: 130,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2">{params.value ? Number(params.value).toLocaleString() : '—'}</Typography>
      ),
    },
    {
      field: 'securityCharge',
      headerName: 'Security (Ksh)',
      width: 130,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2">{params.value ? Number(params.value).toLocaleString() : '—'}</Typography>
      ),
    },
    {
      field: 'amenitiesCharge',
      headerName: 'Amenities (Ksh)',
      width: 140,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2">{params.value ? Number(params.value).toLocaleString() : '—'}</Typography>
      ),
    },
    {
      field: 'backupGeneratorCharge',
      headerName: 'Generator (Ksh)',
      width: 140,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2">{params.value ? Number(params.value).toLocaleString() : '—'}</Typography>
      ),
    },
    {
      field: 'customerCount',
      headerName: 'Tenants',
      width: 90,
      type: 'number',
      renderCell: (params) => (
        <Chip label={params.value ?? 0} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 110,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">{formatDate(params.value)}</Typography>
      ),
    },
  ];
}
