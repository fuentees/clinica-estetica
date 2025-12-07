import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  ArrowLeft, User, ClipboardList, Activity, DollarSign, Calendar,
  Camera, PenTool, ScrollText, Scale, LayoutDashboard,
  AlertTriangle, MoreHorizontal, MessageCircle, Printer, Pencil,
  Send, ChevronRight, Star, Clock, CheckCircle2
} from "lucide-react";
import { toast } from "react-hot-toast";
import generateAnamnesisPdf from "../../utils/generateAnamnesisPdf";

export function PatientDashboardLayout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastVisit, setLastVisit] = useState<string | null>(null);
  
  // Estados dos Menus
  const [showActions, setShowActions] = useState(false);
  const [showWhatsappMenu, setShowWhatsappMenu] = useState(false); 

  // Busca dados e infos extras para o "HUD"
  useEffect(() => {
    async function fetchHeaderData() {
      if (!id || id === 'new') return;
      try {
        // Busca paciente
        const { data } = await supabase
          .from("patients")
          .select("*, profiles(first_name, last_name, phone)")
          .eq("id", id)
          .single();
        
        // Busca última visita (para o HUD)
        const { data: lastTx } = await supabase
            .from("treatments")
            .select("data_procedimento")
            .eq("patient_id", id)
            .order("data_procedimento", { ascending: false })
            .limit(1)
            .single();

        if (data) {
            setPatient(data);
            if(lastTx) setLastVisit(lastTx.data_procedimento);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    fetchHeaderData();
  }, [id]);

  const isActive = (path: string) => {
    if (path === "") return location.pathname.endsWith(`/${id}`) || location.pathname.endsWith(`/${id}/`);
    return location.pathname.includes(path);
  };

  const getAge = (dob: string) => {
    if (!dob) return "";
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    return `${age} anos`;
  };

  const patientName = patient?.profiles 
    ? `${patient.profiles.first_name} ${patient.profiles.last_name}` 
    : (patient?.name || patient?.nome || "Paciente");
  
  const firstName = patient?.profiles?.first_name || patient?.name?.split(' ')[0] || "Paciente";

  // --- BADGES INTELIGENTES (PREMIUM) ---
  const badges = [];
  
  // Exemplo de lógica VIP (se tiver gasto > 0 ou campo vip no banco)
  // badges.push({ text: "VIP", color: "bg-amber-100 text-amber-700 border-amber-200", icon: <Star size={10} fill="currentColor"/> });
  
  // Aniversariante
  if (patient?.date_of_birth) {
      const dob = new Date(patient.date_of_birth);
      const today = new Date();
      if (dob.getMonth() === today.getMonth()) {
          badges.push({ text: "Aniversariante", color: "bg-purple-100 text-purple-700 border-purple-200", icon: <Star size={10} /> });
      }
  }

  // Novo Paciente (criado nos últimos 30 dias)
  if (patient?.created_at) {
      const created = new Date(patient.created_at);
      const diff = new Date().getTime() - created.getTime();
      if (diff < 30 * 24 * 60 * 60 * 1000) {
          badges.push({ text: "Novo", color: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle2 size={10} /> });
      }
  }

  // Alertas Médicos
  if (patient?.alergias_medicamentosas?.length > 0) badges.push({ text: "Alergia", color: "bg-red-100 text-red-700 border-red-200", icon: <AlertTriangle size={10} /> });
  if (patient?.gestante) badges.push({ text: "Gestante", color: "bg-pink-100 text-pink-700 border-pink-200", icon: <User size={10} /> });


  // --- TEMPLATES WHATSAPP ---
  const msgTemplates = [
      { label: "Confirmar Agendamento", text: `Olá ${firstName}, tudo bem? Gostaríamos de confirmar seu horário conosco.` },
      { label: "Pós-Procedimento", text: `Oi ${firstName}! Como você está se sentindo após o procedimento? Alguma dúvida?` },
      { label: "Feliz Aniversário", text: `Parabéns ${firstName}! 🎉 A equipe deseja um dia maravilhoso para você!` },
      { label: "Lembrete de Retorno", text: `Olá ${firstName}, já está na hora do seu retorno. Vamos agendar?` },
  ];

  const sendWhatsApp = (text: string) => {
      const phone = patient?.profiles?.phone || patient?.phone;
      if (!phone) return toast.error("Sem telefone cadastrado.");
      window.open(`https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
      setShowActions(false);
      setShowWhatsappMenu(false);
  };

  const handlePrint = () => {
      if (!patient) return;
      const signature = patient.procedimentos_detalhes_json?.assinatura_base64 || null;
      generateAnamnesisPdf(patient, patient, signature);
      toast.success("Gerando PDF...");
      setShowActions(false);
  };

  // SKELETON
  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col animate-pulse">
        <div className="bg-white dark:bg-gray-800 h-48 border-b dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="space-y-2"><div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded" /><div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" /></div>
            </div>
        </div>
        <div className="max-w-7xl mx-auto w-full p-6 space-y-6"><div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans">
      
      {/* --- CABEÇALHO GLASSMORPHISM --- */}
      <header className="bg-white/90 backdrop-blur-md dark:bg-gray-800/90 shadow-sm border-b dark:border-gray-700 z-40 sticky top-0 transition-all duration-300">
        
        {/* Barra de Contexto (Opcional) - Aparece se tiver alergia crítica */}
        {patient?.alergias_medicamentosas?.length > 0 && (
            <div className="bg-red-600 text-white px-4 py-1 text-xs font-bold flex justify-center items-center tracking-wide animate-in slide-in-from-top">
                <AlertTriangle size={12} className="mr-2" />
                PACIENTE ALÉRGICO: {patient.alergias_medicamentosas.join(", ").toUpperCase()}
            </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-0">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-4">
            
            {/* Bloco Esquerdo: Foto/Ícone + Nome + Badges */}
            <div className="flex items-start gap-4">
                <button onClick={() => navigate("/patients")} className="mt-1 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 transition-colors" title="Voltar">
                    <ArrowLeft size={20} />
                </button>
                
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{patientName}</h1>
                        
                        {/* BADGES */}
                        {badges.map((b, i) => (
                            <span key={i} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${b.color}`}>
                                {b.icon} {b.text}
                            </span>
                        ))}
                    </div>

                    {/* HUD (Heads-Up Display) - Resumo Rápido */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {patient?.date_of_birth && (
                            <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded">
                                <Calendar size={12} /> {getAge(patient.date_of_birth)}
                            </span>
                        )}
                        
                        <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded" title="Último atendimento">
                            <Clock size={12} /> Último: {lastVisit ? new Date(lastVisit).toLocaleDateString('pt-BR') : 'Nunca'}
                        </span>

                        <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded cursor-help" title="Prontuário ID">
                            <ScrollText size={12} /> ID: {id?.slice(0,6)}...
                        </span>
                    </div>
                </div>
            </div>

            {/* --- MENU DE AÇÕES (Botão Premium) --- */}
            <div className="relative self-end md:self-auto">
                <button 
                    onClick={() => setShowActions(!showActions)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${showActions ? 'bg-gray-100 text-gray-900' : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white'}`}
                >
                    Ações Rápidas <MoreHorizontal size={16} />
                </button>

                {showActions && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5">
                            
                            {!showWhatsappMenu ? (
                                <>
                                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                                        <p className="text-xs font-bold text-gray-400 uppercase">Menu Principal</p>
                                    </div>
                                    <button onClick={() => { navigate(`details`); setShowActions(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3">
                                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded"><Pencil size={14} /></div> Editar Cadastro
                                    </button>
                                    
                                    <button onClick={(e) => { e.stopPropagation(); setShowWhatsappMenu(true); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-green-100 text-green-600 rounded"><MessageCircle size={14} /></div> WhatsApp
                                        </div>
                                        <ChevronRight size={14} className="text-gray-400" />
                                    </button>

                                    <button onClick={() => { navigate("/appointments/new"); setShowActions(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3">
                                        <div className="p-1.5 bg-purple-100 text-purple-600 rounded"><Calendar size={14} /></div> Agendar
                                    </button>
                                    <button onClick={handlePrint} className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-t border-gray-100 dark:border-gray-700">
                                        <Printer size={16} className="text-gray-400" /> Imprimir Prontuário
                                    </button>
                                </>
                            ) : (
                                <div className="bg-white dark:bg-gray-800">
                                    <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                                        <button onClick={(e) => { e.stopPropagation(); setShowWhatsappMenu(false); }} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"><ArrowLeft size={14}/></button>
                                        <span className="text-xs font-bold uppercase text-gray-500">Enviar Mensagem</span>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {msgTemplates.map((tpl, i) => (
                                            <button key={i} onClick={() => sendWhatsApp(tpl.text)} className="w-full text-left px-4 py-3 text-xs text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 border-b border-gray-50 dark:border-gray-700 last:border-0 flex items-center gap-2 group">
                                                <Send size={12} className="text-gray-300 group-hover:text-green-500" /> {tpl.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
          </div>

          {/* --- BARRA DE ABAS (SCROLLABLE & CLEAN) --- */}
          <div className="flex space-x-6 overflow-x-auto no-scrollbar mt-2">
            <TabButton active={isActive("") && !isActive("details") && !isActive("anamnesis")} onClick={() => navigate(`/patients/${id}`)} icon={<LayoutDashboard size={18} />} label="Visão Geral" />
            <TabButton active={isActive('details')} onClick={() => navigate(`details`)} icon={<User size={18} />} label="Cadastro" />
            <TabButton active={isActive('anamnesis')} onClick={() => navigate(`anamnesis`)} icon={<ClipboardList size={18} />} label="Anamnese" />
            <TabButton active={isActive('bioimpedance')} onClick={() => navigate(`bioimpedance`)} icon={<Scale size={18} />} label="Bioimpedância" />
            <TabButton active={isActive('planning')} onClick={() => navigate(`planning`)} icon={<PenTool size={18} />} label="Planejamento" />
            <TabButton active={isActive('terms')} onClick={() => navigate(`terms`)} icon={<ScrollText size={18} />} label="Termos" />
            <TabButton active={isActive('gallery')} onClick={() => navigate(`gallery`)} icon={<Camera size={18} />} label="Fotos" />
            <TabButton active={isActive('evolution')} onClick={() => navigate(`evolution`)} icon={<Activity size={18} />} label="Histórico" />
            <TabButton active={isActive('financial')} onClick={() => navigate(`financial`)} icon={<DollarSign size={18} />} label="Financeiro" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full py-6 px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Outlet /> 
      </main>
    </div>
  );
}

// Componente Visual do Botão da Aba (Refinado)
function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        group flex items-center gap-2 pb-3 pt-1 border-b-2 text-sm font-medium transition-all whitespace-nowrap outline-none
        ${active 
          ? "border-pink-600 text-pink-600 dark:text-pink-400" 
          : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-200"
        }
      `}
    >
      <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-pink-50 dark:bg-pink-900/20' : 'group-hover:bg-gray-100 dark:group-hover:bg-gray-800'}`}>
        {icon}
      </div>
      <span>{label}</span>
    </button>
  );
}