import { useEffect, useState } from "react";
import { Outlet, useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  Loader2, 
  ArrowLeft, 
  User, 
  Calendar, 
  DollarSign, 
  Clock, 
  FileText, 
  LayoutDashboard,
  Shield,
  Award,
  Mail // Adicionado aqui!
} from "lucide-react";

// --- TIPAGEM ---
interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  formacao?: string;
  registration_number?: string;
  avatar_url?: string;
  is_active: boolean;
}

export function ProfessionalDashboardLayout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);

  // --- BUSCA DADOS DO PROFISSIONAL ---
  useEffect(() => {
    async function fetchProfessional() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setProfessional(data);
      } catch (error) {
        console.error("Erro ao carregar profissional:", error);
        navigate("/professionals"); // Volta se der erro
      } finally {
        setLoading(false);
      }
    }
    fetchProfessional();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="animate-spin text-pink-600 w-10 h-10" />
      </div>
    );
  }

  if (!professional) return null;

  // --- LÓGICA DE EXIBIÇÃO ---
  const initials = professional.first_name?.[0]?.toUpperCase() || "U";
  const fullName = `${professional.first_name} ${professional.last_name}`;
  
  // Formatação do Cargo
  const roleLabels: Record<string, string> = {
    'admin': 'Administrador',
    'profissional': 'Profissional Especialista',
    'recepcionista': 'Recepcionista',
    'esteticista': 'Esteticista'
  };
  const displayRole = roleLabels[professional.role] || professional.role;

  // Menu de Abas (Navegação Interna)
  const navItems = [
    { label: "Visão Geral", path: "", icon: LayoutDashboard },
    { label: "Agenda", path: "agenda", icon: Calendar },
    { label: "Detalhes & Edição", path: "details", icon: User },
    { label: "Disponibilidade", path: "availability", icon: Clock },
    { label: "Comissões", path: "commission", icon: DollarSign },
    { label: "Histórico", path: "history", icon: FileText },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-gray-900 font-sans">
      
      {/* --- HEADER DO PERFIL (PREMIUM) --- */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        {/* Detalhe de fundo (Gradiente superior) */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600"></div>

        <div className="max-w-[1600px] mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            
            {/* Botão Voltar */}
            <button 
              onClick={() => navigate("/professionals")} 
              className="absolute top-6 right-6 md:static md:mr-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
              title="Voltar para a lista"
            >
              <ArrowLeft size={24} />
            </button>

            {/* AVATAR GRANDE */}
            <div className="relative">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full p-1 bg-gradient-to-tr from-pink-500 to-purple-600 shadow-lg">
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 flex items-center justify-center overflow-hidden">
                  {professional.avatar_url ? (
                    <img 
                      src={professional.avatar_url} 
                      alt={fullName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-tr from-pink-600 to-purple-600">
                      {initials}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Indicador de Status */}
              <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-white dark:border-gray-800 ${professional.is_active ? 'bg-green-500' : 'bg-gray-400'}`} title={professional.is_active ? "Ativo" : "Inativo"}></div>
            </div>

            {/* INFORMAÇÕES PRINCIPAIS */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {fullName}
                </h1>
                
                {/* Badge do Cargo */}
                <span className="w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-700 dark:text-pink-300 border border-pink-100 dark:border-pink-800/50">
                  {displayRole}
                </span>
              </div>

              {/* Linha de Detalhes (Especialidade e Registro) */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                
                {professional.formacao && (
                  <div className="flex items-center gap-1.5">
                    <Award size={16} className="text-purple-500" />
                    <span className="font-medium">{professional.formacao}</span>
                  </div>
                )}

                {/* Mostra o Registro (CRM/CRBM) se existir */}
                {professional.registration_number && (
                  <>
                    <span className="hidden md:inline text-gray-300">•</span>
                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-600">
                      <Shield size={14} className="text-gray-400" />
                      <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                        {professional.registration_number}
                      </span>
                    </div>
                  </>
                )}

                <span className="hidden md:inline text-gray-300">•</span>
                <div className="flex items-center gap-1.5">
                   <Mail size={14} className="text-gray-400"/>
                   <span>{professional.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* --- NAVEGAÇÃO DE ABAS (TABS) --- */}
          <div className="flex items-center gap-1 mt-10 overflow-x-auto custom-scrollbar border-b border-gray-200 dark:border-gray-700">
            {navItems.map((item) => {
              // Verifica se a rota é a ativa
              const isActive = item.path === "" 
                ? location.pathname.endsWith(id!) || location.pathname.endsWith(`${id}/`)
                : location.pathname.includes(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-medium transition-all whitespace-nowrap
                    ${isActive 
                      ? "border-pink-600 text-pink-700 dark:text-pink-400 bg-pink-50/50 dark:bg-pink-900/10" 
                      : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  <item.icon size={18} className={isActive ? "text-pink-600" : "text-gray-400"} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- CONTEÚDO DAS PÁGINAS FILHAS (OUTLET) --- */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-6">
        <Outlet context={{ professional }} /> 
      </div>
    </div>
  );
}