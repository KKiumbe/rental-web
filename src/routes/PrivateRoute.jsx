import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const PrivateRoute = ({ children }) => {
  const currentUser = useAuthStore((state) => state.currentUser);

  // Avoid infinite redirects by handling the initial undefined/null state
  if (currentUser === undefined) {
    return <div>Loading...</div>; // Temporary loading state
  }

  return currentUser ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
