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
  Clock
} from "lucide-react";
import { format, addDays, subDays, isSameDay, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "react-hot-toast";

// --- TIPAGEM ---
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

// --- CONFIGURAÇÕES DA GRADE ---
const START_HOUR = 6;  // Início da grade visual (06:00)
const END_HOUR = 23;   // Fim da grade visual
const HOUR_HEIGHT = 100; // Altura em pixels de cada hora

export default function ProfessionalAgendaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // --- 1. BUSCAR DADOS (COM INTERVALO CORRETO DE FUSO) ---
  useEffect(() => {
    if (id) fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, selectedDate]);

  async function fetchAppointments() {
    setLoading(true);
    try {
      // date-fns startOfDay pega o início do dia NO FUSO LOCAL (ex: 00:00 BRT)
      // .toISOString() converte para UTC para o banco entender (ex: 03:00 UTC)
      // Isso garante que não "percamos" agendamentos da madrugada ou da noite.
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

      // Normalização
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
      toast.error("Erro ao carregar agenda.");
    } finally {
      setLoading(false);
    }
  }

  // --- 2. CÁLCULO VISUAL (CONVERTENDO PARA LOCAL) ---
  const getPositionStyles = (startStr: string, endStr: string) => {
    // Aqui está a correção: new Date() converte automaticamente UTC -> Local
    const startDate = new Date(startStr); 
    const endDate = new Date(endStr);

    // Pegamos a hora LOCAL do navegador
    const startHour = startDate.getHours(); 
    const startMin = startDate.getMinutes();
    
    const endHour = endDate.getHours();
    const endMin = endDate.getMinutes();

    // Cálculo em minutos a partir do início da grade (START_HOUR)
    const startMinutesTotal = (startHour * 60 + startMin) - (START_HOUR * 60);
    const endMinutesTotal = (endHour * 60 + endMin) - (START_HOUR * 60);
    
    const duration = endMinutesTotal - startMinutesTotal;

    const top = (startMinutesTotal / 60) * HOUR_HEIGHT;
    const height = (duration / 60) * HOUR_HEIGHT;

    return { 
      top: `${Math.max(0, top)}px`, 
      height: `${Math.max(height, 50)}px` // Altura mínima visual
    };
  };

  // --- 3. FORMATADORES ---
  const formatDisplayTime = (isoString: string) => {
    // Formata usando o fuso local do usuário
    return format(new Date(isoString), 'HH:mm');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-green-100 border-green-400 text-green-900 hover:bg-green-200';
      case 'cancelado': return 'bg-red-100 border-red-400 text-red-900 hover:bg-red-200 opacity-70';
      case 'falta': return 'bg-orange-100 border-orange-400 text-orange-900 hover:bg-orange-200';
      default: return 'bg-gradient-to-l from-pink-50 to-white border-pink-300 text-pink-900 hover:shadow-md'; 
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
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden font-sans">
      
      {/* HEADER DA DATA */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all shadow-sm text-gray-600 dark:text-white">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setSelectedDate(new Date())} className="px-4 text-xs font-bold uppercase tracking-wide hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all text-gray-600 dark:text-gray-300">
              Hoje
            </button>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all shadow-sm text-gray-600 dark:text-white">
              <ChevronRight size={18} />
            </button>
          </div>
          
          <h2 className="text-xl font-bold text-gray-800 dark:text-white capitalize flex items-center gap-2">
            <CalendarIcon size={22} className="text-pink-600 mb-0.5"/>
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h2>
        </div>

        <button 
          onClick={() => navigate('/appointments/new')}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-pink-500/25 active:scale-95"
        >
          <Plus size={20} /> <span className="hidden sm:inline">Novo</span>
        </button>
      </div>

      {/* ÁREA DO CALENDÁRIO */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm gap-2">
            <Loader2 className="animate-spin text-pink-600 w-10 h-10" />
            <span className="text-sm font-bold text-gray-400">Carregando...</span>
          </div>
        )}

        <div className="flex min-h-full relative pb-10">
          
          {/* Régua de Horas */}
          <div className="w-16 flex-shrink-0 border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 pt-4">
            {hoursList.map((hour) => (
              <div 
                key={hour} 
                className="text-xs font-bold text-gray-400 text-center relative"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="-translate-y-3 block">{hour.toString().padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {/* Grid de Agendamentos */}
          <div 
            className="flex-1 relative bg-white dark:bg-gray-800 pt-4"
            style={{ 
              backgroundImage: `linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)`,
              backgroundSize: `100% ${HOUR_HEIGHT}px`,
              backgroundPositionY: '16px' 
            }}
          >
            {/* Linha do tempo atual */}
            {isSameDay(selectedDate, new Date()) && (
              <div 
                className="absolute w-full border-t-2 border-red-500 z-30 pointer-events-none opacity-80 flex items-center"
                style={{ 
                  top: `${((new Date().getHours() * 60 + new Date().getMinutes()) - (START_HOUR * 60)) / 60 * HOUR_HEIGHT + 16}px` 
                }}
              >
                <div className="absolute -left-1.5 w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
              </div>
            )}

            {/* Cards */}
            {appointments.map((apt) => {
              const pos = getPositionStyles(apt.start_time, apt.end_time);
              const isShort = parseInt(pos.height) < 60;

              return (
                <div
                  key={apt.id}
                  onClick={() => navigate(`/appointments/${apt.id}/edit`)}
                  className={`
                    absolute left-2 right-4 rounded-xl border-l-[6px] p-2 cursor-pointer transition-all hover:scale-[1.01] hover:z-40 shadow-sm
                    ${getStatusColor(apt.status)}
                  `}
                  style={{ top: `calc(${pos.top} + 16px)`, height: pos.height }} 
                >
                  <div className="flex justify-between items-start h-full overflow-hidden">
                    <div className="flex flex-col h-full w-full">
                      
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-black bg-white/60 px-1.5 py-0.5 rounded text-gray-800 shadow-sm">
                          {formatDisplayTime(apt.start_time)} - {formatDisplayTime(apt.end_time)}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-sm leading-tight text-gray-900 line-clamp-1 mt-1">
                        {apt.patient?.name || "Paciente sem nome"}
                      </h3>
                      
                      {!isShort && (
                        <div className="mt-auto flex flex-col gap-1 pt-2 border-t border-black/5">
                           {apt.notes && (
                             <span className="flex items-center gap-1.5 text-[10px] font-medium opacity-90 line-clamp-1">
                               <MapPin size={10} className="text-pink-600"/> {apt.notes}
                             </span>
                           )}
                           {apt.patient?.phone && (
                             <span className="flex items-center gap-1.5 text-[10px] font-medium opacity-90">
                               <User size={10} className="text-pink-600"/> {apt.patient.phone}
                             </span>
                           )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {!loading && appointments.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none select-none">
                <Clock size={64} className="mb-4 opacity-10"/>
                <span className="text-xl font-bold opacity-30">Agenda Livre</span>
                <span className="text-sm opacity-30 mt-1">Nenhum atendimento marcado</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}