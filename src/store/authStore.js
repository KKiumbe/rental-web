import { create } from "zustand";
import { createTheme } from "@mui/material/styles";







export const useThemeStore = create((set) => ({
  darkMode: true, // Default to dark mode

  toggleTheme: () => set((state) => ({ darkMode: !state.darkMode })),

  getTheme: () => {
    return createTheme({
      palette: {
        mode: useThemeStore.getState().darkMode ? "dark" : "light",
      },
    });
  },
}));


// ✅ Authentication Store (Zustand)


export const useAuthStore = create((set) => ({
  currentUser: JSON.parse(localStorage.getItem("currentUser")) || null,

  isAuthenticated: !!localStorage.getItem("currentUser"), // Check if a user is logged in

  login: (user) => {
    localStorage.setItem("currentUser", JSON.stringify(user));
    set({ currentUser: user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("currentUser");
    set({ currentUser: null, isAuthenticated: false });
  },
}));

