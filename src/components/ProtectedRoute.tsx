import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]; // Ex: ['admin', 'medico']
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    // Pode trocar por um Spinner bonito depois
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-primary-600 animate-pulse font-semibold">Carregando sistema...</div>
      </div>
    );
  }

  // 1. Se não está logado -> Vai pro Login
  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  // 2. Se a rota exige permissão específica (ex: admin) e o usuário não tem
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    
    // Se um paciente tentar entrar na área admin, joga ele pro portal dele
    if (profile.role === 'paciente') {
      return <Navigate to="/portal" replace />;
    }
    
    // Se um médico/admin tentar entrar numa rota proibida, joga pro dashboard
    return <Navigate to="/" replace />;
  }

  // 3. Tudo certo -> Renderiza a página
  return <Outlet />;
}