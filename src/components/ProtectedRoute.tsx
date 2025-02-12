import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Carregando...</div>;

  if (!user) {
    console.log("🔴 Redirecionando para login...");
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
