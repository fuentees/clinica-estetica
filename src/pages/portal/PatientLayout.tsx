import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Calendar, User, LogOut, Stethoscope, Package } from 'lucide-react'; // ✅ Adicionado Package
import { useAuth } from '../../contexts/AuthContext';

export function PatientLayout() {
  const { signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/portal' && location.pathname === '/portal') return true;
    if (path !== '/portal' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: '/portal', icon: Home, label: 'Início' },
    { path: '/portal/agendamentos', icon: Calendar, label: 'Minha Agenda' },
    { path: '/portal/pacotes', icon: Package, label: 'Meus Pacotes' }, // ✅ NOVO ITEM NO MENU
    { path: '/portal/perfil', icon: User, label: 'Meu Perfil' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row">
      
      {/* SIDEBAR (DESKTOP) */}
      <aside className="hidden md:flex w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-col fixed inset-y-0 z-50">
        <div className="p-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Stethoscope className="text-white" size={20} />
            </div>
            <div>
                <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter leading-none">
                    VILAGI
                </h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Portal</p>
            </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
            {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                    <Link 
                        key={item.path} 
                        to={item.path}
                        className={`
                            flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group
                            ${active 
                                ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600' 
                                : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-600'
                            }
                        `}
                    >
                        <item.icon size={20} strokeWidth={active ? 3 : 2} className="transition-transform group-hover:scale-110"/>
                        <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]"></div>}
                    </Link>
                )
            })}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <button 
                onClick={signOut}
                className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all font-bold uppercase text-xs tracking-widest"
            >
                <LogOut size={20} />
                Sair do Portal
            </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 md:ml-72 min-h-screen relative">
        {/* Header Mobile */}
        <div className="md:hidden p-6 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
                    <Stethoscope className="text-white" size={16} />
                </div>
                <span className="font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">VILAGI</span>
            </div>
            <button onClick={signOut} className="p-2 bg-gray-50 rounded-full text-gray-400">
                <LogOut size={18}/>
            </button>
        </div>

        <div className="p-6 pb-24 md:p-10 max-w-5xl mx-auto animate-in fade-in duration-500">
            <Outlet />
        </div>
      </main>

      {/* MENU MOBILE (INFERIOR) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 h-20 px-6 z-50 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="flex justify-around items-center h-full">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className={`relative group flex flex-col items-center justify-center w-16 h-full transition-all`}
                >
                  {active && (
                    <span className="absolute top-0 w-8 h-1 bg-pink-500 rounded-b-full shadow-[0_0_10px_rgba(236,72,153,0.5)]"></span>
                  )}
                  <div className={`p-1 rounded-xl transition-all ${active ? 'text-pink-600 -translate-y-1' : 'text-gray-300'}`}>
                    <item.icon size={active ? 24 : 22} strokeWidth={active ? 3 : 2} />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-gray-900 dark:text-white' : 'text-transparent'}`}>
                    {active ? item.label.split(' ')[0] : ''}
                  </span>
                </Link>
              );
            })}
          </div>
      </nav>
    </div>
  );
}