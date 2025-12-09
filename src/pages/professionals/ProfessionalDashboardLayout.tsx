import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  ArrowLeft, 
  User, 
  Activity, 
  DollarSign, 
  Loader2,
  LayoutDashboard,
  Clock,
  CalendarDays
} from "lucide-react";

// Componente Auxiliar (mantido)
function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-all whitespace-nowrap outline-none focus:outline-none
        ${active 
          ? "border-pink-600 text-pink-600 dark:text-pink-400 bg-pink-50/50 dark:bg-pink-900/10 rounded-t-md" 
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white"
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}


export function ProfessionalDashboardLayout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [professional, setProfessional] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfessionalDetails() {
      if (!id) return;
      try {
        // CORREÇÃO: BUSCA DIRETA E SIMPLES NA TABELA 'PROFILES'
        const { data, error } = await supabase
          .from("profiles") 
          .select("first_name, last_name, name, role")
          .eq("id", id) 
          .single();

        if (error || !data) throw error;
          
        // --- RESOLUÇÃO DO NOME ---
        const fullName = data.first_name 
            ? `${data.first_name} ${data.last_name || ''}` 
            : (data.name || "Profissional");
            
        setProfessional({ 
            ...data, 
            fullName: fullName, 
            role: data.role // Pega a role diretamente do profiles
        });
        
      } catch (err) {
        // Fallback: O ID não existe na tabela profiles
        setProfessional({ fullName: "Profissional (ID Não Encontrado)", role: "Função" }); 
      } finally {
        setLoading(false);
      }
    }
    fetchProfessionalDetails();
  }, [id]);

  // Função para determinar qual aba está ativa
  const isActive = (path: string) => {
    const currentPath = location.pathname.replace(/\/$/, ''); 
    const basePath = `/professionals/${id}`;
    
    if (path === 'overview') {
        return currentPath === basePath || currentPath === basePath + '/';
    }
    
    return currentPath.endsWith(`/${path}`);
  };

  if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-pink-600" /></div>;

  // Nome formatado para o cabeçalho
  const displayName = professional?.fullName || "Profissional";
  const displayRole = professional?.role || "Função";
  const initials = displayName[0] || 'P'; 

  return (
    <div className="flex flex-col">
      
      {/* --- CABEÇALHO PRINCIPAL E TABS --- */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          
          {/* Título e Botão Voltar */}
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate("/professionals")} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
              title="Voltar para a lista"
            >
              <ArrowLeft size={22} />
            </button>
            
            {/* INICIAIS VISUAIS PARA CONFIRMAÇÃO */}
            <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 font-bold text-lg">
                {initials}
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                {displayName} 
              </h1>
              <p className="text-sm text-gray-500 mt-0.5 uppercase">{displayRole}</p>
            </div>
          </div>

          {/* --- BARRA DE NAVEGAÇÃO (ABAS) --- */}
          <div className="flex space-x-1 overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-gray-700 mt-4">
            
            <TabButton 
                active={isActive('overview')} 
                onClick={() => navigate(`/professionals/${id}`)} 
                icon={<LayoutDashboard size={18} />} 
                label="Visão Geral" 
            />

            <TabButton 
                active={isActive('agenda')} 
                onClick={() => navigate(`agenda`)} 
                icon={<CalendarDays size={18} />} 
                label="Agenda" 
            />

            <TabButton 
                active={isActive('details')} 
                onClick={() => navigate(`details`)} 
                icon={<User size={18} />} 
                label="Cadastro" 
            />

            <TabButton 
                active={isActive('availability')} 
                onClick={() => navigate(`availability`)} 
                icon={<Clock size={18} />} 
                label="Disponibilidade" 
            />

            <TabButton 
                active={isActive('commission')} 
                onClick={() => navigate(`commission`)} 
                icon={<DollarSign size={18} />} 
                label="Comissão" 
            />

            <TabButton 
                active={isActive('history')} 
                onClick={() => navigate(`history`)} 
                icon={<Activity size={18} />} 
                label="Histórico" 
            />

          </div>
        </div>
      </header>

      {/* --- CONTEÚDO DA ROTA --- */}
      <main className="flex-1 max-w-7xl mx-auto w-full py-6 px-4 sm:px-6 lg:px-8">
        <Outlet /> 
      </main>
    </div>
  );
}