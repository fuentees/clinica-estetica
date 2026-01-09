import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Loader2, AlertTriangle, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]; // Ex: ['admin', 'recepcionista']
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

  // 2. NÃO AUTENTICADO (Sessão expirada ou sem login)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. ERRO DE PERFIL (Usuário logado mas sem registro na tabela public.profiles)
  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-8 text-center">
        <div className="mb-6 rounded-3xl bg-rose-50 dark:bg-rose-900/20 p-4 text-rose-600 shadow-inner">
          <AlertTriangle size={48} />
        </div>
        
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
          Perfil não localizado
        </h2>
        
        <p className="mt-4 max-w-sm text-xs font-bold leading-relaxed text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          Sua conta existe, mas não encontramos seu cadastro clínico. 
          Contate o administrador para vincular seu perfil à clínica.
        </p>
        
        <button 
          onClick={signOut}
          className="mt-10 flex items-center gap-3 rounded-2xl bg-gray-900 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-all hover:scale-[1.02] active:scale-95 dark:bg-white dark:text-gray-900"
        >
          <LogOut size={16} className="text-pink-600" />
          Tentar outro login
        </button>
      </div>
    );
  }

  // 4. BLOQUEIO POR CARGO (AQUI ESTÁ A PROTEÇÃO)
  // Se a rota exige cargos específicos e o cargo do usuário NÃO está nessa lista...
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    
    console.warn(`⛔ BLOQUEIO: Usuário ${profile.role} tentou acessar rota permitida apenas para: ${allowedRoles}`);

    // Se for um paciente perdido, manda para o portal dele
    if (profile.role === 'paciente') {
      return <Navigate to="/portal" replace />;
    }
    
    // Se for Profissional ou Recepcionista tentando entrar no Financeiro/Config do Admin:
    // Manda de volta para o Dashboard com segurança
    return <Navigate to="/dashboard" replace />;
  }

  // 5. TUDO OK: Libera a página
  return <Outlet />;
}