import { useEffect, useState } from "react";
import { Outlet, useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast"; 
import {
  Loader2,
  ArrowLeft,
  User,
  FileText,
  Activity,
  ScrollText,
  DollarSign,
  LayoutDashboard,
  Image as ImageIcon,
  ClipboardList,
  Sparkles,
  BrainCircuit,
  Scale,
  Settings,
  Lock,        
  ShieldCheck,
  KeyRound 
} from "lucide-react";

import { Button } from "../../components/ui/button";

// ✅ Mantendo a estrutura de pasta duplicada conforme solicitado
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/components/ui/dropdown-menu";

interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  avatar_url?: string;
}

export function PatientDashboardLayout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para controle de acesso do paciente à VILAGI
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPatient() {
      if (!id) return;
      try {
        // 1. Busca os dados base do paciente
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setPatient(data);

        // 2. Verifica se o e-mail já possui um perfil de usuário vinculado
        if (data.email) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', data.email)
                .maybeSingle(); 
            
            if (profile) {
                setHasAccess(true);
                setUserId(profile.id);
            }
        }
      } catch (error) {
        console.error("Erro ao carregar prontuário:", error);
        toast.error("Paciente não encontrado.");
        navigate("/patients");
      } finally {
        setLoading(false);
      }
    }
    fetchPatient();
  }, [id, navigate]);

  const handleCreateAccess = async () => {
    if (!patient?.email) {
      toast.error("O paciente precisa de um e-mail cadastrado.");
      return;
    }
    if (!confirm(`Gerar acesso para ${patient.name}?\nLogin: ${patient.email}\nSenha: 123456`)) return;

    setLoadingAccess(true);
    try {
      const { data, error } = await supabase.rpc('create_patient_user', {
        email_input: patient.email,
        password_input: '123456',
        patient_id_input: id 
      });

      if (error) throw error;
      if (data && data.status === 'error') throw new Error(data.message);

      toast.success("Acesso VILAGI criado com sucesso!");
      setHasAccess(true);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar acesso.");
    } finally {
      setLoadingAccess(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userId) return;
    const newPassword = prompt("Defina a nova senha para o paciente (mín. 6 caracteres):");
    
    if (!newPassword || newPassword.length < 6) {
        if (newPassword) toast.error("A senha deve ter pelo menos 6 caracteres.");
        return;
    }

    setLoadingAccess(true);
    try {
        const { error } = await supabase.rpc('admin_reset_password', {
            target_user_id: userId,
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

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-pink-600 w-10 h-10" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Carregando VILAGI...</span>
      </div>
    </div>
  );

  if (!patient) return null;

  const navItems = [
    { label: "Visão Geral", path: "", icon: LayoutDashboard },
    { label: "Anamnese", path: "anamnesis", icon: ClipboardList },
    { label: "Bioimpedância", path: "bioimpedance", icon: Scale }, 
    { label: "Auditoria IA", path: "ai-analysis", icon: BrainCircuit }, 
    { label: "Planejamento", path: "treatment-plans", icon: Sparkles },
    { label: "Financeiro", path: "financial", icon: DollarSign },
    { label: "Receitas", path: "prescriptions", icon: ScrollText },
    { label: "Evolução", path: "evolution", icon: Activity },
    { label: "Galeria", path: "gallery", icon: ImageIcon },
    { label: "Termos", path: "terms", icon: FileText },
    { label: "Dados", path: "details", icon: User },
  ];

  const initials = patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 shadow-sm transition-all">
        <div className="max-w-[1600px] mx-auto px-6 pt-6 pb-0">
          <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
            <button 
              onClick={() => navigate("/patients")} 
              className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-pink-600 transition-all group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center gap-5 flex-1">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl p-0.5 bg-gradient-to-br from-pink-200 to-purple-200">
                        <div className="w-full h-full rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                            {patient.avatar_url ? (
                                <img src={patient.avatar_url} alt={patient.name} className="w-full h-full object-cover"/>
                            ) : (
                                <span className="text-xl font-bold text-pink-600 bg-pink-50 w-full h-full flex items-center justify-center">
                                    {initials}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-[3px] border-white dark:border-gray-900 rounded-full ${hasAccess ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{patient.name}</h1>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Paciente VILAGI</span>
                </div>
            </div>

            <div className="flex gap-2">
              {!hasAccess ? (
                  <Button 
                    onClick={handleCreateAccess} 
                    disabled={loadingAccess} 
                    className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-gray-900 text-white hover:bg-pink-600"
                  >
                      {loadingAccess ? <Loader2 size={14} className="animate-spin mr-2"/> : <Lock size={14} className="mr-2"/>}
                      Gerar Acesso
                  </Button>
              ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                          className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200"
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
              <Button variant="outline" className="rounded-xl border-gray-200 text-gray-500 font-bold text-xs h-10 px-4">
                <Settings size={16} />
              </Button>
            </div>
          </div>

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
      </header>
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 animate-in fade-in duration-500">
          <Outlet context={{ patient }} /> 
      </main>
    </div>
  );
}