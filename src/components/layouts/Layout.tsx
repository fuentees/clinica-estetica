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
  Package,
  Wallet,
  Menu,
  X
} from "lucide-react";

// ✅ IMPORTAÇÕES CORRIGIDAS (Ajuste os caminhos se necessário)
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

export function Layout() {
  const { profile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Calendar, label: "Agenda", path: "/appointments" },
    { icon: Users, label: "Pacientes", path: "/patients" },
    { icon: Stethoscope, label: "Tratamentos", path: "/treatments" },
    { icon: Package, label: "Estoque", path: "/inventory" },
    { icon: Wallet, label: "Financeiro", path: "/payments" },
    { icon: Settings, label: "Ajustes", path: "/settings" },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-300">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex w-72 flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 fixed h-full z-50">
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30">
              <Stethoscope className="text-white" size={22} />
            </div>
            <span className="text-xl font-black tracking-tighter dark:text-white italic uppercase">
              VF <span className="text-pink-600">Clinic</span>
            </span>
          </div>

          <nav className="space-y-2 flex-1">
            {menuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all ${
                    isActive 
                      ? "bg-gray-900 text-white shadow-xl dark:bg-pink-600" 
                      : "text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <item.icon size={18} className={isActive ? "text-pink-500 dark:text-white" : ""} />
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
                <p className="text-[10px] font-black dark:text-white truncate uppercase tracking-tighter leading-tight">
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
                className="flex-1 h-12 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 transition-colors"
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
        <span className="font-black tracking-tighter dark:text-white uppercase italic">VF Clinic</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-500 dark:text-white">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 lg:ml-72 pt-20 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-8">
          <Outlet /> 
        </div>
      </main>

      {/* MENU MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white dark:bg-gray-900 z-50 pt-20 p-8 space-y-4">
           {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-4 p-5 font-black uppercase text-xs tracking-widest dark:text-white border-b border-gray-50 dark:border-gray-800"
              >
                <item.icon size={20} />
                {item.label}
              </Link>
           ))}
           <button 
             onClick={handleLogout} 
             className="w-full mt-10 bg-rose-500 text-white h-14 rounded-2xl font-black tracking-widest uppercase text-xs shadow-lg"
           >
             Sair do Sistema
           </button>
        </div>
      )}
    </div>
  );
}