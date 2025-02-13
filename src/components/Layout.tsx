import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Calendar, Users, Package, ClipboardList, LogOut,
  Menu, X, DollarSign, TrendingUp, Sun, Moon
} from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

const navigation = [
  { name: 'Agenda', href: '/appointments', icon: Calendar, roles: ['admin', 'professional', 'receptionist'] },
  { name: 'Pacientes', href: '/patients', icon: Users, roles: ['admin', 'professional', 'receptionist'] },
  { name: 'Tratamentos', href: '/treatments', icon: ClipboardList, roles: ['admin', 'professional'] },
  { name: 'Estoque', href: '/inventory', icon: Package, roles: ['admin', 'receptionist'] },
  { name: 'Pagamentos', href: '/payments', icon: DollarSign, roles: ['admin', 'receptionist'] },
  { name: 'Fluxo de Caixa', href: '/payments/cash-flow', icon: TrendingUp, roles: ['admin'] },
];

export function Layout() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNavigation = navigation.filter(
    item => item.roles.includes(user?.role || '')
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-bg">
      <a href="#main-content" className="skip-to-content">
        Pular para o conteúdo principal
      </a>

      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4 bg-white dark:bg-dark-surface shadow">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
            aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <span className="text-lg font-semibold dark:text-dark-text">Clínica Estética</span>
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white dark:bg-dark-surface pt-5 pb-4 overflow-y-auto">
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${isActive ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon className="mr-3 h-6 w-6" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Botão de Logout */}
          <div className="p-4">
            <Button
              variant="outline"
              onClick={() => {
                signOut();
                navigate('/login'); // Redireciona após logout
              }}
              className="w-full flex items-center text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
            >
              <LogOut className="mr-2 w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <main id="main-content" className="flex-1 focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
