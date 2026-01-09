import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Stethoscope, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  Wallet,
  Menu,
  X,
  Package,
  Sparkles,
  ClipboardList // ✅ Ícone novo para prescrições
} from "lucide-react";

// IMPORTAÇÕES DOS CONTEXTOS
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

export function Layout() {
  // ✅ Pegamos as flags de cargo aqui
  const { profile, signOut, isAdmin, isProfessional, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ✅ LÓGICA DE MENU DINÂMICO
  // Se for Profissional (Larissa), vê um menu. Se for Admin, vê outro.
  let menuItems = [];

  if (isProfessional && !isAdmin) {
    // === MENU DO PROF===
    menuItems = [
      { icon: LayoutDashboard, label: "Meu Painel", path: `/professionals/${user?.id}` },
      { icon: ClipboardList, label: "Prescrições", path: "/prescriptions" }, // Atalho útil
      { icon: Calendar, label: "Minha Agenda", path: "/appointments" }, // Agenda filtrada
    ];
  } else {
    // === MENU DO ADMIN / GERAL ===
    menuItems = [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
      { icon: Calendar, label: "Agenda", path: "/appointments" },
      { icon: Users, label: "Pacientes", path: "/patients" },
      { icon: Stethoscope, label: "Profissionais", path: "/professionals" },
      { icon: ClipboardList, label: "Prescrições", path: "/prescriptions" }, // Atalho útil
      { icon: Sparkles, label: "Serviços", path: "/services" }, 
      { icon: Package, label: "Estoque", path: "/inventory" },
      { icon: Wallet, label: "Financeiro", path: "/payments" },
      { icon: Settings, label: "Ajustes", path: "/settings" },
    ];
  }

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-300 font-sans">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex w-72 flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 fixed h-full z-50 transition-all duration-300">
        <div className="p-8 h-full flex flex-col">
          
          {/* LOGO */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30">
              <Stethoscope className="text-white" size={22} />
            </div>
            <span className="text-xl font-black tracking-tighter dark:text-white italic uppercase">
              VF <span className="text-pink-600">Clinic</span>
            </span>
          </div>

          {/* NAVEGAÇÃO */}
          <nav className="space-y-2 flex-1">
            {menuItems.map((item) => {
              // Lógica de Ativo
              const isActive = item.path === '/' 
                ? location.pathname === '/' 
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all group ${
                    isActive 
                      ? "bg-gray-900 text-white shadow-xl dark:bg-pink-600 shadow-gray-900/10" 
                      : "text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-white"
                  }`}
                >
                  <item.icon size={18} className={`transition-colors ${isActive ? "text-pink-500 dark:text-white" : "group-hover:text-gray-900 dark:group-hover:text-white"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* PERFIL E BOTÕES NO RODAPÉ DA SIDEBAR */}
          <div className="mt-auto pt-8 border-t border-gray-50 dark:border-gray-800">
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={profile?.avatarUrl || "https://github.com/shadcn.png"} 
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-gray-100 dark:ring-gray-800"
                alt="Profile"
              />
              <div className="overflow-hidden">
                <p className="text-[10px] font-black dark:text-white truncate uppercase tracking-tighter leading-tight text-gray-900">
                  {profile?.fullName || "Profissional"}
                </p>
                <p className="text-[9px] font-bold text-pink-600 uppercase tracking-widest mt-0.5">
                  {profile?.role || "Acesso"}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={toggleTheme} 
                className="flex-1 h-12 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button 
                onClick={handleLogout} 
                className="flex-1 h-12 rounded-xl flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* HEADER MOBILE */}
      <div className="lg:hidden fixed top-0 w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 flex justify-between items-center z-[60]">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center text-white">
             <Stethoscope size={16}/>
           </div>
           <span className="font-black tracking-tighter dark:text-white uppercase italic text-sm">VF Clinic</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-500 dark:text-white hover:bg-gray-50 rounded-lg">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 lg:ml-72 pt-20 lg:pt-0 min-h-screen relative overflow-x-hidden">
        {/* Background Decorativo */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-pink-50/50 to-transparent dark:from-pink-900/10 pointer-events-none -z-10"/>
        
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
          <Outlet /> 
        </div>
      </main>

      {/* MENU MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white dark:bg-gray-900 z-50 pt-24 p-6 space-y-2 animate-in slide-in-from-top-10 duration-200">
           {menuItems.map((item) => (
             <Link
               key={item.path}
               to={item.path}
               onClick={() => setIsMobileMenuOpen(false)}
               className="flex items-center gap-4 p-4 rounded-2xl font-black uppercase text-xs tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-100"
             >
               <item.icon size={20} className="text-pink-500" />
               {item.label}
             </Link>
           ))}
           <button 
             onClick={handleLogout} 
             className="w-full mt-8 bg-gray-900 dark:bg-white dark:text-black text-white h-14 rounded-2xl font-black tracking-widest uppercase text-xs shadow-xl flex items-center justify-center gap-2"
           >
             <LogOut size={16}/> Sair do Sistema
           </button>
        </div>
      )}
    </div>
  );
}