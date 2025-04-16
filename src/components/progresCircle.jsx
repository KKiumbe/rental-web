import React from "react";
import { CircularProgress, Typography, Box } from "@mui/material";
import { getTheme } from "../store/theme";

const ProgressCircleComponent = ({ data, maxValue, label }) => {
  const theme = getTheme();
  const percentage = maxValue > 0 ? (data / maxValue) * 100 : 0;

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        m: 2,
        p: 3,
        borderRadius: "50%",
        boxShadow: 4,
        background: `radial-gradient(circle, ${theme.palette.primary.dark}, ${theme.palette.primary.light})`,
        width: 150,
        height: 150,
      }}
    >
      {/* Outer Progress Circle */}
      <CircularProgress
        variant="determinate"
        value={100}
        size={120}
        thickness={6}
        sx={{ color: theme.palette.grey[300], position: "absolute", opacity: 0.2 }}
      />

      {/* Inner Progress Circle */}
      <CircularProgress
        variant="determinate"
        value={percentage}
        size={120}
        thickness={6}
        sx={{ color: theme.palette.greenAccent.main }}
      />

      {/* Centered Text */}
      <Box
        sx={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: "bold",
            color: theme.palette.greenAccent.main,
          }}
        >
          {`${Math.round(percentage)}%`}
        </Typography>
        {label && (
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
          >
            {label}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ProgressCircleComponent;
