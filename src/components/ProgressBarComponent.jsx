import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, LinearProgress } from "@mui/material";
import { motion } from "framer-motion";

const ProgressBarComponent = ({ data, label }) => {
  const theme = useTheme();
  const [animatedValue, setAnimatedValue] = useState(0);

  // Animate the progress value
  useEffect(() => {
    let start = 0;
    const end = data; // Assuming data is a percentage (0-100)
    const duration = 1000; // Animation duration in milliseconds
    const increment = end / (duration / 16); // ~60fps

    const animate = () => {
      start += increment;
      if (start >= end) {
        setAnimatedValue(end);
        return;
      }
      setAnimatedValue(start);
      requestAnimationFrame(animate);
    };

    // Start the animation
    const animationId = requestAnimationFrame(animate);

    // Cleanup to prevent memory leaks
    return () => cancelAnimationFrame(animationId);
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} // Start slightly scaled down
      animate={{ opacity: 1, scale: 1 }} // Scale up to full size
      transition={{ duration: 0.5, ease: "easeOut" }} // Smooth entrance
    >
      <Box
        sx={{
          p: 3,
          borderRadius: 3,
          boxShadow: `0 8px 32px ${theme.palette.primary.dark}40`,
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 200,
          border: `1px solid ${theme.palette.greenAccent.main}20`,
        }}
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }} // Slide down from above
          animate={{ y: 0, opacity: 1 }} // Settle into place
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }} // Staggered entry
        >
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.grey[100],
              fontWeight: "bold",
              mb: 2,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              textShadow: `0 2px 4px ${theme.palette.primary.dark}80`,
            }}
          >
            {label}
          </Typography>
        </motion.div>

        <Box
          sx={{
            width: "100%",
            mb: 2,
            position: "relative",
          }}
        >
          <LinearProgress
            variant="determinate"
            value={animatedValue} // Driven by animated state
            sx={{
              height: 12,
              borderRadius: 6,
              backgroundColor: `${theme.palette.greenAccent.main}99`,
              boxShadow: `inset 0 2px 8px ${theme.palette.primary.dark}80`,
              "& .MuiLinearProgress-bar": {
                background: `linear-gradient(to right, ${theme.palette.greenAccent.main}, ${theme.palette.greenAccent.light})`,
                boxShadow: `0 0 15px ${theme.palette.greenAccent.main}80`,
                transition: "none", // Animation handled by state updates
                borderRadius: 6,
              },
            }}
          />
          {/* Animated glowing overlay */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: `linear-gradient(to right, transparent, ${theme.palette.greenAccent.main}20, transparent)`,
              animation: "glow 2s infinite",
              pointerEvents: "none",
            }}
          />
        </Box>

        <motion.div
          initial={{ opacity: 0, y: 20 }} // Fade in from below
          animate={{ opacity: 1, y: 0 }} // Rise into position
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }} // Staggered entry
        >
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.greenAccent.light,
              fontWeight: "bold",
              textShadow: `0 1px 3px ${theme.palette.primary.dark}80`,
            }}
          >
            {Math.round(animatedValue)}
          </Typography>
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default ProgressBarComponent;

// Ensure this CSS is included in your project
