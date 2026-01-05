import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Loader2,
  User,
  MapPin,
  Clock,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { format, addDays, subDays, isSameDay, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "react-hot-toast";
import { Button } from "../../components/ui/button"; // Assumindo que você tem esse componente
// Se não tiver o componente Button, pode usar HTML button com as classes abaixo.

// --- TIPAGEM (INTEGRAL) ---
interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: 'agendado' | 'concluido' | 'cancelado' | 'falta';
  notes?: string;
  patient: {
    id: string;
    name: string;
    phone?: string;
  };
}

// --- CONFIGURAÇÕES DA GRADE VISUAL ---
const START_HOUR = 6;  
const END_HOUR = 23;   
const HOUR_HEIGHT = 120; // Aumentei um pouco para caber melhor as infos

export default function ProfessionalAgendaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // --- 1. BUSCA DE DADOS ---
  useEffect(() => {
    if (id) fetchAppointments();
  }, [id, selectedDate]);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const startIso = startOfDay(selectedDate).toISOString();
      const endIso = endOfDay(selectedDate).toISOString();

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id, start_time, end_time, status, notes,
          patient:patients(id, name, phone)
        `)
        .eq("professional_id", id)
        .gte("start_time", startIso)
        .lte("start_time", endIso)
        .order("start_time", { ascending: true });

      if (error) throw error;

      const formattedData: Appointment[] = (data || []).map((item: any) => ({
        id: item.id,
        start_time: item.start_time,
        end_time: item.end_time,
        status: item.status,
        notes: item.notes,
        patient: Array.isArray(item.patient) ? item.patient[0] : item.patient,
      }));

      setAppointments(formattedData);
    } catch (error) {
      console.error("Erro agenda:", error);
      toast.error("Erro ao sincronizar agenda.");
    } finally {
      setLoading(false);
    }
  }

  // --- 2. MOTOR DE RENDERIZAÇÃO GEOMÉTRICA ---
  const getPositionStyles = (startStr: string, endStr: string) => {
    const startDate = new Date(startStr); 
    const endDate = new Date(endStr);

    const startHour = startDate.getHours(); 
    const startMin = startDate.getMinutes();
    const endHour = endDate.getHours();
    const endMin = endDate.getMinutes();

    const startMinutesTotal = (startHour * 60 + startMin) - (START_HOUR * 60);
    const endMinutesTotal = (endHour * 60 + endMin) - (START_HOUR * 60);
    
    const duration = endMinutesTotal - startMinutesTotal;
    const top = (startMinutesTotal / 60) * HOUR_HEIGHT;
    const height = (duration / 60) * HOUR_HEIGHT;

    return { 
      top: `${Math.max(0, top)}px`, 
      height: `${Math.max(height, 60)}px` 
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-900/20';
      case 'cancelado': return 'bg-rose-50 border-rose-200 text-rose-900 opacity-60 dark:bg-rose-900/20';
      case 'falta': return 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20';
      default: return 'bg-white border-pink-200 text-gray-900 shadow-sm hover:border-pink-400 hover:shadow-md dark:bg-gray-800 dark:border-gray-700 dark:text-white'; 
    }
  };

  const hoursList = useMemo(() => {
    const hours = [];
    for (let i = START_HOUR; i <= END_HOUR; i++) {
      hours.push(i);
    }
    return hours;
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={() => navigate(-1)} className="p-2 bg-white hover:bg-gray-100 dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          
          <div>
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Agenda do Profissional
             </h1>
             <p className="text-sm text-gray-500">Gerencie os atendimentos diários.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Navegação de Data */}
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-gray-500">
                    <ChevronLeft size={18} />
                </button>
                <div className="px-4 flex flex-col items-center min-w-[140px]">
                    <span className="text-sm font-bold text-gray-800 dark:text-white capitalize">
                        {format(selectedDate, "EEEE, d MMM", { locale: ptBR })}
                    </span>
                    {isSameDay(selectedDate, new Date()) && (
                        <span className="text-[10px] font-bold text-pink-600 uppercase">Hoje</span>
                    )}
                </div>
                <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-gray-500">
                    <ChevronRight size={18} />
                </button>
            </div>

            <button 
                onClick={() => navigate(`/appointments/new?professionalId=${id}`)}
                className="h-11 px-6 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-pink-200 dark:shadow-none transition-all flex items-center gap-2"
            >
                <Plus size={18} /> <span className="hidden md:inline">Novo Agendamento</span>
            </button>
        </div>
      </div>

      {/* ÁREA DA AGENDA (CARTÃO BRANCO) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
        
        {loading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                <Loader2 className="animate-spin text-pink-600 mb-2" size={40} />
                <span className="text-sm font-semibold text-gray-500">Carregando agenda...</span>
            </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            <div className="flex min-h-full pb-20">
            
                {/* COLUNA DE HORÁRIOS */}
                <div className="w-16 md:w-20 flex-shrink-0 border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 pt-4">
                    {hoursList.map((hour) => (
                    <div 
                        key={hour} 
                        className="text-xs font-semibold text-gray-400 text-center relative"
                        style={{ height: `${HOUR_HEIGHT}px` }}
                    >
                        <span className="-translate-y-2 block">{hour.toString().padStart(2, '0')}:00</span>
                    </div>
                    ))}
                </div>

                {/* GRID DE AGENDAMENTOS */}
                <div 
                    className="flex-1 relative pt-4"
                    style={{ 
                        backgroundImage: `linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)`,
                        backgroundSize: `100% ${HOUR_HEIGHT}px`,
                        backgroundPositionY: '16px' // Ajuste fino para alinhar com o texto da hora
                    }}
                >
                    {/* LINHA DO TEMPO ATUAL (AGORA) */}
                    {isSameDay(selectedDate, new Date()) && (
                        <div 
                            className="absolute w-full border-t-2 border-pink-500 z-30 pointer-events-none flex items-center"
                            style={{ 
                                top: `${((new Date().getHours() * 60 + new Date().getMinutes()) - (START_HOUR * 60)) / 60 * HOUR_HEIGHT + 16}px` 
                            }}
                        >
                            <div className="absolute -left-1.5 w-3 h-3 bg-pink-500 rounded-full ring-2 ring-white"></div>
                        </div>
                    )}

                    {/* RENDERIZAÇÃO DOS CARDS */}
                    <div className="relative mr-4 ml-2">
                        {appointments.map((apt) => {
                            const pos = getPositionStyles(apt.start_time, apt.end_time);
                            
                            return (
                                <div
                                    key={apt.id}
                                    onClick={() => navigate(`/appointments/${apt.id}/edit`)}
                                    className={`
                                        absolute left-0 right-0 rounded-xl border-l-4 p-3 cursor-pointer transition-all 
                                        hover:scale-[1.01] hover:z-40 group flex flex-col justify-between
                                        ${getStatusColor(apt.status)}
                                    `}
                                    style={{ top: `calc(${pos.top})`, height: pos.height }} 
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold opacity-70 flex items-center gap-1">
                                                <Clock size={12} />
                                                {format(new Date(apt.start_time), 'HH:mm')} - {format(new Date(apt.end_time), 'HH:mm')}
                                            </span>
                                            {apt.status === 'agendado' && <Sparkles size={14} className="text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                        </div>
                                        
                                        <h3 className="font-bold text-sm leading-tight truncate">
                                            {apt.patient?.name || "Paciente Desconhecido"}
                                        </h3>
                                    </div>

                                    {(apt.notes || apt.patient?.phone) && (
                                        <div className="mt-1 opacity-70 group-hover:opacity-100 transition-opacity space-y-1">
                                            {apt.notes && (
                                                <p className="flex items-center gap-1 text-[10px] truncate">
                                                    <MapPin size={10} className="text-pink-500"/> {apt.notes}
                                                </p>
                                            )}
                                            {apt.patient?.phone && (
                                                <p className="flex items-center gap-1 text-[10px]">
                                                    <User size={10} className="text-pink-500"/> {apt.patient.phone}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* EMPTY STATE (AGENDA VAZIA) */}
                    {!loading && appointments.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="p-6 rounded-full bg-gray-50 dark:bg-gray-700/50 mb-4">
                                <CalendarIcon size={48} className="text-gray-200 dark:text-gray-600"/>
                            </div>
                            <h3 className="text-lg font-bold text-gray-400">Agenda Livre</h3>
                            <p className="text-sm text-gray-300">Nenhum atendimento para este dia.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}