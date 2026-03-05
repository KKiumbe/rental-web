import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Chip,
  Tooltip,
  IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link } from "react-router-dom";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
} from "@mui/x-data-grid";
import VisibilityIcon          from "@mui/icons-material/Visibility";
import ReceiptIcon             from "@mui/icons-material/Receipt";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import WaterIcon               from "@mui/icons-material/Water";
import DescriptionIcon         from "@mui/icons-material/Description";
import { formatDate, statusChip } from "./helpers";

/* ─── Toolbar ───────────────────────────────────────────────────────────────── */
const CustomToolbar = () => (
  <GridToolbarContainer sx={{ px: 1, py: 0.5, gap: 0.5 }}>
    <GridToolbarColumnsButton />
    <GridToolbarFilterButton />
    <GridToolbarDensitySelector />
    <GridToolbarExport />
  </GridToolbarContainer>
);

/* ─── EmptyState ────────────────────────────────────────────────────────────── */
const EmptyState = ({ message }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      py: 6,
      gap: 1,
    }}
  >
    <DescriptionIcon sx={{ fontSize: 40, color: "action.disabled" }} />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);
EmptyState.propTypes = { message: PropTypes.string };

/* ─── CustomerDataTabs ──────────────────────────────────────────────────────── */
export default function CustomerDataTabs({ customer, tabIndex, onTabChange }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const blue   = theme.palette?.blueAccent?.main || "#1976d2";

  /* ── grid shared sx ─────────────────────────────────────────────────────── */
  const gridSx = {
    border: 0,
    "& .MuiDataGrid-columnHeaders": {
      backgroundColor: theme.palette.background.default,
      fontWeight: 700,
      fontSize: "0.78rem",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      borderBottom: "2px solid",
      borderColor: "divider",
    },
    "& .MuiDataGrid-row:hover": { backgroundColor: `${blue}1a` },
    "& .MuiDataGrid-cell": { borderColor: "divider", alignItems: "center" },
    "& .MuiDataGrid-footerContainer": { borderTop: "1px solid", borderColor: "divider" },
  };

  /* ── column definitions ──────────────────────────────────────────────────── */
  const invoiceColumns = [
    {
      field: "actions",
      headerName: "",
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (p) => (
        <Tooltip title="View Invoice">
          <IconButton component={Link} to={`/get-invoice/${p.row.id}`} size="small" sx={{ color: blue }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: "invoiceNumber",
      headerName: "Invoice #",
      width: 150,
      renderCell: (p) => (
        <Typography variant="body2" fontWeight={600}>
          {p.value}
        </Typography>
      ),
    },
    {
      field: "invoiceAmount",
      headerName: "Amount (Ksh)",
      width: 140,
      type: "number",
      renderCell: (p) => (
        <Typography variant="body2" fontWeight={600}>
          Ksh {Number(p.value || 0).toLocaleString()}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (p) => statusChip(p.value, isDark ? "dark" : "light"),
    },
    {
      field: "items",
      headerName: "Items",
      flex: 1,
      minWidth: 260,
      renderCell: (p) => (
        <Typography variant="caption" color="text.secondary" noWrap>
          {p.value?.map((i) => `${i.description} ×${i.quantity}`).join(" · ") || "—"}
        </Typography>
      ),
    },
    {
      field: "createdAt",
      headerName: "Date",
      width: 130,
      renderCell: (p) => (
        <Typography variant="body2" color="text.secondary">
          {formatDate(p.value)}
        </Typography>
      ),
    },
  ];

  const paymentColumns = [
    {
      field: "actions",
      headerName: "",
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (p) => (
        <Tooltip title="View Payment">
          <IconButton component={Link} to={`/payments/${p.row.id}`} size="small" sx={{ color: blue }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    { field: "paymentNumber",   headerName: "Payment #",       width: 150 },
    {
      field: "amount",
      headerName: "Amount (Ksh)",
      width: 140,
      type: "number",
      renderCell: (p) => (
        <Typography variant="body2" fontWeight={600}>
          Ksh {Number(p.value || 0).toLocaleString()}
        </Typography>
      ),
    },
    { field: "modeOfPayment",   headerName: "Payment Mode",    width: 150 },
    { field: "paidBy",          headerName: "Paid By",         width: 150 },
    { field: "transactionCode", headerName: "Transaction Code", width: 160 },
    {
      field: "createdAt",
      headerName: "Date",
      width: 130,
      renderCell: (p) => (
        <Typography variant="body2" color="text.secondary">
          {formatDate(p.value)}
        </Typography>
      ),
    },
  ];

  const waterColumns = [
    {
      field: "actions",
      headerName: "",
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (p) => (
        <Tooltip title="View Reading">
          <IconButton
            component={Link}
            to={`/water-reading/${p.row.id}`}
            size="small"
            sx={{ color: blue }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: "period",
      headerName: "Period",
      width: 130,
      renderCell: (p) => (
        <Typography variant="body2">
          {p.value
            ? new Date(p.value).toLocaleString("default", { year: "numeric", month: "short" })
            : "—"}
        </Typography>
      ),
    },
    { field: "reading",     headerName: "Reading (m³)",     width: 140 },
    { field: "consumption", headerName: "Consumption (m³)", width: 150 },
    {
      field: "abnormalReading",
      headerName: "Abnormal",
      width: 110,
      renderCell: (p) => {
        const isAbnormal = p.row.AbnormalWaterReading?.length > 0;
        return (
          <Chip
            label={isAbnormal ? "Yes" : "No"}
            size="small"
            sx={{
              bgcolor: isAbnormal
                ? (isDark ? "#4a1218" : "#fce4ec")
                : (isDark ? "#1b5e20" : "#e8f5e9"),
              color: isAbnormal
                ? (isDark ? "#ef9a9a" : "#c62828")
                : (isDark ? "#a5d6a7" : "#2e7d32"),
              fontWeight: 600,
              fontSize: "0.7rem",
            }}
          />
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Recorded",
      width: 130,
      renderCell: (p) => (
        <Typography variant="body2" color="text.secondary">
          {formatDate(p.value)}
        </Typography>
      ),
    },
  ];

  const gasColumns = [
    {
      field: "period",
      headerName: "Period",
      width: 130,
      renderCell: (p) => (
        <Typography variant="body2">
          {p.value
            ? new Date(p.value).toLocaleString("default", { year: "numeric", month: "short" })
            : "—"}
        </Typography>
      ),
    },
    { field: "consumption", headerName: "Consumption (m³)", width: 160 },
    {
      field: "createdAt",
      headerName: "Recorded",
      width: 130,
      renderCell: (p) => (
        <Typography variant="body2" color="text.secondary">
          {formatDate(p.value)}
        </Typography>
      ),
    },
  ];

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
      <Tabs
        value={tabIndex}
        onChange={(_, v) => onTabChange(v)}
        sx={{
          px: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          "& .MuiTab-root":     { fontWeight: 600, textTransform: "none", minHeight: 48 },
          "& .Mui-selected":    { color: blue },
          "& .MuiTabs-indicator": { backgroundColor: blue },
        }}
      >
        <Tab label="Invoices"        icon={<ReceiptIcon fontSize="small" />}              iconPosition="start" />
        <Tab label="Payments"        icon={<AccountBalanceWalletIcon fontSize="small" />} iconPosition="start" />
        <Tab label="Water Readings"  icon={<WaterIcon fontSize="small" />}                iconPosition="start" />
        <Tab label="Gas Consumption" icon={<DescriptionIcon fontSize="small" />}          iconPosition="start" />
      </Tabs>

      {/* Invoices */}
      <Box hidden={tabIndex !== 0} sx={{ p: 0 }}>
        {!customer.invoices?.length ? (
          <EmptyState message="No invoices found." />
        ) : (
          <DataGrid
            rows={customer.invoices.map((inv) => ({ ...inv, items: inv.InvoiceItem || [] }))}
            columns={invoiceColumns}
            getRowId={(r) => r.id}
            autoHeight
            density="comfortable"
            pageSizeOptions={[10, 25]}
            slots={{ toolbar: CustomToolbar }}
            sx={gridSx}
          />
        )}
      </Box>

      {/* Payments */}
      <Box hidden={tabIndex !== 1} sx={{ p: 0 }}>
        {!customer.payments?.length ? (
          <EmptyState message="No payment records found." />
        ) : (
          <DataGrid
            rows={customer.payments}
            columns={paymentColumns}
            getRowId={(r) => r.id}
            autoHeight
            density="comfortable"
            pageSizeOptions={[10, 25]}
            slots={{ toolbar: CustomToolbar }}
            sx={gridSx}
          />
        )}
      </Box>

      {/* Water */}
      <Box hidden={tabIndex !== 2} sx={{ p: 0 }}>
        {!customer.waterConsumptions?.length ? (
          <EmptyState message="No water readings found." />
        ) : (
          <DataGrid
            rows={customer.waterConsumptions}
            columns={waterColumns}
            getRowId={(r) => r.id}
            autoHeight
            density="comfortable"
            pageSizeOptions={[10, 25]}
            slots={{ toolbar: CustomToolbar }}
            sx={gridSx}
          />
        )}
      </Box>

      {/* Gas */}
      <Box hidden={tabIndex !== 3} sx={{ p: 0 }}>
        {!customer.gasConsumptions?.length ? (
          <EmptyState message="No gas consumption records found." />
        ) : (
          <DataGrid
            rows={customer.gasConsumptions}
            columns={gasColumns}
            getRowId={(r) => r.id}
            autoHeight
            density="comfortable"
            pageSizeOptions={[10, 25]}
            slots={{ toolbar: CustomToolbar }}
            sx={gridSx}
          />
        )}
      </Box>
    </Paper>
  );
}

CustomerDataTabs.propTypes = {
  customer:    PropTypes.object.isRequired,
  tabIndex:    PropTypes.number.isRequired,
  onTabChange: PropTypes.func.isRequired,
};
