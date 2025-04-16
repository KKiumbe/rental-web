import React from "react";
import { Typography, Box } from "@mui/material";
import { getTheme } from "../store/theme";

const TitleComponent = ({ title }) => {

  const theme = getTheme();
  return (
    <Box
      sx={{
        marginBottom: 2,
        padding: 2,
        borderBottom: "2px solid #ddd",
       // Centers the text
        display: "flex",
        justifyContent: 'flex-start',
        paddingLeft:10,
        //color: theme.palette.primary.contrastText,
      
        //backgroundColor: theme.palette.primary.contrastText,
      }}
    >
      <Typography
        variant="h5"
        fontWeight="bold"
        sx={{ fontSize: { xs: "1.5rem", sm: "1.8rem", 
          color: theme.palette.primary.contrastText,
        } }} 
      >
        {title}
      </Typography>
    </Box>
  );
};

export default TitleComponent;
