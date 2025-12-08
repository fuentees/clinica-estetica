import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  Activity, 
  Scale, 
  ArrowRight, 
  Loader2,
  Calendar,
  History,
  Clock3,
  User,
  FileText
} from "lucide-react";
import { Button } from "../../components/ui/button";

// --- CAMINHO CORRIGIDO FINAL ---
// Aponta para src/components/patients/PatientPackagesWidget
import { PatientPackagesWidget } from "../../components/patients/PatientPackagesWidget";

export function PatientOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Estado Unificado
  const [data, setData] = useState<any>({
    appointments: [], 
    lastAppointment: null, 
    nextAppointment: null, 
    totalSessions: 0,
    lastBio: [], 
  });

  useEffect(() => {
    async function loadOverview() {
      if (!id) return;

      try {
        setLoading(true);

        // 1. BUSCAR AGENDAMENTOS
        const { data: appts, error: apptError } = await supabase
            .from("appointments")
            .select(`
                id, date, start_time, status, notes,
                treatment:treatment_id (name),
                professional:professional_id (first_name, last_name)
            `)
            .eq("patient_id", id)
            .order("date", { ascending: false });

        if (apptError) throw apptError;

        const appointments = appts || [];
        const completed = appointments.filter((a: any) => a.status === 'completed');
        const next = appointments
            .filter((a: any) => new Date(a.date) >= new Date() && a.status === 'scheduled')
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

        // 2. BUSCAR BIOIMPEDÂNCIA
        const { data: bio } = await supabase
            .from("bioimpedance")
            .select("*")
            .eq("patient_id", id)
            .order("data_avaliacao", { ascending: false })
            .limit(2);

        setData({
            appointments: appointments,
            lastAppointment: completed[0] || null,
            nextAppointment: next || null,
            totalSessions: completed.length,
            lastBio: bio || []
        });

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, [id]);

  // Helpers de Status
  const getStatusColor = (status: string) => {
    switch (status) {
        case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
        case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'canceled': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getStatusLabel = (status: string) => {
      switch (status) {
          case 'confirmed': return 'Confirmado';
          case 'completed': return 'Concluído';
          case 'canceled': return 'Cancelado';
          default: return 'Agendado';
      }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-pink-600" /></div>;

  const bioCurrent = data.lastBio?.[0];
  const bioPrevious = data.lastBio?.[1];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      
      {/* --- COLUNA ESQUERDA (RESUMO + HISTÓRICO) --- */}
      <div className="lg:col-span-2 space-y-6">
          
          {/* GRUPO DE CARDS SUPERIORES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CARD 1: Status Clínico / Última Sessão */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full text-pink-600"><Activity size={24} /></div>
                    <span className="text-xs font-bold uppercase text-gray-400">Resumo Clínico</span>
                </div>
                
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">{data.totalSessions}</h3>
                <p className="text-sm text-gray-500 mb-4">Sessões realizadas</p>
                
                {data.lastAppointment ? (
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Último Procedimento</p>
                        <p className="font-semibold text-gray-800 dark:text-white truncate">
                            {data.lastAppointment.treatment?.name || "Atendimento Geral"}
                        </p>
                        <p className="text-xs text-gray-500">
                            {new Date(data.lastAppointment.date).toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                ) : (
                    <div className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-lg">Nenhum procedimento concluído.</div>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Próximo Agendamento</p>
                    {data.nextAppointment ? (
                        <div className="flex items-center gap-2 text-sm font-bold text-green-600">
                            <Calendar size={16} />
                            {new Date(data.nextAppointment.date).toLocaleDateString('pt-BR')} às {data.nextAppointment.start_time.slice(0,5)}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Nada agendado</p>
                    )}
                </div>
            </div>

            {/* CARD 2: Bioimpedância Rápida */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600"><Scale size={24} /></div>
                    <span className="text-xs font-bold uppercase text-gray-400">Corporal</span>
                </div>
                {bioCurrent ? (
                    <>
                        <div className="flex items-end gap-2 mb-1">
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{bioCurrent.peso} kg</h3>
                            {bioPrevious && (
                                <span className={`text-xs font-bold mb-1 ${bioCurrent.peso < bioPrevious.peso ? 'text-green-500' : 'text-red-500'}`}>
                                    {bioCurrent.peso < bioPrevious.peso ? '▼' : '▲'} {Math.abs(bioCurrent.peso - bioPrevious.peso).toFixed(1)}kg
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mb-4">em {new Date(bioCurrent.data_avaliacao).toLocaleDateString('pt-BR')}</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-lg text-center">
                                <span className="text-xs text-gray-400 block">Gordura</span>
                                <span className="font-bold text-gray-800 dark:text-white">{bioCurrent.gordura_percentual || '-'}%</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-lg text-center">
                                <span className="text-xs text-gray-400 block">Músculo</span>
                                <span className="font-bold text-gray-800 dark:text-white">{bioCurrent.massa_muscular_kg || '-'}kg</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400"><span className="text-sm">Sem dados de bioimpedância</span></div>
                )}
                <Button variant="ghost" onClick={() => navigate("bioimpedance")} className="w-full mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs">
                    Ver Gráficos Completos <ArrowRight size={14} className="ml-2"/>
                </Button>
            </div>

          </div>

          {/* LISTA DE HISTÓRICO */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <History size={20} className="text-gray-400"/> Histórico de Agendamentos
                  </h3>
                  <Button size="sm" onClick={() => navigate('/appointments/new')} className="bg-pink-600 hover:bg-pink-700 text-white text-xs">
                      + Novo Agendamento
                  </Button>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {data.appointments.length === 0 ? (
                      <div className="p-10 flex flex-col items-center justify-center text-gray-400">
                          <History size={40} className="mb-2 opacity-50"/>
                          <p>Nenhum histórico encontrado.</p>
                      </div>
                  ) : (
                      data.appointments.map((appt: any) => (
                          <div key={appt.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              {/* Data e Hora */}
                              <div className="flex items-start gap-3 min-w-[140px]">
                                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-center min-w-[50px]">
                                      <span className="block text-xs font-bold text-gray-500 uppercase">
                                          {new Date(appt.date).toLocaleDateString('pt-BR', { month: 'short' })}
                                      </span>
                                      <span className="block text-xl font-bold text-gray-900 dark:text-white">
                                          {new Date(appt.date).getDate()}
                                      </span>
                                  </div>
                                  <div>
                                      <div className="flex items-center gap-1 text-sm font-bold text-gray-700 dark:text-gray-200">
                                          <Clock3 size={14} className="text-pink-500"/> 
                                          {appt.start_time.slice(0, 5)}
                                      </div>
                                      <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] uppercase font-bold rounded-full border ${getStatusColor(appt.status)}`}>
                                          {getStatusLabel(appt.status)}
                                      </span>
                                  </div>
                              </div>

                              {/* Detalhes */}
                              <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 dark:text-white">
                                      {appt.treatment?.name || 'Procedimento não especificado'}
                                  </h4>
                                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                      <User size={14} /> 
                                      <span>
                                          {appt.professional 
                                              ? `${appt.professional.first_name} ${appt.professional.last_name || ''}` 
                                              : 'Profissional não atribuído'}
                                      </span>
                                  </div>
                                  {appt.notes && (
                                      <div className="mt-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-800 flex gap-2 items-start">
                                          <FileText size={12} className="mt-0.5 shrink-0"/> {appt.notes}
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>

      {/* --- COLUNA DIREITA (WIDGET DE PACOTES) --- */}
      <div className="lg:col-span-1 space-y-6">
          {/* Widget de Pacotes Corretamente Importado */}
          <PatientPackagesWidget patientId={id!} /> 
      </div>

    </div>
  );
}