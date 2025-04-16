import React, { useState, useEffect } from "react";
import { Typography, Box } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import { motion } from "framer-motion";
import { getTheme } from "../store/theme";

const TotalCustomersDisplay = ({ data }) => {
  const theme = getTheme();
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = data;
    const duration = 1500;
    const increment = end / (duration / 16);

    const animate = () => {
      start += increment;
      if (start >= end) {
        setAnimatedValue(end);
        return;
      }
      setAnimatedValue(Math.floor(start));
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
          width: "100%",
          bgcolor: theme.palette.primary.light,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <PeopleIcon
            sx={{
              fontSize: 60,
              color: theme.palette.greenAccent.main,
              mb: 2,
            }}
          />
        </motion.div>

        <Typography
          variant="h3"
          sx={{
            color: theme.palette.primary.contrastText,
            
            mb: 1,
          }}
        >
          {animatedValue.toLocaleString()}
        </Typography>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              color: theme.palette.primary.contrastText,
              mb: 2,
            }}
          >
           Customers
          </Typography>
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default TotalCustomersDisplay;