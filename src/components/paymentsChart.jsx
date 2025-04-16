import React, { useState, useEffect } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import { Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";

const PaymentModesPieChart = () => {
  const theme = useTheme();
  const [animatedData, setAnimatedData] = useState([
    { id: 0, value: 0, label: "MPESA", color: theme.palette.greenAccent.main },
    { id: 1, value: 0, label: "CASH", color: theme.palette.primary.main },
    { id: 2, value: 0, label: "BANK CHEQUES", color: theme.palette.grey[500] },
  ]);

  // Dummy data: 90% MPESA, 5% CASH, 5% BANK CHEQUES (total 100)
  const finalData = [
    { id: 0, value: 90, label: "MPESA", color: theme.palette.greenAccent.main },
    { id: 1, value: 5, label: "CASH", color: theme.palette.primary.main },
    { id: 2, value: 5, label: "BANK CHEQUES", color: theme.palette.grey[500] },
  ];

  useEffect(() => {
    const duration = 1000; // Animation duration in milliseconds
    const steps = 60; // Number of animation steps (~60fps)
    const increment = finalData.map((data) => data.value / steps);

    let step = 0;

    const animate = () => {
      step += 1;
      if (step > steps) {
        setAnimatedData(finalData); // Set final values when done
        return;
      }

      setAnimatedData((prev) =>
        prev.map((item, index) => ({
          ...item,
          value: Math.min(item.value + increment[index], finalData[index].value),
        }))
      );

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} // Start scaled down
      animate={{ opacity: 1, scale: 1 }} // Scale up to full size
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 250,
          p: 2,
          borderRadius: 3,
          boxShadow: `0 6px 20px ${theme.palette.primary.dark}30`, // Dramatic shadow
          background: `linear-gradient(135deg, ${theme.palette.primary.light}10, ${theme.palette.background.paper})`, // Subtle gradient
        }}
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }} // Slide down from above
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: "bold",
              mb: 2,
              textShadow: `0 2px 4px ${theme.palette.grey[700]}50`,
            }}
          >
            Payment Modes
          </Typography>
        </motion.div>

        <PieChart
          series={[
            {
              data: animatedData,
              innerRadius: 30,
              paddingAngle: 2,
              cornerRadius: 5,
              highlightScope: { faded: "global", highlighted: "item" },
              faded: { innerRadius: 30, additionalRadius: -10, color: "gray" },
              // Disable labels on the chart itself
              label: false,
            },
          ]}
          width={250}
          height={150}
          slotProps={{
            legend: {
              hidden: true, // Hide the legend permanently
            },
          }}
          tooltip={{
            trigger: "item", // Show tooltip on hover
            formatter: (params) => {
              const { label, value } = params.data;
              return `${label}: ${value}%`; // Display label and percentage on hover
            },
          }}
        />
      </Box>
    </motion.div>
  );
};

export default PaymentModesPieChart;