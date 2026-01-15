import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  Calendar, 
  User, 
  Activity, 
  Camera, 
  ChevronRight, 
  MessageCircle,
  Pencil,
  Info,
  Play,
  Printer,
  Eye,
  EyeOff,
  CalendarPlus,
  Lock,
  Package,
  CreditCard,
  CheckCircle2,
  MapPin,
  AlertTriangle,
  ShieldAlert,
  ThermometerSun,
  Droplets,
  Target
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { format, differenceInYears, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "react-hot-toast";

// Importando o Modal de Execução
import ProcedureExecution from '../../components/patients/ProcedureExecution';

// --- HELPERS ---
const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
        scheduled: 'Agendado',
        confirmed: 'Confirmado',
        arrived: 'Na Recepção',
        in_service: 'Em Atendimento',
        completed: 'Finalizado',
        no_show: 'Não Compareceu',
        canceled: 'Cancelado'
    };
    return labels[status] || status;
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'arrived': return 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse';
        case 'in_service': return 'bg-pink-50 text-pink-700 border-pink-200';
        case 'completed': return 'bg-gray-100 text-gray-600 border-gray-200';
        case 'no_show': return 'bg-red-50 text-red-700 border-red-200';
        default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
};

const isYes = (val: any) => String(val || '').toLowerCase().includes('sim');

