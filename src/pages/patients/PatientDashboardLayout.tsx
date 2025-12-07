import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  ArrowLeft, 
  User, 
  ClipboardList, 
  Activity, 
  DollarSign, 
  Calendar,
  Camera,      
  PenTool,     
  ScrollText,
  Scale,
  LayoutDashboard,
  AlertTriangle,
  MoreHorizontal,
  MessageCircle,
  Printer,
  Pencil,
  Send,
  ChevronRight
} from "lucide-react";
import { toast } from "react-hot-toast";
import generateAnamnesisPdf from "../../utils/generateAnamnesisPdf";

export function PatientDashboardLayout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados dos Menus
  const [showActions, setShowActions] = useState(false);
  const [showWhatsappMenu, setShowWhatsappMenu] = useState(false); 

  // Busca dados
  useEffect(() => {
    async function fetchHeaderData() {
      if (!id || id === 'new') return;
      try {
        const { data } = await supabase
          .from("patients")
          .select("*, profiles(first_name, last_name, phone)")
          .eq("id", id)
          .single();
        if (data) setPatient(data);
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

  // --- LÓGICA DE ALERTAS ---
  const alerts = [];
  if (patient?.alergias_medicamentosas && patient.alergias_medicamentosas.length > 0) {
      alerts.push({ type: 'danger', text: 'ALÉRGICO', detail: patient.alergias_medicamentosas });
  }
  if (patient?.doencas_cronicas && patient.doencas_cronicas.length > 0) {
      alerts.push({ type: 'warning', text: 'COMORBIDADES', detail: patient.doencas_cronicas });
  }
  if (patient?.gestante) {
      alerts.push({ type: 'info', text: 'GESTANTE', detail: 'Contraindicações aplicáveis' });
  }

  // --- TEMPLATES DE WHATSAPP ---
  const msgTemplates = [
      { label: "Confirmar Agendamento", text: `Olá ${firstName}, tudo bem? Gostaríamos de confirmar seu horário conosco.` },
      { label: "Pós-Procedimento", text: `Oi ${firstName}! Como você está se sentindo após o procedimento? Alguma dúvida?` },
      { label: "Feliz Aniversário", text: `Parabéns ${firstName}! 🎉 A equipe deseja um dia maravilhoso para você!` },
      { label: "Lembrete de Retorno", text: `Olá ${firstName}, já está na hora do seu retorno. Vamos agendar?` },
      { label: "Pagamento Pendente", text: `Oi ${firstName}, identificamos uma pendência no seu cadastro. Podemos ajudar?` },
  ];

  const sendWhatsApp = (text: string) => {
      const phone = patient?.profiles?.phone || patient?.phone;
      if (!phone) return toast.error("Sem telefone cadastrado.");
      
      const cleanPhone = phone.replace(/\D/g, "");
      const encodedText = encodeURIComponent(text);
      window.open(`https://wa.me/55${cleanPhone}?text=${encodedText}`, "_blank");
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
                <div className="space-y-2">
                    <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
            </div>
        </div>
        <div className="max-w-7xl mx-auto w-full p-6 space-y-6"><div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 z-30 sticky top-0">
        
        {/* BARRA DE ALERTAS */}
        {alerts.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/50 px-4 py-2 flex flex-wrap gap-3 justify-center sm:justify-start items-center animate-in slide-in-from-top-2">
                <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle size={14} /> ATENÇÃO CLÍNICA:
                </span>
                {alerts.map((alert, idx) => (
                    <span key={idx} className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide border ${
                        alert.type === 'danger' ? 'bg-red-100 text-red-700 border-red-200' : 
                        alert.type === 'warning' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                        'bg-blue-100 text-blue-700 border-blue-200'
                    }`} title={typeof alert.detail === 'string' ? alert.detail : alert.detail.join(', ')}>
                        {alert.text}
                    </span>
                ))}
            </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate("/patients")} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                    <ArrowLeft size={22} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight flex items-center gap-2">{patientName}</h1>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        {patient?.date_of_birth && (<span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300"><Calendar size={12} /> {getAge(patient.date_of_birth)}</span>)}
                        <span className="uppercase tracking-wider font-semibold text-pink-600">Prontuário Digital</span>
                    </div>
                </div>
            </div>

            {/* --- MENU DE AÇÕES RÁPIDAS --- */}
            <div className="relative">
                <button onClick={() => { setShowActions(!showActions); setShowWhatsappMenu(false); }} className="flex items-center gap-2 px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                    Ações <MoreHorizontal size={16} />
                </button>

                {showActions && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            
                            {/* Menu Principal */}
                            {!showWhatsappMenu ? (
                                <>
                                    <button onClick={() => { navigate(`details`); setShowActions(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3">
                                        <Pencil size={16} className="text-blue-500" /> Editar Cadastro
                                    </button>
                                    
                                    {/* Botão que abre o submenu do WhatsApp */}
                                    <button onClick={(e) => { e.stopPropagation(); setShowWhatsappMenu(true); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-3"><MessageCircle size={16} className="text-green-600" /> WhatsApp Inteligente</div>
                                        <ChevronRight size={14} className="text-gray-400" />
                                    </button>

                                    <button onClick={() => { navigate("/appointments/new"); setShowActions(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-t border-gray-100 dark:border-gray-700">
                                        <Calendar size={16} className="text-purple-600" /> Agendar Retorno
                                    </button>
                                    <button onClick={handlePrint} className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-t border-gray-100 dark:border-gray-700">
                                        <Printer size={16} className="text-gray-500" /> Imprimir Prontuário
                                    </button>
                                    <button onClick={() => { navigate(`financial`); setShowActions(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-t border-gray-100 dark:border-gray-700">
                                        <DollarSign size={16} className="text-blue-600" /> Novo Pagamento
                                    </button>
                                </>
                            ) : (
                                /* Submenu WhatsApp */
                                <div className="bg-gray-50 dark:bg-gray-900">
                                    <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
                                        <button onClick={(e) => { e.stopPropagation(); setShowWhatsappMenu(false); }} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><ArrowLeft size={14}/></button>
                                        <span className="text-xs font-bold uppercase text-gray-500">Escolha a Mensagem</span>
                                    </div>
                                    {msgTemplates.map((tpl, i) => (
                                        <button key={i} onClick={() => sendWhatsApp(tpl.text)} className="w-full text-left px-4 py-3 text-xs text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 border-b border-gray-100 dark:border-gray-800 last:border-0 flex items-center gap-2">
                                            <Send size={12} className="text-green-500" /> {tpl.label}
                                        </button>
                                    ))}
                                    <button onClick={() => sendWhatsApp("")} className="w-full text-left px-4 py-3 text-xs font-bold text-green-600 hover:bg-green-50 flex items-center gap-2">
                                        <MessageCircle size={12} /> Abrir Conversa Vazia
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
          </div>

          {/* BARRA DE ABAS */}
          <div className="flex space-x-1 overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-gray-700 mt-4">
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

      <main className="flex-1 max-w-7xl mx-auto w-full py-6 px-4 sm:px-6 lg:px-8">
        <Outlet /> 
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-all whitespace-nowrap outline-none focus:outline-none ${active ? "border-pink-600 text-pink-600 dark:text-pink-400 bg-pink-50/50 dark:bg-pink-900/10 rounded-t-md" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white"}`}
    >
      {icon} <span>{label}</span>
    </button>
  );
}