import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Calendar, Clock, User, MapPin, 
  CheckCircle2, XCircle, AlertCircle, Loader2,
  CalendarPlus
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function PatientAppointmentsPage() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Pega o ID do paciente
      const { data: profile } = await supabase
        .from('patients')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!profile) return;

      // 2. Busca agendamentos
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, start_time, status, notes,
          professional:profiles (first_name, last_name),
          treatment:treatments (name)
        `)
        .eq('patient_id', profile.id)
        .order('start_time', { ascending: false }); // Do mais novo para o mais antigo

      if (error) throw error;
      setAppointments(data || []);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Separa Passados e Futuros
  const now = new Date();
  const upcoming = appointments.filter(a => new Date(a.start_time) >= now).reverse(); // Inverte para o mais próximo aparecer primeiro
  const history = appointments.filter(a => new Date(a.start_time) < now);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { color: 'text-green-600 bg-green-50 border-green-100', icon: CheckCircle2, label: 'Realizado' };
      case 'canceled': return { color: 'text-red-600 bg-red-50 border-red-100', icon: XCircle, label: 'Cancelado' };
      default: return { color: 'text-blue-600 bg-blue-50 border-blue-100', icon: Clock, label: 'Agendado' };
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-pink-600" size={32}/>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Buscando agenda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
                Minha Agenda
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Próximos horários e histórico</p>
        </div>
        
        {/* Botão Flutuante de Agendar (Link para WhatsApp ou módulo de agendamento) */}
        <a 
            href="https://wa.me/5511999999999?text=Olá, gostaria de agendar um horário." 
            target="_blank"
            className="w-12 h-12 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30 transition-all hover:scale-110"
        >
            <CalendarPlus size={24}/>
        </a>
      </div>

      {/* 1. FUTUROS (Destaque) */}
      <div>
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1 flex items-center gap-2">
            <Clock size={14}/> Próximas Sessões
        </h3>

        {upcoming.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] p-8 text-center">
                <p className="text-sm font-bold text-gray-400">Nenhum agendamento futuro.</p>
                <p className="text-xs text-gray-300 mt-1">Que tal marcar um procedimento hoje?</p>
            </div>
        ) : (
            <div className="space-y-4">
                {upcoming.map(apt => {
                    const date = new Date(apt.start_time);
                    const profName = apt.professional ? `${apt.professional.first_name} ${apt.professional.last_name || ''}` : 'Clínica';
                    const treatName = apt.treatment?.name || 'Consulta / Procedimento';

                    return (
                        <div key={apt.id} className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-pink-500 to-purple-600"></div>
                            
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-gray-900 text-white rounded-2xl shadow-lg">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-pink-500">
                                            {format(date, 'MMM', { locale: ptBR })}
                                        </span>
                                        <span className="text-2xl font-black italic leading-none">
                                            {format(date, 'dd')}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
                                            {treatName}
                                        </h4>
                                        <div className="flex flex-wrap gap-3 mt-1 text-xs font-bold text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} className="text-pink-500"/> 
                                                {format(date, "EEEE, HH:mm", { locale: ptBR })}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User size={14} className="text-pink-500"/> 
                                                {profName}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                    Confirmado
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* 2. HISTÓRICO (Lista Simples) */}
      {history.length > 0 && (
          <div className="pt-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1 flex items-center gap-2">
                <CheckCircle2 size={14}/> Histórico
            </h3>
            
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                {history.map((apt, index) => {
                    const status = getStatusConfig(apt.status);
                    const StatusIcon = status.icon;
                    
                    return (
                        <div key={apt.id} className={`p-5 flex items-center justify-between ${index !== history.length - 1 ? 'border-b border-gray-50 dark:border-gray-700' : ''}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.color.split(' ')[1]}`}>
                                    <StatusIcon size={18} className={status.color.split(' ')[0]} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">
                                        {apt.treatment?.name || "Atendimento"}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {new Date(apt.start_time).toLocaleDateString()} • {apt.professional?.first_name}
                                    </p>
                                </div>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${status.color}`}>
                                {status.label}
                            </span>
                        </div>
                    );
                })}
            </div>
          </div>
      )}

    </div>
  );
}