import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, isAuthenticated } = useAuth();

  // ❌ Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 🔥 FIRST LOGIN GUARD
  if (user?.firstLogin) {
    return <Navigate to="/change-password" replace />;
  }

  return children;
}