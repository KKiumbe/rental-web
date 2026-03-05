import PropTypes from 'prop-types';
import {
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Typography,
  styled,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ElectricMeterIcon from '@mui/icons-material/ElectricMeter';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export const ContinuousStepConnector = styled(StepConnector)(({ theme }) => ({
  '& .MuiStepConnector-line': {
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: theme?.palette?.divider || '#B0B0B0',
    margin: '0 8px',
    transition: 'border-color 0.3s',
  },
  '&.Mui-active .MuiStepConnector-line, &.Mui-completed .MuiStepConnector-line': {
    borderColor: theme?.palette?.greenAccent?.main || '#4caf50',
  },
}));

const StepIconRoot = styled('div')(({ theme, ownerState }) => ({
  width: 36,
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  border: `2px solid ${
    ownerState.completed || ownerState.active
      ? theme?.palette?.greenAccent?.main || '#4caf50'
      : theme?.palette?.divider || '#ccc'
  }`,
  backgroundColor: ownerState.completed
    ? theme?.palette?.greenAccent?.main || '#4caf50'
    : 'transparent',
  color: ownerState.completed
    ? '#fff'
    : ownerState.active
    ? theme?.palette?.greenAccent?.main || '#4caf50'
    : theme?.palette?.text?.secondary || '#999',
  fontSize: '0.85rem',
  fontWeight: 700,
  transition: 'all 0.3s',
}));

const STEP_ICONS = [PersonAddIcon, ReceiptLongIcon, ElectricMeterIcon, CheckCircleIcon];

function CustomStepIcon({ active, completed, icon }) {
  const Icon = STEP_ICONS[Number(icon) - 1];
  return (
    <StepIconRoot ownerState={{ active, completed }}>
      {completed ? <CheckCircleIcon sx={{ fontSize: 18 }} /> : <Icon sx={{ fontSize: 18 }} />}
    </StepIconRoot>
  );
}

CustomStepIcon.propTypes = {
  active: PropTypes.bool,
  completed: PropTypes.bool,
  icon: PropTypes.node,
};

const STEPS = [
  'Step 1: Customer Details',
  'Step 2: Create Invoice',
  'Step 3: Utility Readings',
  'Step 4: Confirmation',
];

export default function OnboardingStepper({ activeStep }) {
  return (
    <Stepper activeStep={activeStep} connector={<ContinuousStepConnector />} sx={{ mb: 4 }}>
      {STEPS.map((label) => (
        <Step key={label}>
          <StepLabel StepIconComponent={CustomStepIcon}>
            <Typography variant="body1" fontWeight="medium">
              {label}
            </Typography>
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}

OnboardingStepper.propTypes = {
  activeStep: PropTypes.number.isRequired,
};
