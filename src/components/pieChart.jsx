import React, { useState, useEffect } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import { getTheme } from "../store/theme";


const PieChartComponent = ({ data, label, maxValue }) => {
  const theme = getTheme();
  const mainColor = theme.palette.greenAccent.main || "#ed6c02";
  const remainingColor = theme.palette.primary.light || "#e0e0e0";
  
  // State for animated value
  const [animatedValue, setAnimatedValue] = useState(0);
  
  // Animation effect
  useEffect(() => {
    let start = 0;
    const end = data;
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
    
    requestAnimationFrame(animate);
    
    // Cleanup
    return () => {};
  }, [data]);

  const remaining = maxValue - animatedValue;

  return (
    <PieChart
      series={[
        {
          data: [
            { id: 0, value: animatedValue, color: mainColor },
            { id: 1, value: remaining, color: remainingColor },
          ],
          innerRadius: 30,
          paddingAngle: 2,
          cornerRadius: 5,
          // Add animation properties
          animation: {
            easing: 'ease-out',
            duration: 1000
          }
        },
      ]}
      width={250}
      height={150}
      // Optional: Add chart-level animation
      slotProps={{
        legend: { hidden: true },
      }}
    />
  );
};

export default PieChartComponent;