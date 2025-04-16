import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TextField, Button, Box, Typography, Paper } from "@mui/material";
import { useAuthStore } from "../store/authStore";
import axios from "axios";
import { getTheme } from "../store/theme";


const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  //const currentUser = useAuthStore((state) => state.currentUser);
  const theme = getTheme();

  const BASEURL = import.meta.env.VITE_BASE_URL || "https://taqa.co.ke/api";


  // useEffect(() => {
  //   if (currentUser) {
  //     navigate("/", { replace: true });
  //   }
  // }, [currentUser, navigate]); // ✅ Added dependencies

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      console.log(`this is base url ${BASEURL}`);
      const response = await axios.post(
        `${BASEURL}/signin`,
        { phoneNumber, password },
        { withCredentials: true }
      );

      login(response.data.user);
      navigate("/");
    } catch (error) {
      setError("Invalid phone number or password");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      ml:65 // Apply theme color
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: "100%", textAlign: "center" }}>
        <Typography variant="h5" mb={2}>Login</Typography>
        {error && <Typography color="error" mb={2}>{error}</Typography>}

        <Box component="form" onSubmit={handleLogin}>
          <TextField
            label="Phone Number"
            fullWidth
            margin="normal"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            sx={{backgroundColor:theme.palette.primary.dark , color:theme.palette.primary.contrastText}}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            sx={{backgroundColor:theme.palette.primary.dark , color:theme.palette.primary.contrastText}}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2, backgroundColor: theme.palette.greenAccent.main }}
          >
            Login
          </Button>
        </Box>

        <Box mt={2}>
        
          <Typography variant="body2" mt={1}>
            <Link to="/reset-password" style={{ textDecoration: "none", color: "#1976d2" }}>
              Forgot password?
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
