import { useEffect, useState } from "react";
import { Outlet, useParams, useNavigate, useLocation, Link, useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext"; 
import { 
  Loader2, 
  ArrowLeft, 
  User, 
  Calendar, 
  DollarSign, 
  Clock, 
  FileText, 
  LayoutDashboard,
  ShieldCheck,
  Lock,
  KeyRound,
  Settings
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "../../components/ui/button";

// ✅ CORREÇÃO 1: Caminho padrão do componente UI (Verifique se o arquivo existe nessa pasta)
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/components/ui/dropdown-menu";

// --- TIPAGEM ---
interface Professional {
  id: string;
  name: string;
  email: string;
  role: string;
  formacao?: string;
  registrationNumber?: string;
  avatarUrl?: string;
  isActive: boolean;
  clinicId?: string;
  commissionRate: number;
  cpf: string;
  phone: string;
  userId?: string; // Para saber se tem acesso liberado
}

export function ProfessionalDashboardLayout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, user } = useAuth(); 
  
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para loading do botão de acesso
  const [loadingAccess, setLoadingAccess] = useState(false);

  useEffect(() => {
    fetchProfessional();
  }, [id, navigate, isAdmin]);

  async function fetchProfessional() {
      if (!id) return;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
          toast.error("ID inválido.");
          navigate(isAdmin ? "/professionals" : "/dashboard");
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
        if (!data) throw new Error("Profissional não encontrado.");
        
        const mappedData: Professional = {
            id: data.id,
            name: (data.first_name + " " + data.last_name).trim() || data.full_name || "Profissional",
            email: data.email,
            role: data.role,
            formacao: data.formacao,
            registrationNumber: data.registration_number,
            avatarUrl: data.avatar_url,
            isActive: data.is_active ?? true,
            clinicId: data.clinic_id,
            commissionRate: Number(data.commission_rate) || 0,
            cpf: data.cpf,
            phone: data.phone,
            userId: data.user_id 
        };

        setProfessional(mappedData); 
      } catch (error) {
        console.error("Erro perfil:", error);
        toast.error("Erro ao carregar perfil.");
        navigate(isAdmin ? "/professionals" : "/dashboard");
      } finally {
        setLoading(false);
      }
  }

  // --- FUNÇÃO 1: GERAR ACESSO (CRIAR USUÁRIO) ---
  const handleCreateAccess = async () => {
    if (!professional?.email || !professional?.cpf) {
      toast.error("Profissional precisa de email e CPF.");
      return;
    }
    
    // Senha padrão é o CPF limpo (apenas números)
    const password = professional.cpf.replace(/\D/g, ''); 
    
    if (password.length < 6) return toast.error("CPF inválido para senha (mín. 6 dígitos).");

    if (!confirm(`Gerar acesso para ${professional.name}?\nLogin: ${professional.email}\nSenha Inicial: CPF (números)`)) return;

    setLoadingAccess(true);
    try {
      const { error } = await supabase.rpc('create_professional_user', {
        email_input: professional.email,
        password_input: password,
        profile_id_input: professional.id,
        role_input: professional.role || 'professional'
      });

      if (error) throw error;

      toast.success("Acesso liberado com sucesso!");
      fetchProfessional(); // Recarrega para atualizar o botão
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar acesso.");
    } finally {
      setLoadingAccess(false);
    }
  };

  // --- FUNÇÃO 2: RESETAR SENHA ---
  const handleResetPassword = async () => {
    if (!professional?.email) return;
    
    const newPassword = prompt("Defina a nova senha (mín. 6 caracteres):");
    
    if (!newPassword || newPassword.length < 6) {
        if (newPassword) toast.error("A senha deve ter pelo menos 6 caracteres.");
        return;
    }

    setLoadingAccess(true);
    try {
        const { error } = await supabase.rpc('admin_reset_password', {
            target_user_id: professional.userId, // Usa o ID de usuário vinculado
            new_password: newPassword
        });

        if (error) throw error;
        toast.success("Senha atualizada com sucesso!");
    } catch (err: any) {
        toast.error("Erro ao resetar: " + err.message);
    } finally {
        setLoadingAccess(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white dark:bg-gray-950 gap-4">
        <Loader2 className="animate-spin text-pink-600 w-12 h-12" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Acessando Registro...</p>
      </div>
    );
  }

  if (!professional) return null;

  const initials = ((professional.name.split(' ')[0]?.[0] || "") + (professional.name.split(' ')[1]?.[0] || "")).toUpperCase();
  
  const navItems = [
    { label: "Visão Geral", path: "", icon: LayoutDashboard },
    { label: "Agenda", path: "agenda", icon: Calendar },
    { label: "Configurações", path: "details", icon: User },
    { label: "Indisponibilidade", path: "availability", icon: Clock },
    ...(isAdmin || user?.id === id ? [{ label: "Comissões", path: "commission", icon: DollarSign }] : []),
    { label: "Histórico", path: "history", icon: FileText },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 font-sans animate-in fade-in duration-700">
      
      {/* CABEÇALHO */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 pt-6 pb-0">
          
          <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
            {isAdmin && (
              <button 
                onClick={() => navigate("/professionals")} 
                className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-pink-600 transition-all group"
                title="Voltar"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              </button>
            )}

            <div className="flex items-center gap-5 flex-1">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl p-0.5 bg-gradient-to-br from-pink-200 to-purple-200">
                        <div className="w-full h-full rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                            {professional.avatarUrl ? (
                                <img src={professional.avatarUrl} alt={professional.name} className="w-full h-full object-cover"/>
                            ) : (
                                <span className="text-xl font-bold text-pink-600 bg-pink-50 w-full h-full flex items-center justify-center">
                                    {initials}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-[3px] border-white dark:border-gray-900 rounded-full ${professional.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{professional.name}</h1>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{professional.role} VILAGI</span>
                </div>
            </div>

            {/* BOTÕES DE AÇÃO (ACESSO) */}
            <div className="flex gap-2">
                {!professional.userId ? (
                    <Button 
                      onClick={handleCreateAccess} 
                      disabled={loadingAccess} 
                      className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-gray-900 text-white hover:bg-pink-600 shadow-md"
                    >
                        {loadingAccess ? <Loader2 size={14} className="animate-spin mr-2"/> : <Lock size={14} className="mr-2"/>}
                        Gerar Acesso
                    </Button>
                ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button 
                            className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                          >
                              {loadingAccess ? <Loader2 size={14} className="animate-spin mr-2"/> : <ShieldCheck size={14} className="mr-2"/>}
                              Acesso Ativo
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-900 border rounded-xl p-1 z-[100] shadow-xl">
                          <DropdownMenuItem onClick={handleResetPassword} className="cursor-pointer py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-xs font-bold flex items-center">
                              <KeyRound size={14} className="mr-2 text-pink-500"/> Redefinir Senha
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                )}
                
                {/* Botão de Atalho para Configurações */}
                <Button variant="outline" onClick={() => navigate('details')} className="rounded-xl border-gray-200 text-gray-500 font-bold text-xs h-10 px-4 hover:bg-gray-50">
                  <Settings size={16} />
                </Button>
            </div>
          </div>

          {/* BARRA DE NAVEGAÇÃO */}
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar -mb-[1px]">
            {navItems.map((item) => {
              const isActive = item.path === "" 
                ? location.pathname.endsWith(id!) || location.pathname.endsWith(`${id}/`)
                : location.pathname.includes(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center gap-2 px-5 py-4 border-b-[3px] text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap
                    ${isActive 
                      ? "border-pink-500 text-pink-600 bg-pink-50/50 rounded-t-xl" 
                      : "border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-t-xl"
                    }
                  `}
                >
                  <item.icon size={16} className={isActive ? "text-pink-500" : "text-gray-400"} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="flex-1 max-w-[1600px] w-full mx-auto p-6 animate-in fade-in duration-500">
         <Outlet context={{ professional }} /> 
      </div>
    </div>
  );
}

export function useProfessionalContext() {
  return useOutletContext<{ professional: Professional }>();
}