import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Loader2, AlertTriangle, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]; // Ex: ['admin', 'profissional']
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading, signOut } = useAuth();

  // 1. ESTADO DE CARREGAMENTO (Design Sincronizado com Layout)
  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 gap-4">
        <Loader2 className="animate-spin text-pink-600" size={40} />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Validando Credenciais...</p>
      </div>
    );
  }

  // 2. NÃO AUTENTICADO (Sem sessão no Supabase)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. ERRO DE SINCRONIZAÇÃO (Usuário existe no Auth mas não no banco Profiles)
  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-8 text-center">
        <div className="mb-6 rounded-3xl bg-rose-50 dark:bg-rose-900/20 p-4 text-rose-600 shadow-inner">
          <AlertTriangle size={48} />
        </div>
        
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
          Acesso Restrito
        </h2>
        
        <p className="mt-4 max-w-sm text-xs font-bold leading-relaxed text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          Sua conta foi autenticada, mas o seu perfil clínico não foi localizado. 
          Entre em contato com a administração da VF Clinic.
        </p>
        
        <button 
          onClick={signOut}
          className="mt-10 flex items-center gap-3 rounded-2xl bg-gray-900 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-all hover:scale-[1.02] active:scale-95 dark:bg-white dark:text-gray-900"
        >
          <LogOut size={16} className="text-pink-600" />
          Reiniciar Sessão
        </button>
      </div>
    );
  }

  // 4. PROTEÇÃO POR CARGO (Role-Based Access Control)
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Redirecionamento inteligente:
    // Se um paciente tentar entrar no painel adm, vai para o portal dele.
    if (profile.role === 'paciente') {
      return <Navigate to="/portal" replace />;
    }
    
    // Se um profissional tentar acessar algo proibido (como configurações master), volta pro Dashboard.
    return <Navigate to="/dashboard" replace />;
  }

  // 5. ACESSO PERMITIDO
  return <Outlet />;
}