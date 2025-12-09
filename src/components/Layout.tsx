import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  ScrollText, 
  Stethoscope, 
  Activity, 
  Package, 
  DollarSign, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Settings,
  Sparkles,
  Search,
  Command,
  Bell // Adicionei um sino de notificação para compor o header
} from 'lucide-react';

// Importa a Command Bar
import { CommandBar } from './ui/CommandBar'; 

export function Layout() {
  const { user, signOut, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fecha o menu mobile ao trocar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Visão Geral', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Agenda', path: '/appointments', icon: Calendar },
    { label: 'Pacientes', path: '/patients', icon: Users },
    { label: 'Receituário', path: '/prescriptions', icon: ScrollText },
    { label: 'Profissionais', path: '/professionals', icon: Stethoscope },
    { label: 'Tratamentos', path: '/treatments', icon: Activity },
    { label: 'Estoque', path: '/inventory', icon: Package },
    { label: 'Financeiro', path: '/payments', icon: DollarSign },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const openCommandPalette = () => {
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    document.dispatchEvent(event);
  };

  // Componente de Item de Menu
  const NavItem = ({ item }: { item: any }) => {
    const isActive = location.pathname.startsWith(item.path);
    return (
      <Link
        to={item.path}
        className={`
          group relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium text-sm mb-1
          ${isActive 
            ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/25 translate-x-1' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-pink-600 dark:hover:text-pink-400 hover:shadow-md'
          }
        `}
      >
        <item.icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
        <span className="flex-1">{item.label}</span>
        {!isActive && (
          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 text-pink-300" />
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-[#F8F9FC] dark:bg-gray-900 font-sans overflow-hidden">
      
      <CommandBar />

      {/* --- SIDEBAR DESKTOP (Agora sem a busca) --- */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#F8F9FC] dark:bg-gray-900 border-r border-gray-200/60 dark:border-gray-800 h-screen sticky top-0 p-6 z-40">
        
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
            <Sparkles size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              Estética
            </h1>
            <span className="text-[10px] uppercase tracking-widest text-pink-500 font-bold">Premium OS</span>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2">
          <p className="px-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Principal</p>
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        {/* Footer da Sidebar */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
            <Link 
                to="/settings" 
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium text-sm
                    ${location.pathname === '/settings'
                        ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }
                `}
            >
                <Settings size={20} />
                <span>Configurações</span>
            </Link>

            <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3 relative group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold border-2 border-white dark:border-gray-600 shadow-md">
                    {profile?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {profile?.first_name || user?.email?.split('@')[0] || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500 truncate capitalize">
                        {profile?.role || 'Admin'}
                    </p>
                </div>
                <button onClick={handleSignOut} className="text-gray-400 hover:text-red-500 p-2" title="Sair">
                    <LogOut size={18} />
                </button>
            </div>
        </div>
      </aside>

      {/* --- MOBILE HEADER --- */}
      <div className="lg:hidden fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white">
            <Sparkles size={16} fill="currentColor" />
          </div>
          <span className="font-bold text-lg text-gray-900 dark:text-white">Estética OS</span>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={openCommandPalette} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                <Search size={20}/>
            </button>
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600 dark:text-gray-300">
                <Menu size={24} />
            </button>
        </div>
      </div>

      {/* --- MOBILE DRAWER --- */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-[85%] max-w-sm bg-white dark:bg-gray-900 h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <span className="text-xl font-bold text-gray-900 dark:text-white">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                <X size={20} />
              </button>
            </div>
            <nav className="space-y-1 flex-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
              <div className="my-4 border-t border-gray-100 dark:border-gray-800"></div>
              <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-sm">
                  <Settings size={20} />
                  <span>Configurações</span>
              </Link>
            </nav>
            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-auto">
              <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 font-bold hover:bg-red-100 transition-colors">
                <LogOut size={18} /> Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ÁREA PRINCIPAL --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* === NOVO HEADER SUPERIOR (Direita) === */}
        <header className="hidden lg:flex items-center justify-end px-8 py-4 bg-[#F8F9FC] dark:bg-gray-900 sticky top-0 z-30">
            
            {/* Barra de Busca Flutuante */}
            <button 
                onClick={openCommandPalette}
                className="flex items-center w-80 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-400 hover:border-pink-300 hover:text-pink-500 hover:shadow-lg hover:shadow-pink-500/10 transition-all group mr-4"
            >
                <Search size={18} className="mr-3 text-gray-400 group-hover:text-pink-500 transition-colors"/>
                <span className="flex-1 text-left">Pesquisar...</span>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-bold border border-gray-200 dark:border-gray-600 group-hover:border-pink-200">
                    <Command size={10} /> K
                </div>
            </button>

            {/* Ícone de Notificação (Decorativo) */}
            <button className="p-2.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-pink-600 hover:border-pink-200 transition-colors shadow-sm">
                <Bell size={20} />
            </button>

        </header>

        {/* Conteúdo com Scroll */}
        <main className="flex-1 overflow-y-auto w-full pt-4 lg:pt-0">
            <div className="max-w-[1920px] mx-auto w-full min-h-full p-4 lg:px-8 lg:pb-8">
                <Outlet />
            </div>
        </main>
      </div>

    </div>
  );
}