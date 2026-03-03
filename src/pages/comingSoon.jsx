import React, { useEffect } from 'react';
import { Box, Typography, Button, ThemeProvider } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getTheme } from '../store/theme';
import BuildIcon from '@mui/icons-material/Build';

const ComingSoonPage = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = getTheme();

  // Derive a readable feature name from the current path
  const featureName = location.pathname
    .replace(/^\//, '')
    .replace(/-/g, ' ')
    .replace(/\//g, ' › ')
    .replace(/\b\w/g, (c) => c.toUpperCase()) || 'This Feature';

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          maxWidth: 1200,
          minWidth: 800,
          p: 3,
          ml: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '80vh',
          textAlign: 'center',
        }}
      >
        <BuildIcon sx={{ fontSize: 72, color: theme.palette.greenAccent?.main, mb: 2 }} />
        <Typography variant="h3" gutterBottom sx={{ color: theme.palette.primary.contrastText, fontWeight: 700 }}>
          Feature Under Development
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.secondary, mb: 2 }}>
          <strong>{featureName}</strong> is currently being built.
        </Typography>
        <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 4 }}>
          We&apos;re working hard to bring this to you. Check back soon!
        </Typography>
        <Button
          variant="contained"
          sx={{ backgroundColor: theme.palette.greenAccent?.main }}
          onClick={() => navigate('/')}
        >
          Back to Dashboard
        </Button>
      </Box>
    </ThemeProvider>
  );
};

export default ComingSoonPage;
