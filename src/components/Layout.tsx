import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, Activity, Package, 
  DollarSign, LogOut, Menu, X, Stethoscope, Settings 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Importa a Command Bar (Certifique-se que o arquivo existe em src/components/ui/CommandBar.tsx)
import { CommandBar } from './ui/CommandBar'; 

export function Layout() {
  const { signOut, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Itens do Menu Principal
  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Visão Geral' }, // Ajustei para /dashboard
    { path: '/appointments', icon: Calendar, label: 'Agenda' },
    { path: '/patients', icon: Users, label: 'Pacientes' },
    { path: '/professionals', icon: Stethoscope, label: 'Profissionais' }, 
    { path: '/treatments', icon: Activity, label: 'Tratamentos' },
    { path: '/inventory', icon: Package, label: 'Estoque' },
    { path: '/payments', icon: DollarSign, label: 'Financeiro' }, 
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 overflow-hidden">
      
      {/* --- BARRA DE COMANDO GLOBAL (CTRL+K) --- */}
      <CommandBar />

      {/* Botão Mobile (Hambúrguer) */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-md shadow-md text-gray-700 dark:text-white hover:bg-gray-50"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar (Menu Lateral) */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl lg:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-gray-100 dark:border-gray-700">
            <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-xl mr-3">
                <Activity className="h-6 w-6 text-pink-600" />
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">Estética</span>
        </div>

        {/* Perfil Resumido */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {profile?.first_name?.[0] || 'U'}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {profile?.first_name || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize truncate">
                      {profile?.role || 'Admin'}
                    </p>
                </div>
            </div>
        </div>

        {/* Navegação Principal */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                  isActive(item.path)
                    ? 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 transition-colors ${isActive(item.path) ? 'text-pink-600' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                {item.label}
              </Link>
            ))}
        </nav>

        {/* Rodapé do Menu */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2 bg-gray-50/30 dark:bg-gray-900/30">
            {/* Dica Visual */}
            <div className="hidden lg:flex items-center justify-between px-4 py-2 text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg mb-2 border border-gray-200 dark:border-gray-700">
                <span>Busca Rápida</span>
                <span className="font-bold bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">Ctrl K</span>
            </div>

            <Link
                to="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                  isActive('/settings')
                    ? 'text-gray-900 bg-gray-100 dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-white'
                }`}
            >
                <Settings className="mr-3 h-5 w-5" />
                Configurações
            </Link>
            
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </button>
        </div>
      </aside>

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto h-full w-full bg-gray-50 dark:bg-gray-900 transition-all duration-300 relative">
        {/* Container para centralizar em telas Ultrawide */}
        <div className="max-w-[1920px] mx-auto w-full min-h-full">
            <Outlet />
        </div>
      </main>
    </div>
  );
}