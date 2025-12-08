import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, MessageCircle, AlertTriangle, Loader2 } from 'lucide-react';

type Appointment = {
  id: string;
  start_time: string;
  date: string;
  service_name: string;
  patient_name: string;
};

export default function ProfessionalFutureAgendaWidget({ professionalId }: { professionalId: string }) {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    if (professionalId) {
      fetchFutureAgenda(professionalId);
    }
  }, [professionalId]);

  async function fetchFutureAgenda(id: string) {
    setLoading(true);
    setDbError(null);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Tenta buscar. Se a coluna 'service_id' não existir no banco, vai dar erro.
      // Se você rodou o SQL, vai funcionar.
      const { data, error } = await supabase
        .from('appointments')
        .select('id, start_time, date, professional_id, patient_id, service_id')
        .eq('professional_id', id)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      const mappedAppts: Appointment[] = (data || []).map((a: any) => ({
          id: a.id,
          start_time: a.start_time || '00:00',
          date: a.date || today,
          service_name: a.service_id ? `Serviço #${a.service_id.substring(0,4)}` : 'Consulta',
          patient_name: a.patient_id ? `Paciente #${a.patient_id.substring(0,4)}` : 'Desconhecido'
      }));

      setAppointments(mappedAppts);

    } catch (error: any) {
      console.error("Erro Supabase:", error);
      // Agora mostramos a mensagem exata do banco (Ex: column X does not exist)
      setDbError(error.message); 
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl h-40 flex justify-center items-center">
        <Loader2 className="animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Calendar size={20} className="text-pink-600" /> Próximos Agendamentos
      </h3>

      {/* ÁREA DE ERRO DO BANCO DE DADOS */}
      {dbError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex gap-3 items-start">
            <AlertTriangle className="text-red-500 shrink-0" size={20} />
            <div className="text-sm text-red-700">
                <p className="font-bold">O Banco de Dados recusou a conexão:</p>
                <code className="block bg-red-100 p-1 rounded mt-1 font-mono text-xs">{dbError}</code>
                <p className="mt-2 text-xs opacity-75">
                    Solução: Copie o erro acima e verifique se a coluna ou tabela existe no Supabase.
                </p>
            </div>
        </div>
      )}

      {appointments.length === 0 && !dbError ? (
        <div className="text-center py-6 text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <p className="text-sm">Nenhum agendamento futuro encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <div key={appt.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{appt.patient_name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-300">
                    <span>{new Date(appt.date).toLocaleDateString('pt-BR')}</span>
                    <span className="font-semibold text-pink-600 dark:text-pink-400">
                        <Clock size={10} className="inline mr-1"/>{appt.start_time.slice(0, 5)}
                    </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{appt.service_name}</p>
              </div>
              <button className="bg-green-100 text-green-700 p-2 rounded-full">
                <MessageCircle size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}