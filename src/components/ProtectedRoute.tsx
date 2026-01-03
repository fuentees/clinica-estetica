import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]; // Ex: ['admin', 'profissional']
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading, signOut } = useAuth();

  // 1. Estado de Carregamento
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  // 2. Não autenticado (Sem sessão no Supabase Auth) -> Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Autenticado, mas sem Perfil (Erro Crítico de RLS ou Banco)
  // IMPEDE O LOOP INFINITO DE LOGIN
  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center dark:bg-gray-900">
        <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Perfil não encontrado</h2>
        <p className="mt-2 max-w-md text-gray-600 dark:text-gray-400">
          Sua conta foi autenticada, mas não conseguimos carregar seus dados de perfil. 
          Isso pode ocorrer se sua conta ainda não foi totalmente configurada ou por um erro de permissão.
        </p>
        <button 
          onClick={signOut}
          className="mt-6 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          Sair e tentar novamente
        </button>
      </div>
    );
  }

  // 4. Verificação de Permissão (Role Protection)
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Redirecionamento inteligente baseado no cargo do usuário
    if (profile.role === 'paciente') {
      return <Navigate to="/portal" replace />;
    }
    
    // Se for admin ou profissional tentando acessar rota proibida, vai pra home deles
    return <Navigate to="/" replace />;
  }

  // 5. Sucesso
  return <Outlet />;
}