import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingBlock } from "../components/Feedback";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingBlock label="Checking your session" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
