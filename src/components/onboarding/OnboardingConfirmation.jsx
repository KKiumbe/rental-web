import PropTypes from 'prop-types';
import { Box, Typography, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function OnboardingConfirmation({ onBack, onFinish }) {
  const theme = useTheme();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Onboarding Complete
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Customer details, invoice (if provided), and utility readings (if provided) have been
        successfully saved.
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Click Finish to view the customer details or Back to review utility readings.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          fullWidth
          sx={{ color: theme?.palette?.grey[300], borderColor: theme?.palette?.grey[300] }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={onFinish}
          fullWidth
          sx={{ backgroundColor: theme?.palette?.greenAccent?.main, color: '#fff' }}
        >
          Finish
        </Button>
      </Box>
    </Box>
  );
}

OnboardingConfirmation.propTypes = {
  onBack: PropTypes.func.isRequired,
  onFinish: PropTypes.func.isRequired,
};
