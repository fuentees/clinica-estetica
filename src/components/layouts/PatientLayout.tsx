import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Calendar, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function PatientLayout() {
  const { signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Conteúdo da Página */}
      <main className="max-w-md mx-auto min-h-screen bg-white shadow-xl overflow-hidden relative">
        <Outlet />
      </main>

      {/* Menu Inferior (Estilo App Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          
          <Link to="/portal" className={`flex flex-col items-center space-y-1 ${isActive('/portal') ? 'text-pink-600' : 'text-gray-400'}`}>
            <Home size={24} />
            <span className="text-xs">Início</span>
          </Link>

          <Link to="/portal/agendamentos" className={`flex flex-col items-center space-y-1 ${isActive('/portal/agendamentos') ? 'text-pink-600' : 'text-gray-400'}`}>
            <Calendar size={24} />
            <span className="text-xs">Agenda</span>
          </Link>

          <Link to="/portal/perfil" className={`flex flex-col items-center space-y-1 ${isActive('/portal/perfil') ? 'text-pink-600' : 'text-gray-400'}`}>
            <User size={24} />
            <span className="text-xs">Perfil</span>
          </Link>

          <button onClick={signOut} className="flex flex-col items-center space-y-1 text-gray-400 hover:text-red-500">
            <LogOut size={24} />
            <span className="text-xs">Sair</span>
          </button>
          
        </div>
      </nav>
    </div>
  );
}