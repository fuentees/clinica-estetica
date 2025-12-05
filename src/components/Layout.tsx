import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, Activity, Package, 
  DollarSign, LogOut, Menu, X, Stethoscope, Settings 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
  const { signOut, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Itens do Menu Principal
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Visão Geral' },
    { path: '/appointments', icon: Calendar, label: 'Agenda' },
    { path: '/patients', icon: Users, label: 'Pacientes' },
    { path: '/professionals', icon: Stethoscope, label: 'Profissionais' }, 
    { path: '/treatments', icon: Activity, label: 'Tratamentos' },
    { path: '/inventory', icon: Package, label: 'Estoque' },
    // Link direto para o Dashboard Financeiro
    { path: '/payments/cash-flow', icon: DollarSign, label: 'Financeiro' }, 
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Botão Mobile (Hambúrguer) */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-md shadow-md text-gray-700 dark:text-white"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar (Menu Lateral) */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-700">
            <Activity className="h-8 w-8 text-pink-600 mr-2" />
            <span className="text-xl font-bold text-gray-800 dark:text-white">Estética</span>
        </div>

        {/* Perfil Resumido */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {profile?.first_name || 'Usuário'}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {profile?.role || 'Admin'}
            </p>
        </div>

        {/* Navegação Principal */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            ))}
        </nav>

        {/* Rodapé do Menu (Configurações e Sair) */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
            
            {/* Link para Configurações */}
            <Link
                to="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/settings')
                    ? 'text-gray-900 bg-gray-100 dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-white'
                }`}
            >
                <Settings className="mr-3 h-5 w-5" />
                Configurações
            </Link>
            
            {/* Botão Sair */}
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </button>
        </div>
      </aside>

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto h-full w-full bg-gray-50 dark:bg-gray-900">
        <Outlet />
      </main>
    </div>
  );
}