export default function PatientOverviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Controles
  const [consultationMode, setConsultationMode] = useState(false);
  const [revealPhotos, setRevealPhotos] = useState(false);
  
  // Modal de Execução
  const [executionModalOpen, setExecutionModalOpen] = useState(false);
  const [selectedPlanForExecution, setSelectedPlanForExecution] = useState<any>(null);

  // Dados
  const [patient, setPatient] = useState<any>(null);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [lastEvolution, setLastEvolution] = useState<any>(null);
  const [recentPhotos, setRecentPhotos] = useState<any[]>([]);
  const [activePlans, setActivePlans] = useState<any[]>([]); 
  
  const [stats, setStats] = useState({ totalEvolutions: 0, daysSinceLast: 0 });
  const [medicalAlerts, setMedicalAlerts] = useState<{level: string, text: string}[]>([]);
  const [inconsistencyAlert, setInconsistencyAlert] = useState<string | null>(null);
  
  // Tags Clínicas (Agora aceita null)
  const [clinicalTags, setClinicalTags] = useState<{fitz?: string | null, skinType?: string | null, complaint?: string | null}>({});

  useEffect(() => {
    if (id) loadOverviewData();
  }, [id]);

  useEffect(() => {
      if (consultationMode) setRevealPhotos(false);
  }, [consultationMode]);

  async function loadOverviewData() {
    try {
      setLoading(true);

      // 1. Paciente & Anamnese
      const { data: pat } = await supabase.from('patients').select('*').eq('id', id).single();
      if (pat) {
          setPatient(pat);
          const anam = pat.anamnesis || {};
          
          // Alertas de Risco
          const alerts = [];
          if (anam.alergias && anam.alergias.length > 2 && !anam.alergias.toLowerCase().includes('nao')) alerts.push({ level: 'high', text: `ALERGIA: ${anam.alergias}` });
          if (isYes(anam.gestante)) alerts.push({ level: 'high', text: "Gestante" });
          if (anam.doencas?.toLowerCase().includes('câncer')) alerts.push({ level: 'high', text: "Histórico Oncológico" });
          if (isYes(anam.fumante)) alerts.push({ level: 'medium', text: "Fumante" });
          if (anam.doencas?.toLowerCase().includes('diabetes')) alerts.push({ level: 'medium', text: "Diabético" });
          setMedicalAlerts(alerts.sort((a, b) => (a.level === 'high' ? -1 : 1)));

          // Tags Clínicas (Só preenche se existir valor real)
          setClinicalTags({
              fitz: (anam.fototipo || anam.facialFitzpatrick || null),
              skinType: (anam.biotipo || anam.tipodepele || null),
              complaint: (anam.queixaPrincipal || anam.queixa || null)
          });
      }

      // 2. Próximo Agendamento
      const { data: nextAppt } = await supabase
        .from('appointments')
        .select('*, services(name), profiles(first_name)')
        .eq('patient_id', id)
        .gt('start_time', new Date().toISOString())
        .neq('status', 'canceled')
        .order('start_time', { ascending: true })
        .limit(1)
        .single();
      
      if (nextAppt) setNextAppointment(nextAppt);

      // 3. Planos Ativos (Usando cliente_id)
      const { data: plansData } = await supabase
        .from('planos_clientes')
        .select(`*, service:services (id, name)`)
        .eq('cliente_id', id)
        .order('created_at', { ascending: false });

      if (plansData) {
          const normalized = plansData.map((pkg: any) => ({
             ...pkg,
             service_id: pkg.service_id || pkg.service?.id || pkg.procedure_id,
             service_name: pkg.service?.name || pkg.nome_plano
          }));
          const activeOnly = normalized.filter((p: any) => p.sessoes_restantes > 0);
          setActivePlans(activeOnly);
      }

      // 4. Evoluções
      const { data: evolutions } = await supabase
        .from('evolution_records')
        .select('*, profiles(first_name)')
        .eq('patient_id', id)
        .is('deleted_at', null)
        .order('date', { ascending: false });

      if (evolutions && evolutions.length > 0) {
          const last = evolutions[0];
          setLastEvolution(last);
          const daysDiff = differenceInDays(new Date(), new Date(last.date));
          setStats({ totalEvolutions: evolutions.length, daysSinceLast: daysDiff });

          if (nextAppt && last) {
              const lastProc = last.subject.toLowerCase();
              if (lastProc.includes('botox') && daysDiff < 75) {
                  setInconsistencyAlert(`Alerta: Intervalo de Toxina Botulínica curto (${daysDiff} dias).`);
              }
          }
      }

      // 5. Fotos
      const { data: photos } = await supabase
        .from('patient_photos')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false })
        .limit(4);

      if (photos) setRecentPhotos(photos);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // --- HANDLERS ---
  const handleUpdateStatus = async (newStatus: string) => {
      if (!nextAppointment) return;
      try {
          const { error } = await supabase
              .from('appointments')
              .update({ status: newStatus })
              .eq('id', nextAppointment.id);

          if (error) throw error;
          
          toast.success(`Status atualizado`);
          
          if (newStatus === 'completed') {
              navigate(`/patients/${id}/evolution`);
          } else {
              loadOverviewData(); 
          }
      } catch (error) {
          toast.error("Erro ao atualizar status");
      }
  };

  const handleOpenExecutionModal = (plan: any) => {
      setSelectedPlanForExecution(plan);
      setExecutionModalOpen(true);
  };

  const handleExecutionSuccess = () => {
      setExecutionModalOpen(false);
      setSelectedPlanForExecution(null);
      loadOverviewData();
      toast.success("Sessão realizada!");
  };

  const calculateAge = (dob: string) => {
      if (!dob) return "--";
      return differenceInYears(new Date(), new Date(dob)) + " anos";
  };

  const handlePrintSummary = () => {
      toast.success("Preparando resumo...");
      setTimeout(() => window.print(), 1000);
  };

  if (loading) return <div className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse">Carregando Prontuário...</div>;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
             <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Visão Geral</h2>
          </div>
          <Button onClick={handlePrintSummary} variant="ghost" size="sm" className="text-gray-400 hover:text-pink-600">
              <Printer size={18} className="mr-2"/> Resumo
          </Button>
      </div>

      {/* ALERTAS */}
      {medicalAlerts.length > 0 && (
          <div className="flex flex-wrap gap-3">
              {medicalAlerts.map((alert, i) => {
                  let style = "bg-blue-50 text-blue-700 border-blue-200"; 
                  if (alert.level === 'high') style = "bg-red-50 text-red-700 border-red-200 animate-pulse";
                  else if (alert.level === 'medium') style = "bg-amber-50 text-amber-700 border-amber-200";

                  return (
                      <div key={i} className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${style}`}>
                          <Info size={16}/>
                          <span className="text-xs font-black uppercase tracking-wide">{alert.text}</span>
                      </div>
                  );
              })}
          </div>
      )}

      {inconsistencyAlert && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center gap-3 text-orange-800">
              <Activity size={20} className="text-orange-500" />
              <span className="text-xs font-bold">{inconsistencyAlert}</span>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- COLUNA ESQUERDA --- */}
        <div className="space-y-6">
            
            {/* CARD DE PERFIL */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden pb-8">
                {/* Degradê Restaurado (Opacidade média para ficar bonito e legível) */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-pink-500/20 to-purple-600/20"></div>
                
                <div className="relative flex flex-col items-center text-center mt-8">
                    <div className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden bg-gray-100 mb-4">
                        {patient?.avatar_url ? (
                            <img src={patient.avatar_url} alt="Paciente" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={40}/></div>
                        )}
                    </div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{patient?.name}</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{calculateAge(patient?.birth_date)} • {patient?.occupation || 'Profissão não inf.'}</p>
                    
                    {/* TAGS CLÍNICAS (Só aparecem se tiver dado) */}
                    <div className="flex justify-center gap-2 mt-4 mb-4 flex-wrap">
                        {clinicalTags.fitz && (
                            <div className="bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2" title="Fototipo">
                                <ThermometerSun size={14} className="text-orange-500"/>
                                <span className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-300">Fitz: {clinicalTags.fitz}</span>
                            </div>
                        )}
                        {clinicalTags.skinType && (
                            <div className="bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2" title="Biotipo">
                                <Droplets size={14} className="text-blue-500"/>
                                <span className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-300">{clinicalTags.skinType}</span>
                            </div>
                        )}
                    </div>
                    
                    {clinicalTags.complaint && (
                        <div className="mb-6 w-full max-w-xs bg-pink-50/50 p-3 rounded-xl border border-pink-100 text-center mx-auto">
                            <span className="text-[9px] font-black uppercase text-pink-400 block mb-1 tracking-widest flex items-center justify-center gap-1"><Target size={10}/> Queixa</span>
                            <span className="text-xs font-bold text-pink-900 line-clamp-2">{clinicalTags.complaint}</span>
                        </div>
                    )}

                    {!consultationMode && (
                        <div className="flex flex-col gap-2 w-full max-w-xs">
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={() => navigate('/appointments/new')} className="bg-gray-900 hover:bg-black text-white h-12 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg">
                                    <CalendarPlus size={14} className="mr-2"/> Agendar
                                </Button>
                                <Button onClick={() => navigate(`/patients/${id}/treatment-plans`)} className="bg-pink-600 hover:bg-pink-700 text-white h-12 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg">
                                    <CreditCard size={14} className="mr-2"/> Orçamento
                                </Button>
                            </div>
                            <div className="flex gap-2 w-full mt-2">
                                <Button onClick={() => window.open(`https://wa.me/55${patient?.phone?.replace(/\D/g, '')}`, '_blank')} className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md">
                                    <MessageCircle size={16} className="mr-2"/> WhatsApp
                                </Button>
                                <Button onClick={() => navigate(`/patients/${id}/details`)} variant="outline" className="h-10 w-12 rounded-xl border-gray-200" title="Editar">
                                    <Pencil size={16}/>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CARD AGENDA */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={16} className="text-pink-500"/> Agenda
                    </h3>
                </div>

                {nextAppointment ? (
                    <div className={`p-5 rounded-[2rem] border ${getStatusColor(nextAppointment.status)}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-2xl font-black">
                                {format(new Date(nextAppointment.start_time), 'dd')}
                                <span className="text-xs font-bold opacity-60 ml-1 uppercase">{format(new Date(nextAppointment.start_time), 'MMM', { locale: ptBR })}</span>
                            </span>
                            <div className="text-right">
                                <span className="text-xl font-black block leading-none">
                                    {format(new Date(nextAppointment.start_time), 'HH:mm')}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-wide opacity-80">{getStatusLabel(nextAppointment.status)}</span>
                            </div>
                        </div>
                        <p className="text-sm font-bold line-clamp-1">{nextAppointment.services?.name || 'Consulta'}</p>
                        <p className="text-xs font-medium opacity-70 mt-1">Dr(a). {nextAppointment.profiles?.first_name || 'Profissional'}</p>
                        
                        {!consultationMode && (
                            <div className="mt-4 pt-4 border-t border-black/5 flex gap-2">
                                {nextAppointment.status === 'scheduled' && (
                                    <Button onClick={() => handleUpdateStatus('confirmed')} size="sm" className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-black uppercase">
                                        <CheckCircle2 size={12} className="mr-1"/> Confirmar
                                    </Button>
                                )}
                                {(nextAppointment.status === 'confirmed' || nextAppointment.status === 'scheduled') && (
                                    <Button onClick={() => handleUpdateStatus('arrived')} size="sm" className="w-full h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[9px] font-black uppercase">
                                        <MapPin size={12} className="mr-1"/> Chegou
                                    </Button>
                                )}
                                {nextAppointment.status === 'arrived' && (
                                    <Button onClick={() => handleUpdateStatus('in_service')} size="sm" className="w-full h-8 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-[9px] font-black uppercase">
                                        <Play size={12} className="mr-1"/> Iniciar
                                    </Button>
                                )}
                                {nextAppointment.status === 'in_service' && (
                                    <Button onClick={() => handleUpdateStatus('completed')} size="sm" className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase">
                                        <CheckCircle2 size={12} className="mr-1"/> Finalizar
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-2xl">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Sem agendamentos</p>
                    </div>
                )}
            </div>
        </div>

        {/* --- COLUNA DIREITA --- */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* MINI RESUMO */}
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                <div className="flex-1 min-w-[140px] bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Visitas</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalEvolutions}</p>
                </div>
                <div className="flex-1 min-w-[140px] bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Última Visita</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white">{stats.daysSinceLast === 0 ? 'Hoje' : `${stats.daysSinceLast} dias atrás`}</p>
                </div>
                <div className="flex-1 min-w-[140px] bg-pink-50 dark:bg-pink-900/20 p-4 rounded-2xl border border-pink-100 dark:border-pink-900/30 shadow-sm flex flex-col justify-center cursor-pointer hover:bg-pink-100 transition-colors" onClick={() => navigate(`/patients/${id}/evolution`)}>
                    <p className="text-[9px] font-black text-pink-400 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-sm font-black text-pink-700 dark:text-pink-300 flex items-center gap-1">VER HISTÓRICO <ChevronRight size={14}/></p>
                </div>
            </div>

            {/* WIDGET DE PLANOS ATIVOS */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-gray-900 dark:text-white">
                            <Package size={16} className="text-pink-500"/> Planos Ativos
                        </h3>
                        <Button onClick={() => navigate(`/patients/${id}/treatment-plans`)} variant="ghost" size="sm" className="text-[10px] uppercase font-bold text-gray-400 hover:text-pink-600 h-8">
                            Gerenciar
                        </Button>
                    </div>
                    
                    {activePlans.length > 0 ? (
                        <div className="grid gap-3">
                            {activePlans.map((plan) => {
                                const progress = (plan.sessoes_used / plan.sessoes_totais) * 100;
                                return (
                                    <div key={plan.id} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <span className="text-sm font-bold text-gray-900 dark:text-white block uppercase text-[11px]">{plan.service_name || "Tratamento"}</span>
                                                <span className="text-xs font-mono text-gray-400 font-bold">{plan.sessoes_used}/{plan.sessoes_totais} realizadas</span>
                                            </div>
                                            
                                            {!consultationMode && (
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => handleOpenExecutionModal(plan)}
                                                    className="h-7 text-[9px] uppercase font-black bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 shadow-sm"
                                                >
                                                    <Play size={10} className="mr-1" fill="currentColor"/> Realizar
                                                </Button>
                                            )}
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mt-2">
                                            <div 
                                                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-1000" 
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-6 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nenhum plano ativo</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ÚLTIMA EVOLUÇÃO */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 relative">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                        <Activity size={20} className="text-emerald-500"/> Último Registro
                    </h3>
                </div>

                {lastEvolution ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                {format(new Date(lastEvolution.date), "dd/MM/yyyy")}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                                Dr(a). {lastEvolution.profiles?.first_name || "Profissional"}
                            </span>
                        </div>
                        <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <h4 className="text-sm font-black text-gray-800 dark:text-white uppercase mb-2">{lastEvolution.subject}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                                {lastEvolution.description}
                            </p>
                        </div>
                        
                        {!consultationMode && (
                            <Button onClick={() => navigate(`/patients/${id}/evolution`)} className="w-full bg-gray-900 hover:bg-black text-white h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl">
                                Continuar Prontuário
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-10 opacity-50">
                        <p className="text-sm text-gray-400 font-medium mb-4">Nenhuma evolução registrada.</p>
                        {!consultationMode && (
                            <Button onClick={() => navigate(`/patients/${id}/evolution`)} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase">
                                Iniciar Prontuário
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* FOTOS RECENTES */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                        <Camera size={20} className="text-purple-500"/> Imagens Recentes
                    </h3>
                    <Button onClick={() => navigate(`/patients/${id}/gallery`)} variant="ghost" size="sm" className="text-xs font-black uppercase text-purple-600 hover:bg-purple-50">
                        Ver Tudo
                    </Button>
                </div>

                {consultationMode && !revealPhotos ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200">
                        <Lock size={32} className="text-gray-400 mb-2"/>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Imagens Ocultas (Privacidade)</p>
                        <Button onClick={() => setRevealPhotos(true)} size="sm" variant="outline" className="text-[10px] font-black uppercase">
                            Exibir Imagens
                        </Button>
                    </div>
                ) : (
                    recentPhotos.length > 0 ? (
                        <div className="grid grid-cols-4 gap-4">
                            {recentPhotos.map((photo, i) => (
                                <div key={i} className="aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 relative group cursor-pointer" onClick={() => navigate(`/patients/${id}/gallery`)}>
                                    <img src={photo.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Recente" />
                                    <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 text-center">
                                        <span className="text-[8px] font-bold text-white uppercase">{format(new Date(photo.created_at), 'dd/MM')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-2xl">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sem fotos</p>
                        </div>
                    )
                )}
            </div>

        </div>
      </div>

      {/* MODAL DE EXECUÇÃO */}
      {executionModalOpen && selectedPlanForExecution && (
        <ProcedureExecution 
            isOpen={executionModalOpen} 
            onClose={() => setExecutionModalOpen(false)} 
            onSuccess={handleExecutionSuccess} 
            plan={selectedPlanForExecution} 
        />
      )}
    </div>
  );
}