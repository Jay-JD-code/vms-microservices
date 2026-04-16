import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ChangePasswordGuard({ children }: { children: JSX.Element }) {
  const { user } = useAuth();

  // ❌ If not first login → block access
  if (!user?.firstLogin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}