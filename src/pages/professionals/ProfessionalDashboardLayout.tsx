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
  CalendarDays // <--- Ícone da Agenda
} from "lucide-react";

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
        const { data } = await supabase
          .from("profiles") 
          .select("first_name, last_name, name, role")
          .eq("id", id)
          .single();
        if (data) setProfessional(data);
      } catch (err) {
        console.error(err);
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
    
    // 1. Visão Geral (INDEX)
    if (path === 'overview') {
        return currentPath === basePath;
    }
    
    // 2. Outras Rotas
    return currentPath.endsWith(`/${path}`);
  };

  if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-pink-600" /></div>;

  const displayName = professional?.first_name 
    ? `${professional.first_name} ${professional.last_name || ''}` 
    : (professional?.name || "Profissional");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      
      {/* --- CABEÇALHO --- */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 z-30 sticky top-0">
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
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {displayName}
              </h1>
              <p className="text-sm text-gray-500 mt-1 uppercase">{professional?.role || "Função"}</p>
            </div>
          </div>

          {/* --- BARRA DE NAVEGAÇÃO (ABAS) --- */}
          <div className="flex space-x-1 overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-gray-700 mt-4">
            
            {/* 1. VISÃO GERAL */}
            <TabButton 
                active={isActive('overview')} 
                onClick={() => navigate(`/professionals/${id}`)} 
                icon={<LayoutDashboard size={18} />} 
                label="Visão Geral" 
            />

            {/* 2. AGENDA (NOVO) */}
            <TabButton 
                active={isActive('agenda')} 
                onClick={() => navigate(`agenda`)} 
                icon={<CalendarDays size={18} />} 
                label="Agenda" 
            />

            {/* 3. CADASTRO */}
            <TabButton 
                active={isActive('details')} 
                onClick={() => navigate(`details`)} 
                icon={<User size={18} />} 
                label="Cadastro" 
            />

            {/* 4. DISPONIBILIDADE */}
            <TabButton 
                active={isActive('availability')} 
                onClick={() => navigate(`availability`)} 
                icon={<Clock size={18} />} 
                label="Disponibilidade" 
            />

            {/* 5. COMISSÃO */}
            <TabButton 
                active={isActive('commission')} 
                onClick={() => navigate(`commission`)} 
                icon={<DollarSign size={18} />} 
                label="Comissão" 
            />

            {/* 6. HISTÓRICO */}
            <TabButton 
                active={isActive('history')} 
                onClick={() => navigate(`history`)} 
                icon={<Activity size={18} />} 
                label="Histórico" 
            />

          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full py-6 px-4 sm:px-6 lg:px-8">
        <Outlet /> 
      </main>
    </div>
  );
}

// Componente Auxiliar para Abas
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