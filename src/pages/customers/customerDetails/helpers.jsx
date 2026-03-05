import { Chip } from "@mui/material";

/* ─── date formatter ──────────────────────────────────────────────────────── */
export const formatDate = (val) => {
  if (!val) return "—";
  try {
    const d = new Date(val);
    return `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("default", {
      month: "short",
    })} ${d.getFullYear()}`;
  } catch {
    return "—";
  }
};

/* ─── initials ────────────────────────────────────────────────────────────── */
export const getInitials = (f = "", l = "") =>
  `${f[0] || ""}${l[0] || ""}`.toUpperCase() || "?";

/* ─── status chip ─────────────────────────────────────────────────────────── */
const STATUS_STYLE = {
  ACTIVE:     { label: "Active",     lightBg: "#e8f5e9", lightColor: "#2e7d32", darkBg: "#1b5e20", darkColor: "#a5d6a7" },
  INACTIVE:   { label: "Inactive",   lightBg: "#fff8e1", lightColor: "#f57f17", darkBg: "#4e342e", darkColor: "#ffcc02" },
  TERMINATED: { label: "Terminated", lightBg: "#fce4ec", lightColor: "#c62828", darkBg: "#4a1218", darkColor: "#ef9a9a" },
  PENDING:    { label: "Pending",    lightBg: "#e3f2fd", lightColor: "#1565c0", darkBg: "#0d2744", darkColor: "#90caf9" },
};

export const statusChip = (value, mode = "light") => {
  const s = STATUS_STYLE[value];
  const bg    = s ? (mode === "dark" ? s.darkBg    : s.lightBg)    : (mode === "dark" ? "#2a2a2a" : "#f5f5f5");
  const color = s ? (mode === "dark" ? s.darkColor  : s.lightColor) : (mode === "dark" ? "#bbb"    : "#616161");
  const label = s?.label || value || "Unknown";
  return (
    <Chip
      label={label}
      size="small"
      sx={{ backgroundColor: bg, color, fontWeight: 600, fontSize: "0.7rem", border: "none" }}
    />
  );
};
