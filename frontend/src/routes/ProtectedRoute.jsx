import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingBlock } from "../components/Feedback";

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, isLoading, worker } = useAuth();

  if (isLoading) {
    return <LoadingBlock label="Checking your session" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(worker?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
