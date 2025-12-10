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
  User
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { PatientPackagesWidget } from "../../components/patients/PatientPackagesWidget";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
    formacao?: string; // Adicionado especialidade
    avatar_url?: string; // Adicionado foto
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
  
  const [data, setData] = useState<OverviewData>({
    appointments: [], 
    lastBio: [],
    totalSessions: 0
  });

  // --- CARREGAR DADOS ---
  async function loadOverview() {
    if (!patient?.id) return;
    try {
      // 1. Busca TUDO (Passado e Futuro)
      // Adicionei formacao e avatar_url na query
      const { data: appts, error } = await supabase
        .from("appointments")
        .select(`
          id, start_time, status, notes,
          professional:profiles(first_name, last_name, role, formacao, avatar_url)
        `)
        .eq("patient_id", patient.id)
        .order("start_time", { ascending: false }); // Do mais novo para o mais velho

      if (error) throw error;

      const appointments: Appointment[] = (appts || []).map((item: any) => ({
        id: item.id,
        start_time: item.start_time,
        status: item.status,
        notes: item.notes,
        professional: Array.isArray(item.professional) ? item.professional[0] : item.professional
      }));

      // 2. Busca Bioimpedância
      const { data: bio } = await supabase
        .from("bioimpedance")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const completedCount = appointments.filter(a => a.status === 'concluido').length;

      setData({
          appointments: appointments,
          totalSessions: completedCount,
          lastBio: bio || []
      });

    } catch (error) { 
      console.error("Erro overview:", error); 
    }
  }

  useEffect(() => {
    setLoading(true);
    loadOverview().then(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  const handleCancelAppointment = async (apptId: string) => {
      if (!window.confirm("Cancelar este agendamento?")) return;
      await supabase.from('appointments').update({ status: 'cancelado' }).eq('id', apptId);
      toast.success("Cancelado!");
      loadOverview();
  };

  const formatDateCard = (dateString: string) => {
    const date = new Date(dateString); // O navegador converte UTC -> Local aqui
    return {
      day: format(date, 'dd'),
      month: format(date, 'MMM', { locale: ptBR }).toUpperCase(),
      weekday: format(date, 'EEEE', { locale: ptBR }),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) // Sem timeZone: UTC para usar o local
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'text-green-700 bg-green-50 border-green-200';
      case 'cancelado': return 'text-red-700 bg-red-50 border-red-200';
      case 'falta': return 'text-orange-700 bg-orange-50 border-orange-200';
      default: return 'text-pink-700 bg-pink-50 border-pink-200';
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-pink-600 w-8 h-8"/></div>;
  
  const bio = data.lastBio?.[0];
  const now = new Date();

  // --- FILTROS DE TEMPO CORRIGIDOS ---
  // Agenda: Apenas datas MAIORES ou IGUAIS a agora (ordenado do mais próximo para o mais longe)
  const nextAppointments = data.appointments
    .filter((a) => new Date(a.start_time) >= now && a.status !== 'cancelado')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  // Histórico: Apenas datas MENORES que agora (ordenado do mais recente para o mais antigo)
  const pastAppointments = data.appointments
    .filter((a) => new Date(a.start_time) < now);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      
      {/* COLUNA PRINCIPAL */}
      <div className="lg:col-span-2 space-y-8">
          
          {/* 1. SEÇÃO DE BOAS-VINDAS / RESUMO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card Resumo Sessões */}
            <div className="relative overflow-hidden p-6 rounded-3xl border border-pink-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex justify-between mb-4">
                        <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-2xl text-pink-600">
                            <Activity size={20}/>
                        </div>
                        <span className="text-xs font-bold uppercase text-gray-400">Total</span>
                    </div>
                    <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-1">
                        {data.totalSessions}
                    </h3>
                    <p className="text-sm text-gray-500">Sessões realizadas</p>
                </div>
            </div>

            {/* Card Bioimpedância */}
            <div className="relative overflow-hidden p-6 rounded-3xl border border-blue-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex justify-between mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600">
                            <Scale size={20}/>
                        </div>
                        <span className="text-xs font-bold uppercase text-gray-400">Peso Atual</span>
                    </div>
                    {bio ? (
                        <>
                            <h3 className="text-4xl font-black text-gray-900 dark:text-white">
                                {bio.peso} <span className="text-lg text-gray-400 font-medium">kg</span>
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                                em {new Date(bio.created_at).toLocaleDateString('pt-BR')}
                            </p>
                        </>
                    ) : (
                        <p className="text-gray-400 py-2 text-sm">Sem dados recentes</p>
                    )}
                    
                    <button onClick={() => navigate("../bioimpedance")} className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                        Ver Evolução <ArrowRight size={12}/>
                    </button>
                </div>
            </div>
          </div>

          {/* 2. AGENDA FUTURA (PRÓXIMOS) */}
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Calendar className="text-pink-500" size={20} /> Próximos Agendamentos
                  </h3>
                  <Button size="sm" onClick={() => navigate('/appointments/new')} className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs h-8">
                    + Agendar
                  </Button>
              </div>

              {nextAppointments.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
                    <Calendar size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Nenhum agendamento futuro.</p>
                  </div>
              ) : (
                  <div className="space-y-3">
                      {nextAppointments.map((apt) => {
                          const { day, month, weekday, time } = formatDateCard(apt.start_time);
                          const profName = apt.professional 
                            ? `${apt.professional.first_name} ${apt.professional.last_name}` 
                            : "Profissional";
                          const profSpecialty = apt.professional?.formacao || "Especialista";
                          const profAvatar = apt.professional?.avatar_url;

                          return (
                              <div key={apt.id} className="group bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-pink-200 transition-all flex items-center gap-4">
                                  
                                  {/* Data Box */}
                                  <div className="flex-shrink-0 flex flex-col items-center justify-center bg-pink-50 dark:bg-gray-700 w-16 h-16 rounded-2xl border border-pink-100 dark:border-gray-600">
                                      <span className="text-[10px] font-bold text-pink-400 uppercase">{month}</span>
                                      <span className="text-2xl font-black text-pink-600 dark:text-pink-300 leading-none">{day}</span>
                                  </div>

                                  {/* Info Principal */}
                                  <div className="flex-1 min-w-0">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                          <span className="text-base font-bold text-gray-900 dark:text-white capitalize">
                                              {weekday}, {time}
                                          </span>
                                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase w-fit border ${getStatusColor(apt.status)}`}>
                                              {apt.status}
                                          </span>
                                      </div>
                                      
                                      {/* Detalhes do Profissional (Melhorado) */}
                                      <div className="flex items-center gap-3 mt-2 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-xl w-fit pr-4">
                                          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-white shadow-sm">
                                              {profAvatar ? (
                                                  <img src={profAvatar} alt={profName} className="w-full h-full object-cover"/>
                                              ) : (
                                                  <div className="w-full h-full flex items-center justify-center bg-pink-100 text-pink-600 font-bold text-xs">
                                                      {profName[0]}
                                                  </div>
                                              )}
                                          </div>
                                          <div className="flex flex-col">
                                              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{profName}</span>
                                              <span className="text-[10px] text-gray-400">{profSpecialty}</span>
                                          </div>
                                      </div>
                                  </div>

                                  {/* Ações */}
                                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => navigate(`/appointments/${apt.id}/edit`)}
                                        className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                        title="Editar"
                                      >
                                          <Pencil size={16} />
                                      </button>
                                      <button 
                                        onClick={() => handleCancelAppointment(apt.id)}
                                        className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        title="Cancelar"
                                      >
                                          <Ban size={16} />
                                      </button>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>

          {/* 3. HISTÓRICO RECENTE (Passado) */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex gap-2 items-center">
                      <History size={16}/> Histórico (Passado)
                  </h3>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto p-2">
                  {pastAppointments.length === 0 ? (
                      <p className="text-center text-gray-400 py-8 text-sm">Nenhum histórico disponível.</p>
                  ) : (
                      <div className="space-y-1">
                          {pastAppointments.map((apt) => {
                              const date = new Date(apt.start_time);
                              const dateStr = date.toLocaleDateString('pt-BR');
                              const profName = apt.professional ? apt.professional.first_name : "Profissional";
                              
                              return (
                                  <div key={apt.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors text-sm">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-2 h-2 rounded-full ${apt.status === 'concluido' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                          <div>
                                              <p className="font-bold text-gray-800 dark:text-gray-200">{dateStr}</p>
                                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                                  <User size={10}/> {profName}
                                              </p>
                                          </div>
                                      </div>
                                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg border ${getStatusColor(apt.status)}`}>
                                          {apt.status}
                                      </span>
                                  </div>
                              );
                          })}
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* COLUNA LATERAL */}
      <div className="lg:col-span-1 space-y-6">
          <PatientPackagesWidget patientId={patient.id} />
          
          {/* Card Financeiro */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <DollarSign size={16} /> Financeiro
              </h3>
              <div className="flex items-center justify-between">
                 <span className="text-gray-500">Em aberto</span>
                 <span className="font-bold text-rose-600">R$ 0,00</span>
              </div>
              <button className="w-full mt-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors">
                 Ver Extrato
              </button>
           </div>
      </div>
    </div>
  );
}