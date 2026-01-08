import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  Activity, 
  Scale, 
  ArrowRight, 
  Loader2, 
  Calendar, 
  History, 
  Pencil,
  Ban,
  DollarSign,
  User,
  ShieldCheck,
  Plus,
  Lock, 
  Mail, 
  MapPin, 
  Edit 
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { PatientPackagesWidget } from "../../components/patients/PatientPackagesWidget";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Importação do Modal
import { PatientAccessModal } from "../../components/patients/PatientAccessModal";

interface PatientContext {
  patient: {
    id: string;
    name: string;
  };
}

interface Appointment {
  id: string;
  start_time: string;
  status: string;
  notes?: string;
  professional: {
    first_name: string;
    last_name: string;
    role: string;
    formacao?: string; 
    avatar_url?: string; 
  } | null;
}

interface OverviewData {
  appointments: Appointment[];
  lastBio: any[];
  totalSessions: number;
}

export default function PatientOverviewPage() {
  const { patient } = useOutletContext<PatientContext>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  
  const [data, setData] = useState<OverviewData>({
    appointments: [], 
    lastBio: [],
    totalSessions: 0
  });

  async function loadOverview() {
    if (!patient?.id) return;
    try {
      // 1. Busca dados completos do paciente (CPF, Senha, Foto)
      const { data: pDetails } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patient.id)
        .single();
        
      if (pDetails) setPatientDetails(pDetails);

      // 2. Busca Agendamentos
      const { data: appts } = await supabase
        .from("appointments")
        .select(`
          id, start_time, status, notes,
          professional:profiles!professional_id (first_name, last_name, role, formacao, avatar_url)
        `)
        .eq("patient_id", patient.id)
        .order("start_time", { ascending: false });

      const appointments: Appointment[] = (appts || []).map((item: any) => ({
        id: item.id,
        start_time: item.start_time,
        status: item.status,
        notes: item.notes,
        professional: Array.isArray(item.professional) ? item.professional[0] : item.professional
      }));

      // 3. Busca Bioimpedância
      const { data: bio } = await supabase
        .from("bioimpedance_records") 
        .select("*")
        .eq("patient_id", patient.id)
        .order("date", { ascending: false })
        .limit(1);

      const completedCount = appointments.filter(a => a.status === 'completed' || a.status === 'concluido').length;

      setData({
          appointments: appointments,
          totalSessions: completedCount,
          lastBio: bio || []
      });

    } catch (error) { 
      console.error("Erro overview:", error); 
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, [patient?.id]);

  const handleCancelAppointment = async (apptId: string) => {
      if (!window.confirm("Deseja realmente cancelar este agendamento?")) return;
      await supabase.from('appointments').update({ status: 'canceled' }).eq('id', apptId);
      toast.success("Agendamento cancelado.");
      loadOverview();
  };

  const formatDateCard = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: format(date, 'dd'),
      month: format(date, 'MMM', { locale: ptBR }).toUpperCase(),
      weekday: format(date, 'EEEE', { locale: ptBR }),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'concluido': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case 'canceled':
      case 'cancelado': return 'text-rose-700 bg-rose-50 border-rose-100';
      case 'no_show':
      case 'falta': return 'text-amber-700 bg-amber-50 border-amber-100';
      default: return 'text-pink-700 bg-pink-50 border-pink-100';
    }
  };

  if (loading && !patientDetails) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-pink-600" size={40} />
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Carregando Prontuário...</p>
    </div>
  );
  
  const bio = data.lastBio?.[0];
  const now = new Date();

  const nextAppointments = data.appointments
    .filter((a) => new Date(a.start_time) >= now && a.status !== 'canceled' && a.status !== 'cancelado')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const pastAppointments = data.appointments
    .filter((a) => new Date(a.start_time) < now);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* --- CABEÇALHO DO PACIENTE (Agora aparece sempre) --- */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 to-purple-600"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[2rem] bg-gray-100 dark:bg-gray-700 overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl flex items-center justify-center text-gray-400">
                  {patientDetails?.avatar_url ? (
                    <img src={patientDetails.avatar_url} alt={patient.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">
                        {patient.name}
                    </h1>
                    
                    {/* Badge de Status (Só aparece se já carregou os detalhes) */}
                    {patientDetails && (
                        patientDetails.accountId ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 text-[9px] font-black uppercase tracking-widest border border-green-200">
                                <ShieldCheck size={10}/> Portal Ativo
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 text-[9px] font-black uppercase tracking-widest border border-gray-200">
                                <Lock size={10}/> Sem Acesso
                            </span>
                        )
                    )}
                  </div>
                  
                  {patientDetails && (
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5"><MapPin size={12} className="text-pink-400"/> {patientDetails.cidade || "Local não informado"}</span>
                        {patientDetails.email && <span className="flex items-center gap-1.5"><Mail size={12} className="text-pink-400"/> {patientDetails.email}</span>}
                      </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {/* BOTÃO DE ACESSO */}
                <Button 
                  onClick={() => setIsAccessModalOpen(true)}
                  disabled={!patientDetails} // Desabilita enquanto carrega
                  className={`h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 ${
                    patientDetails?.accountId 
                    ? "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-pink-200 hover:text-pink-600" 
                    : "bg-gray-900 text-white hover:bg-black"
                  }`}
                >
                  {!patientDetails ? (
                      <Loader2 className="animate-spin mr-2" size={14} />
                  ) : patientDetails.accountId ? (
                      <><Lock size={14} className="mr-2"/> Redefinir Senha</>
                  ) : (
                      <><ShieldCheck size={14} className="mr-2 text-pink-500"/> Gerar Acesso</>
                  )}
                </Button>
                
                <Button 
                  className="h-12 w-12 p-0 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white shadow-lg"
                  onClick={() => navigate(`../details`)} 
                >
                  <Edit size={18}/>
                </Button>
              </div>
            </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA PRINCIPAL */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* 1. KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative overflow-hidden p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 group">
                  <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:scale-110 transition-transform italic font-black text-8xl text-pink-500">#</div>
                  <div className="flex justify-between items-start mb-6">
                      <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-2xl text-pink-600">
                          <Activity size={24}/>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Frequência</span>
                  </div>
                  <h3 className="text-5xl font-black text-gray-900 dark:text-white italic tracking-tighter mb-1">
                      {data.totalSessions}
                  </h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sessões Concluídas</p>
              </div>

              <div className="relative overflow-hidden p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 group">
                  <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:scale-110 transition-transform italic font-black text-8xl text-blue-500">kg</div>
                  <div className="flex justify-between items-start mb-6">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600">
                          <Scale size={24}/>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Métrica Corporal</span>
                  </div>
                  {bio ? (
                      <>
                          <h3 className="text-5xl font-black text-gray-900 dark:text-white italic tracking-tighter">
                              {Number(bio.weight).toFixed(1)} <span className="text-xl text-gray-300">kg</span>
                          </h3>
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-2 flex items-center gap-1">
                             <ShieldCheck size={12}/> Última pesagem: {new Date(bio.date).toLocaleDateString('pt-BR')}
                          </p>
                      </>
                  ) : (
                      <p className="text-gray-300 py-4 font-bold uppercase text-xs italic tracking-widest">Nenhuma bioimpedância registrada</p>
                  )}
                  <button onClick={() => navigate("../bioimpedance")} className="mt-6 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:gap-4 transition-all">
                      Acessar Evolução <ArrowRight size={14}/>
                  </button>
              </div>
            </div>

            {/* 2. PRÓXIMOS AGENDAMENTOS */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.3em] flex items-center gap-3">
                      <Calendar className="text-pink-600" size={18} /> Próximos Agendamentos
                    </h3>
                    <Button size="sm" onClick={() => navigate('/appointments/new')} className="h-9 px-4 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                      <Plus size={14} className="mr-1"/> Reservar Horário
                    </Button>
                </div>

                {nextAppointments.length === 0 ? (
                    <div className="bg-gray-50/50 dark:bg-gray-900/50 p-12 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800 text-center">
                      <Calendar size={40} className="text-gray-200 mx-auto mb-4" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Não há sessões futuras reservadas.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {nextAppointments.map((apt) => {
                            const { day, month, weekday, time } = formatDateCard(apt.start_time);
                            const profName = apt.professional ? `${apt.professional.first_name} ${apt.professional.last_name || ''}` : "Especialista";
                            
                            return (
                                <div key={apt.id} className="group bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:border-pink-100 transition-all flex items-center gap-6">
                                    <div className="flex-shrink-0 flex flex-col items-center justify-center bg-gray-900 w-20 h-20 rounded-3xl shadow-lg group-hover:rotate-3 transition-transform">
                                        <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">{month}</span>
                                        <span className="text-3xl font-black text-white italic tracking-tighter leading-none">{day}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                                            <span className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                                                {weekday}, {time}
                                            </span>
                                            <span className={`text-[9px] px-3 py-1 rounded-lg font-black uppercase tracking-widest border-2 w-fit ${getStatusColor(apt.status)}`}>
                                                {apt.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-2xl w-fit pr-6 border border-gray-100 dark:border-gray-800">
                                            <div className="w-10 h-10 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0 border-2 border-white">
                                                {apt.professional?.avatar_url ? (
                                                    <img src={apt.professional.avatar_url} alt={profName} className="w-full h-full object-cover"/>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-pink-100 text-pink-600 font-black text-xs uppercase italic">
                                                        {profName[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase">{profName}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{apt.professional?.formacao || "Expertise Clínica"}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        <button onClick={() => navigate(`/appointments/${apt.id}/edit`)} className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-inner" title="Editar">
                                            <Pencil size={18} />
                                        </button>
                                        <button onClick={() => handleCancelAppointment(apt.id)} className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-inner" title="Cancelar">
                                            <Ban size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 3. MEMÓRIA CLÍNICA */}
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex gap-3 items-center">
                        <History size={18} className="text-gray-400"/> Memória Clínica
                    </h3>
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic">{pastAppointments.length} Visitas</span>
                </div>
                
                <div className="p-4 space-y-2">
                    {pastAppointments.length === 0 ? (
                        <p className="text-center text-gray-300 py-10 font-bold uppercase text-[10px] tracking-widest italic">Nenhum histórico arquivado.</p>
                    ) : (
                        pastAppointments.map((apt) => (
                            <div key={apt.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${apt.status === 'completed' || apt.status === 'concluido' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`}></div>
                                    <div>
                                        <p className="font-black text-gray-900 dark:text-gray-200 italic tracking-tighter uppercase text-sm">
                                            {new Date(apt.start_time).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Especialista: {apt.professional?.first_name || "Clínica"}</p>
                                    </div>
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border-2 ${getStatusColor(apt.status)}`}>
                                    {apt.status}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        {/* COLUNA LATERAL */}
        <div className="lg:col-span-1 space-y-8">
            <PatientPackagesWidget patientId={patient.id} />
            
            {/* STATUS FINANCEIRO */}
            <div className="bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-120 transition-transform duration-1000">
                  <DollarSign size={140} />
                </div>
                <h3 className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3 italic">
                    Conta Corrente
                </h3>
                <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Aberto</span>
                     <span className="text-2xl font-black italic tracking-tighter">R$ 0,00</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">LTV</span>
                     <span className="text-2xl font-black italic tracking-tighter text-emerald-400">R$ --</span>
                  </div>
                  <button 
                    onClick={() => navigate("../financial")}
                    className="w-full mt-4 h-12 bg-white text-gray-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-pink-500 hover:text-white transition-all shadow-xl shadow-black/40"
                  >
                    Gestão de Ativos
                  </button>
                </div>
            </div>

            {/* AUDITORIA IA */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-800 rounded-[3rem] p-10 text-white shadow-xl">
               <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="text-indigo-200" size={24}/>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] italic">IA Safety Auditor</h3>
               </div>
               <p className="text-xs font-medium text-indigo-100 leading-relaxed mb-8 italic">
                 Analise os riscos procedimentais deste paciente cruzando dados de anamnese e medicamentos em uso.
               </p>
               <button 
                onClick={() => navigate("../ai-analysis")}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:gap-4 transition-all"
               >
                 Iniciar Auditoria <ArrowRight size={14}/>
               </button>
            </div>
        </div>
      </div>

      {/* ✅ O MODAL (Janela que abre ao clicar) */}
      {isAccessModalOpen && patientDetails && (
        <PatientAccessModal 
          patient={{
             id: patientDetails.id,
             name: patientDetails.name,
             email: patientDetails.email,
             clinic_id: patientDetails.clinicId || patientDetails.clinic_id,
             cpf: patientDetails.cpf,
             phone: patientDetails.phone
          }} 
          onClose={() => {
            setIsAccessModalOpen(false);
            loadOverview(); 
          }} 
        />
      )}

    </div>
  );
}