import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Activity, 
  Package, 
  DollarSign, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
  const { signOut, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Visão Geral' },
    { path: '/appointments', icon: Calendar, label: 'Agenda' },
    { path: '/patients', icon: Users, label: 'Pacientes' },
    { path: '/treatments', icon: Activity, label: 'Tratamentos' },
    { path: '/inventory', icon: Package, label: 'Estoque' },
    { path: '/payments', icon: DollarSign, label: 'Financeiro' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Botão Mobile (Só aparece em telas pequenas) */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md text-gray-700"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* MENU LATERAL (Sidebar) */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
            <Activity className="h-8 w-8 text-pink-600 mr-2" />
            <span className="text-xl font-bold text-gray-800">Estética</span>
          </div>

          {/* Info do Usuário */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile?.full_name || 'Usuário'}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {profile?.role || 'Admin'}
            </p>
          </div>

          {/* Links de Navegação */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-pink-50 text-pink-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Botão Sair */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL (Onde vai o Dashboard) */}
      <main className="flex-1 overflow-y-auto h-full w-full bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}