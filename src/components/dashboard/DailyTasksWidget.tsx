import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { 
  CheckCircle, 
  MessageCircle, 
  Clock, 
  Calendar, 
  Heart, 
  Loader2,
  RefreshCw
} from "lucide-react";
import { toast } from "react-hot-toast";

export function DailyTasksWidget() {
  const [loading, setLoading] = useState(true);
  const [appointmentsTomorrow, setAppointmentsTomorrow] = useState<any[]>([]);
  const [postProcedure, setPostProcedure] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'confirm' | 'followup'>('confirm');

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    try {
      const today = new Date();
      
      // 1. DATA AMANHÃ (Para confirmação)
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // 2. DATA ONTEM (Para Pós-Procedimento)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // --- QUERIES ---

      // A. Buscar Agendamentos de Amanhã
      const { data: appts } = await supabase
        .from('appointments') 
        .select(`
            id, 
            start_time, 
            status,
            patient:patient_id ( name, phone, profiles(first_name, phone) )
        `)
        .eq('date', tomorrowStr)
        .neq('status', 'cancelled');

      // B. Buscar Procedimentos de Ontem
      const { data: treatments } = await supabase
        .from('treatments')
        .select(`
            id, 
            tipo_procedimento, 
            data_procedimento,
            patient:patient_id ( name, phone, profiles(first_name, phone) )
        `)
        .eq('data_procedimento', yesterdayStr);

      setAppointmentsTomorrow(appts || []);
      setPostProcedure(treatments || []);

    } catch (error) {
      console.error("Erro ao buscar tarefas", error);
    } finally {
      setLoading(false);
    }
  }

  // Função de Envio Inteligente
  const handleAction = (item: any, type: 'confirm' | 'followup') => {
      // Tenta pegar dados do profile ou dados diretos
      const patientData = item.patient?.profiles || item.patient;
      const name = patientData?.first_name || patientData?.name || "Paciente";
      const phone = patientData?.phone || "";

      if (!phone) return toast.error("Sem telefone cadastrado.");

      let message = "";
      
      if (type === 'confirm') {
          const time = item.start_time ? ` às ${item.start_time.slice(0,5)}` : "";
          message = `Olá ${name}, tudo bem? Passando para confirmar seu horário amanhã${time} na clínica. Podemos confirmar?`;
      } 
      else if (type === 'followup') {
          const proc = item.tipo_procedimento || "procedimento";
          message = `Oi ${name}! Como você está se sentindo hoje após o ${proc}? Está tudo bem com a região tratada?`;
      }

      const link = `https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
      window.open(link, "_blank");
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full">
        
        {/* Cabeçalho do Widget */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <CheckCircle className="text-green-600" size={20}/> Recepção Ativa
            </h3>
            <button onClick={fetchTasks} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors" title="Atualizar">
                <RefreshCw size={16} />
            </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-gray-100 dark:border-gray-700">
            <button 
                onClick={() => setActiveTab('confirm')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors border-b-2 ${activeTab === 'confirm' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
                Confirmar ({appointmentsTomorrow.length})
            </button>
            <button 
                onClick={() => setActiveTab('followup')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors border-b-2 ${activeTab === 'followup' ? 'border-pink-500 text-pink-600 bg-pink-50/50' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
                Pós-Venda ({postProcedure.length})
            </button>
        </div>

        {/* Conteúdo da Lista */}
        <div className="flex-1 overflow-y-auto p-2 max-h-[300px]">
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-300"/></div>
            ) : (
                <>
                    {/* LISTA DE CONFIRMAÇÃO */}
                    {activeTab === 'confirm' && (
                        <div className="space-y-2">
                            {appointmentsTomorrow.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-8">Nenhum agendamento para amanhã.</p>
                            ) : (
                                appointmentsTomorrow.map((appt) => (
                                    <div key={appt.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg hover:shadow-sm transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 text-blue-600 p-2 rounded-full"><Calendar size={16}/></div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 dark:text-white">
                                                    {appt.patient?.profiles?.first_name || appt.patient?.name || "Paciente"}
                                                </p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock size={10}/> {appt.start_time?.slice(0,5) || "Horário não definido"}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleAction(appt, 'confirm')}
                                            className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                                        >
                                            <MessageCircle size={16}/> <span className="hidden sm:inline">Confirmar</span>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* LISTA DE PÓS-VENDA */}
                    {activeTab === 'followup' && (
                        <div className="space-y-2">
                            {postProcedure.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-8">Nenhum procedimento realizado ontem.</p>
                            ) : (
                                postProcedure.map((proc) => (
                                    <div key={proc.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg hover:shadow-sm transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-pink-100 text-pink-600 p-2 rounded-full"><Heart size={16}/></div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 dark:text-white">
                                                    {proc.patient?.profiles?.first_name || proc.patient?.name || "Paciente"}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Fez: {proc.tipo_procedimento}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleAction(proc, 'followup')}
                                            className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                                        >
                                            <MessageCircle size={16}/> <span className="hidden sm:inline">Perguntar</span>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
  );
}