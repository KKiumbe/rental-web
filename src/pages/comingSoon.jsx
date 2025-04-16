import React, { useEffect } from 'react';
import { Box, Typography, Button, ThemeProvider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore'; // Adjust path
import { getTheme } from '../store/theme'; // Adjust path

const ComingSoonPage = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const theme = getTheme();

  // Check if user is logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleBack = () => {
    navigate('/view-reports'); // Navigate back to the reports dashboard
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          maxWidth: 1200,
          minWidth: 800,
          p: 3,
          ml:10,
          
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '80vh', // Center vertically on the page
          textAlign: 'center',
        }}
      >
        <Typography variant="h2" gutterBottom sx={{ color: theme.palette.primary.contrastText }}>
          Coming Soon! 🚀
        </Typography>
        <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.secondary, mb: 4 }}>
          Custom Reports are in the works! Stay tuned for more awesome features. ⚙️✨
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          We’re building something great for you! Check back soon or return to the dashboard. 😊
        </Typography>
        <Button
          variant="contained"
          sx={{ backgroundColor: theme.palette.greenAccent.main }}
          onClick={handleBack}
        >
          Go to Reports 📊
        </Button>
      </Box>
    </ThemeProvider>
  );
};

export default ComingSoonPage;