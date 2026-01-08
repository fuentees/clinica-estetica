import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Calendar, 
  Users, 
  Activity, // Para Serviços
  Package, // Para Estoque
  DollarSign, 
  Settings, 
  LogOut,
  UserCog // Para Profissionais
} from 'lucide-react';

export function Sidebar() {
  const { profile, isAdmin, isProfessional, isReceptionist, signOut } = useAuth();
  const location = useLocation();

  // Função para saber se o link está ativo (para ficar colorido)
  const isActive = (path: string) => location.pathname.startsWith(path);
  const linkClass = (path: string) => 
    `flex items-center gap-3 p-3 rounded transition ${
      isActive(path) ? "bg-pink-600 text-white" : "hover:bg-gray-800 text-gray-300"
    }`;

  return (
    <aside className="w-64 h-screen bg-gray-900 text-white flex flex-col border-r border-gray-800">
      {/* Cabeçalho */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold text-pink-500">Clinica Estética</h2>
        <div className="mt-4 flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold">
              {profile?.fullName?.charAt(0)}
           </div>
           <div>
             <p className="text-sm font-medium">{profile?.fullName?.split(' ')[0]}</p>
             <span className="text-[10px] uppercase tracking-wider bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">
               {profile?.role}
             </span>
           </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        
        {/* === VISÍVEL PARA TODOS (Dashboard) === */}
        <Link to="/dashboard" className={linkClass('/dashboard')}>
          <Home size={20} />
          Início
        </Link>

        {/* === AGENDA (Admin, Profissional e Recepção) === */}
        {(isProfessional || isReceptionist || isAdmin) && (
          <Link to="/appointments" className={linkClass('/appointments')}>
            <Calendar size={20} />
            Agendamentos
          </Link>
        )}

        {/* === PACIENTES (Admin, Profissional e Recepção) === */}
        {(isProfessional || isReceptionist || isAdmin) && (
          <Link to="/patients" className={linkClass('/patients')}>
            <Users size={20} />
            Pacientes
          </Link>
        )}

        {/* === SERVIÇOS/TRATAMENTOS (Admin e Profissional apenas) === 
            Recepção geralmente não configura tratamento, mas se quiser liberar, adicione || isReceptionist
        */}
        {(isProfessional || isAdmin) && (
          <Link to="/services" className={linkClass('/services')}>
            <Activity size={20} />
            Serviços
          </Link>
        )}
        
        {/* === PROFISSIONAIS (Geralmente só Admin vê a lista completa/comissão) === 
            Se profissionais podem ver a lista de colegas, use isProfessional também. 
            Aqui deixei restrito para ADMIN para teste.
        */}
        {isAdmin && (
           <Link to="/professionals" className={linkClass('/professionals')}>
             <UserCog size={20} />
             Equipe
           </Link>
        )}

        {/* ======================================================= */}
        {/* 🔴 ÁREA RESTRITA DO ADMIN (Onde mora o perigo)       */}
        {/* ======================================================= */}
        
        {isAdmin && (
          <div className="pt-6 mt-6 border-t border-gray-800">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Administrativo
            </p>
            
            <Link to="/payments" className={linkClass('/payments')}>
              <DollarSign size={20} />
              Financeiro
            </Link>

            <Link to="/inventory" className={linkClass('/inventory')}>
              <Package size={20} />
              Estoque
            </Link>

            <Link to="/settings" className={linkClass('/settings')}>
              <Settings size={20} />
              Configurações
            </Link>
          </div>
        )}

      </nav>

      {/* Rodapé */}
      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={signOut} 
          className="flex items-center gap-3 w-full p-3 text-red-400 hover:bg-gray-800/50 rounded transition"
        >
          <LogOut size={20} />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}