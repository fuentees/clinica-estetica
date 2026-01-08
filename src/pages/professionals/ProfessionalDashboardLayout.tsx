import { useEffect, useState } from "react";
import { Outlet, useParams, useNavigate, useLocation, Link, useOutletContext } from "react-router-dom";
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
  Mail,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { toast } from "react-hot-toast";

// --- TIPAGEM ---
// Define a estrutura dos dados do profissional que será usada no frontend
interface Professional {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  formacao?: string;
  registrationNumber?: string;
  avatarUrl?: string;
  isActive: boolean;
  clinicId?: string;
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

      // Verificação simples de formato de UUID para evitar chamadas inválidas
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
          toast.error("ID de profissional inválido.");
          navigate("/professionals");
          return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        
        if (!data) {
            throw new Error("Profissional não encontrado.");
        }
        
        // Mapeamento manual para garantir que snake_case do banco preencha o camelCase da interface
        // Isso protege o frontend de mudanças diretas nos nomes das colunas do banco
        const mappedData: Professional = {
            id: data.id,
            firstName: data.first_name || data.firstName || "",
            lastName: data.last_name || data.lastName || "",
            email: data.email,
            role: data.role,
            formacao: data.formacao,
            registrationNumber: data.registration_number || data.registrationNumber,
            avatarUrl: data.avatar_url || data.avatarUrl,
            isActive: data.is_active ?? data.isActive ?? true,
            clinicId: data.clinicId || data.clinic_id
        };

        setProfessional(mappedData); 
      } catch (error) {
        console.error("Erro ao carregar perfil profissional:", error);
        toast.error("Não foi possível carregar o perfil do profissional.");
        navigate("/professionals");
      } finally {
        setLoading(false);
      }
    }
    fetchProfessional();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white dark:bg-gray-950 gap-4">
        <Loader2 className="animate-spin text-pink-600 w-12 h-12" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Acessando Registro Profissional...</p>
      </div>
    );
  }

  if (!professional) return null;

  // Geração das iniciais para o avatar caso não tenha imagem
  const initials = ((professional.firstName?.[0] || "") + (professional.lastName?.[0] || "")).toUpperCase();
  const fullName = `${professional.firstName} ${professional.lastName}`.trim() || "Profissional Sem Nome";
  
  // Mapeamento amigável para os cargos
  const roleLabels: Record<string, string> = {
    'admin': 'Gestor Geral',
    'profissional': 'Especialista Técnico',
    'recepcionista': 'Atendimento/Front Desk',
    'esteticista': 'Esteticista Aplicadora'
  };

  // Itens de navegação do dashboard do profissional
  const navItems = [
    { label: "Visão Geral", path: "", icon: LayoutDashboard },
    { label: "Agenda", path: "agenda", icon: Calendar },
    { label: "Configurações", path: "details", icon: User },
    { label: "Indisponibilidade", path: "availability", icon: Clock },
    { label: "Comissões", path: "commission", icon: DollarSign },
    { label: "Histórico", path: "history", icon: FileText },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-gray-950 font-sans animate-in fade-in duration-700">
      
      {/* --- HEADER DO PERFIL PREMIUM --- */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500"></div>

        <div className="max-w-[1600px] mx-auto px-8 py-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            
            <button 
              onClick={() => navigate("/professionals")} 
              className="lg:mr-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-pink-50 hover:text-pink-600 text-gray-400 transition-all shadow-inner border border-transparent hover:border-pink-100"
              title="Voltar para lista de profissionais"
            >
              <ArrowLeft size={24} />
            </button>

            {/* AVATAR */}
            <div className="relative group">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-[2.5rem] p-1.5 bg-gradient-to-tr from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 shadow-xl group-hover:rotate-3 transition-transform duration-300">
                <div className="w-full h-full rounded-[2rem] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 relative">
                  {professional.avatarUrl ? (
                    <img src={professional.avatarUrl} alt={fullName} className="w-full h-full object-cover"/>
                  ) : (
                    <span className="text-4xl font-black text-pink-600 italic tracking-tighter uppercase">{initials}</span>
                  )}
                </div>
              </div>
              
              {/* Indicador de Status */}
              <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-2xl border-4 border-white dark:border-gray-900 shadow-lg ${professional.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} title={professional.isActive ? "Ativo" : "Inativo"}>
                {professional.isActive ? <CheckCircle2 size={16} className="text-white"/> : <XCircle size={16} className="text-white"/>}
              </div>
            </div>

            {/* INFO PROFISSIONAL */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">
                  {fullName}
                </h1>
                <span className="w-fit px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 shadow-sm">
                  {roleLabels[professional.role] || professional.role}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                {professional.formacao && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Award size={18} className="text-pink-500" />
                    <span className="font-black uppercase text-[10px] tracking-widest italic">{professional.formacao}</span>
                  </div>
                )}

                {professional.registrationNumber && (
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-inner">
                    <Shield size={14} className="text-blue-500" />
                    <span className="font-mono text-xs font-black text-gray-700 dark:text-gray-300">
                      ID: {professional.registrationNumber}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                   <Mail size={16} className="text-gray-300"/>
                   <span className="font-medium text-xs md:text-sm">{professional.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* NAVEGAÇÃO / ABAS */}
          <div className="flex items-center gap-1 mt-12 overflow-x-auto custom-scrollbar pb-1">
            {navItems.map((item) => {
              // Lógica para determinar se a aba está ativa
              // Se o path for vazio (""), verifica se estamos na raiz do ID (/professionals/UUID) ou com barra no final
              const isActive = item.path === "" 
                ? location.pathname.endsWith(id!) || location.pathname.endsWith(`${id}/`)
                : location.pathname.includes(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-t-3xl border-b-4 whitespace-nowrap
                    ${isActive 
                      ? "border-pink-600 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800/50" 
                      : "border-transparent text-gray-400 hover:text-pink-600 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    }
                  `}
                >
                  <item.icon size={18} className={isActive ? "text-pink-600" : "text-gray-300"} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* CONTEÚDO DINÂMICO (Renderiza as sub-rotas) */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-8">
        <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm min-h-[600px] animate-in slide-in-from-bottom-4 duration-500">
           {/* Contexto passado para as rotas filhas */}
           <Outlet context={{ professional }} /> 
        </div>
      </div>
    </div>
  );
}

// Hook personalizado para facilitar o acesso aos dados do profissional nas sub-páginas
export function useProfessionalContext() {
  return useOutletContext<{ professional: Professional }>();
}