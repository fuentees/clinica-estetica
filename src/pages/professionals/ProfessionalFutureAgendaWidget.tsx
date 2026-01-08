import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, MessageCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Appointment = {
  id: string;
  start_time: string;
  service_name: string;
  patient_name: string;
};

// CORREÇÃO: A interface da prop deve bater com o nome da variável (professionalId)
interface WidgetProps {
    professionalId: string;
}

export default function ProfessionalFutureAgendaWidget({ professionalId }: WidgetProps) {
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
      const now = new Date().toISOString();

      // USO CORRETO DO JOIN EXPLÍCITO (!patient_id)
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, 
          start_time, 
          status,
          patient:patients!patient_id ( name ),
          service:services!service_id ( name )
        `)
        .eq('professional_id', id) // Aqui usamos snake_case porque é o nome da coluna no banco
        .gte('start_time', now)
        .eq('status', 'scheduled')
        .order('start_time', { ascending: true })
        .limit(5);

      if (error) throw error;

      const mappedAppts: Appointment[] = (data || []).map((a: any) => {
        // Tratamento defensivo para arrays ou objetos
        const pName = Array.isArray(a.patient) ? a.patient[0]?.name : a.patient?.name;
        const sName = Array.isArray(a.service) ? a.service[0]?.name : a.service?.name;

        return {
          id: a.id,
          start_time: a.start_time,
          service_name: sName || 'Procedimento Estético',
          patient_name: pName || 'Paciente não identificado'
        };
      });

      setAppointments(mappedAppts);

    } catch (error: any) {
      console.error("Erro Supabase Widget:", error);
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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 h-full animate-in fade-in duration-500">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Calendar size={20} className="text-pink-600" /> Próximos Agendamentos
      </h3>

      {dbError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex gap-3 items-start">
            <AlertTriangle className="text-red-500 shrink-0" size={20} />
            <div className="text-sm text-red-700">
                <p className="font-bold">Erro de Sincronização:</p>
                <code className="block bg-red-100 p-1 rounded mt-1 font-mono text-xs">{dbError}</code>
            </div>
        </div>
      )}

      {appointments.length === 0 && !dbError ? (
        <div className="text-center py-6 text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium italic">Sua agenda está livre para as próximas horas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <div key={appt.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-pink-200 transition-all group">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-gray-900 dark:text-white uppercase italic tracking-tighter truncate">
                    {appt.patient_name}
                </p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500 dark:text-gray-300 font-bold uppercase tracking-widest">
                    <span>{format(new Date(appt.start_time), "dd 'de' MMM", { locale: ptBR })}</span>
                    <span className="text-pink-600 dark:text-pink-400 flex items-center gap-1">
                        <Clock size={10}/>
                        {format(new Date(appt.start_time), "HH:mm")}
                    </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-medium truncate">{appt.service_name}</p>
              </div>
              <button className="ml-4 bg-green-100 text-green-700 p-2 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm">
                <MessageCircle size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}