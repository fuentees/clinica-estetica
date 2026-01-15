import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, Calendar, Users, Activity, 
  Package, DollarSign, Settings, LogOut, UserCog, ClipboardList, LayoutDashboard,
  FileSignature // ✅ 1. Ícone importado
} from 'lucide-react';

export function Sidebar() {
  const { profile, user, signOut } = useAuth();
  const location = useLocation();

  // Pega o cargo diretamente do texto no banco de dados
  const userRole = profile?.role; 

  // --- 1. VISÃO DO PACIENTE (Totalmente isolada) ---
  if (userRole === 'paciente') {
    return (
      <aside className="w-64 h-screen bg-gray-900 text-white flex flex-col border-r border-gray-800 p-6">
        <h2 className="text-xl font-black text-pink-500 mb-8 uppercase italic">Portal Paciente</h2>
        <Link to="/portal" className="flex items-center gap-3 p-3 bg-pink-600 rounded-xl mb-auto font-bold shadow-lg shadow-pink-900/20">
            <Home size={18} /> Início
        </Link>
        <button onClick={signOut} className="flex items-center gap-3 p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all uppercase font-bold text-xs mt-auto">
          <LogOut size={18} /> Sair
        </button>
      </aside>
    );
  }

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  
  const linkClass = (path: string) => 
    `flex items-center gap-3 p-3 rounded-xl transition-all ${
      isActive(path) ? "bg-pink-600 text-white shadow-lg shadow-pink-900/20" : "hover:bg-gray-800 text-gray-400 hover:text-white"
    }`;

  return (
    <aside className="w-64 h-screen bg-gray-900 text-white flex flex-col border-r border-gray-800">
      {/* Cabeçalho */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-black text-pink-500 tracking-tighter italic uppercase">VF CLINIC</h2>
        <div className="mt-4 flex items-center gap-3 p-2 bg-gray-800/40 rounded-2xl border border-gray-700/50">
           <div className="w-9 h-9 rounded-xl bg-pink-600 flex items-center justify-center text-xs font-black shadow-inner">
              {profile?.fullName?.charAt(0) || "U"}
           </div>
           <div className="overflow-hidden">
             <p className="text-xs font-bold truncate text-gray-100">{profile?.fullName?.split(' ')[0]}</p>
             <span className="text-[8px] uppercase font-black tracking-widest text-pink-500/80">
               {userRole}
             </span>
           </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        
        {/* ======================================================= */}
        {/* LÓGICA RÍGIDA: Se for 'profissional', mostra SÓ ISSO  */}
        {/* ======================================================= */}
        {userRole === 'profissional' ? (
          <div className="space-y-1">
            <p className="px-3 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2 mt-2">Área Pessoal</p>
            
            <Link to={`/professionals/${user?.id}`} className={linkClass(`/professionals/${user?.id}`)}>
              <LayoutDashboard size={18} />
              <span className="text-xs font-bold uppercase tracking-tight">Meu Painel</span>
            </Link>

            <Link to="/prescriptions" className={linkClass('/prescriptions')}>
              <ClipboardList size={18} />
              <span className="text-xs font-bold uppercase tracking-tight">Minhas Prescrições</span>
            </Link>
          </div>
        ) : (
          /* ======================================================= */
          /* SE NÃO FOR PROFISSIONAL (ENTÃO É ADMIN OU RECEPÇÃO)     */
          /* ======================================================= */
          <>
            <div className="space-y-1">
              <p className="px-3 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2 mt-2">Clínica</p>
              
              <Link to="/dashboard" className={linkClass('/dashboard')}>
                <Home size={18} />
                <span className="text-xs font-bold uppercase tracking-tight">Dashboard Clínica</span>
              </Link>

              <Link to="/appointments" className={linkClass('/appointments')}>
                <Calendar size={18} />
                <span className="text-xs font-bold uppercase tracking-tight">Agenda Global</span>
              </Link>

              <Link to="/patients" className={linkClass('/patients')}>
                <Users size={18} />
                <span className="text-xs font-bold uppercase tracking-tight">Pacientes</span>
              </Link>

              <div className="pt-4 mt-4 border-t border-gray-800/50">
                <p className="px-3 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Suprimentos e Serviços</p>
                <Link to="/inventory" className={linkClass('/inventory')}>
                  <Package size={18} />
                  <span className="text-xs font-bold uppercase tracking-tight">Estoque</span>
                </Link>
                <Link to="/services" className={linkClass('/services')}>
                  <Activity size={18} />
                  <span className="text-xs font-bold uppercase tracking-tight">Serviços</span>
                </Link>
              </div>
            </div>

            {/* SÓ MOSTRA SE FOR ADMIN MESMO */}
            {userRole === 'admin' && (
              <div className="pt-4 mt-4 border-t border-gray-800/50">
                <p className="px-3 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">
                  Administração Master
                </p>
                <Link to="/professionals" className={linkClass('/professionals')}>
                  <UserCog size={18} />
                  <span className="text-xs font-bold uppercase tracking-tight">Equipe</span>
                </Link>
                <Link to="/payments" className={linkClass('/payments')}>
                  <DollarSign size={18} className="text-green-500" />
                  <span className="text-xs font-bold uppercase tracking-tight">Financeiro</span>
                </Link>
                
                {/* ✅ 2. BOTÃO NOVO AQUI (CONFIGURAÇÃO DE TERMOS) */}
                <Link to="/config/terms" className={linkClass('/config/terms')}>
                   <FileSignature size={18} />
                   <span className="text-xs font-bold uppercase tracking-tight">Termos & Docs</span>
                </Link>

                <Link to="/settings" className={linkClass('/settings')}>
                  <Settings size={18} />
                  <span className="text-xs font-bold uppercase tracking-tight">Configurações</span>
                </Link>
              </div>
            )}
          </>
        )}
      </nav>

      {/* Rodapé com Logout */}
      <div className="p-4 border-t border-gray-800">
        <button onClick={signOut} className="flex items-center gap-3 w-full p-3 text-xs font-black text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all uppercase tracking-widest">
          <LogOut size={18} />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}