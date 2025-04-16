import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, Divider } from "@mui/material";
import { motion } from "framer-motion";

const LastPayments = ({ payments }) => {
  const theme = useTheme();
  const [animatedPayments, setAnimatedPayments] = useState([]);

  // Limit to last 5 payments
  const limitedPayments = payments.slice(0, 5);

  // Animate payments appearing one by one with amount animation
  useEffect(() => {
    let delay = 0;
    const animated = limitedPayments.map((payment, index) => {
      delay += 300; // Stagger each payment by 300ms
      return { ...payment, animatedAmount: 0, delay };
    });
    setAnimatedPayments(animated);

    animated.forEach((payment, index) => {
      let start = 0;
      const end = payment.amount;
      const duration = 1000; // Animation duration per payment
      const increment = end / (duration / 16); // ~60fps

      const animateAmount = () => {
        start += increment;
        if (start >= end) {
          setAnimatedPayments((prev) =>
            prev.map((p, i) =>
              i === index ? { ...p, animatedAmount: end } : p
            )
          );
          return;
        }
        setAnimatedPayments((prev) =>
          prev.map((p, i) =>
            i === index ? { ...p, animatedAmount: start } : p
          )
        );
        requestAnimationFrame(animateAmount);
      };

      setTimeout(() => requestAnimationFrame(animateAmount), payment.delay);
    });
  }, [payments]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }} // Slide up from below
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <Box
        sx={{
          p: 3,
          borderRadius: 4,
          boxShadow: `0 10px 40px ${theme.palette.primary.dark}50`, // Dramatic shadow
          background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.main} 70%)`, // Bold gradient
          border: `2px solid ${theme.palette.greenAccent.main}30`, // Accent border
          width: 600, // Adjusted width for more content
          maxHeight: 400,
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Typography
            variant="h5"
            sx={{
              color: theme.palette.primary.contrastText,
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: 2,
              textShadow: `0 3px 6px ${theme.palette.primary.dark}80`, // Dramatic shadow
              mb: 2,
            }}
          >
            Last 5 Payments
          </Typography>
        </motion.div>

        <Box sx={{ overflowY: "auto", maxHeight: 350 }}>
          {animatedPayments.map((payment, index) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, x: -50 }} // Slide in from left
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.6,
                delay: index * 0.3, // Staggered entry
                ease: "easeOut",
              }}
            >
              <Box
                sx={{
                  py: 1.5,
                  px: 2,
                  mb: 1,
                  borderRadius: 2,
                  background: `${theme.palette.primary.light}20`, // Subtle background
                  boxShadow: `0 4px 12px ${theme.palette.primary.dark}40`, // Inner shadow
                  "&:hover": {
                    background: `${theme.palette.greenAccent.main}20`, // Hover effect
                    transform: "scale(1.02)", // Slight scale on hover
                    transition: "all 0.3s ease",
                  },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.primary.contrastText,
                      fontWeight: "medium",
                    }}
                  >
                    {payment.firstName} - {payment.modeOfPayment}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.greenAccent.light,
                      fontWeight: "bold",
                      textShadow: `0 2px 4px ${theme.palette.primary.dark}60`,
                    }}
                  >
                    ${Math.round(payment.animatedAmount).toLocaleString()}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.primary.contrastText,
                    fontSize: "0.75rem",
                  }}
                >
                  Ref: {payment.ref} | TxID: {payment.transactionId}
                </Typography>
              </Box>
              {index < animatedPayments.length - 1 && (
                <Divider
                  sx={{
                    background: `linear-gradient(to right, transparent, ${theme.palette.greenAccent.main}50, transparent)`,
                    height: "1px",
                    border: "none",
                  }}
                />
              )}
            </motion.div>
          ))}
        </Box>
      </Box>
    </motion.div>
  );
};

export default LastPayments;