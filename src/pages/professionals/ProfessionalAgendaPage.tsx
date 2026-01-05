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
  Sparkles
} from "lucide-react";
import { format, addDays, subDays, isSameDay, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "react-hot-toast";

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
const HOUR_HEIGHT = 100; 

export default function ProfessionalAgendaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // --- 1. BUSCA DE DADOS (SaaS MULTI-TENANT READY) ---
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
      toast.error("Erro ao sincronizar agenda técnica.");
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
      case 'concluido': return 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-900/20';
      case 'cancelado': return 'bg-rose-50 border-rose-200 text-rose-900 opacity-60 dark:bg-rose-900/20';
      case 'falta': return 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20';
      default: return 'bg-white dark:bg-gray-700 border-pink-200 text-gray-900 dark:text-white shadow-sm hover:border-pink-400'; 
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
    <div className="flex flex-col h-[calc(100vh-120px)] bg-gray-50 dark:bg-gray-950 rounded-[2.5rem] overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl animate-in fade-in duration-700">
      
      {/* HEADER DA AGENDA */}
      <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 z-30 gap-4">
        <div className="flex items-center gap-6">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5 shadow-inner">
            <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all text-gray-600 dark:text-white shadow-sm">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setSelectedDate(new Date())} className="px-6 text-[10px] font-black uppercase tracking-[0.2em] hover:text-pink-600 transition-colors text-gray-500">
              Hoje
            </button>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all text-gray-600 dark:text-white shadow-sm">
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="space-y-0.5">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white capitalize italic tracking-tighter flex items-center gap-3">
              <CalendarIcon size={24} className="text-pink-600"/>
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-9">Planejamento Diário de Procedimentos</p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/appointments/new')}
          className="h-14 px-8 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
        >
          <Plus size={20} className="text-pink-500" /> Reservar Horário
        </button>
      </div>

      {/* ÁREA DE SCROLL DO CALENDÁRIO */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-white dark:bg-gray-900">
        {loading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-gray-950/60 z-50 flex flex-col items-center justify-center backdrop-blur-md gap-4">
            <Loader2 className="animate-spin text-pink-600" size={48} />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Sincronizando Grade...</p>
          </div>
        )}

        <div className="flex min-h-full relative pb-20">
          
          {/* RÉGUA LATERAL (TIMELINE) */}
          <div className="w-24 flex-shrink-0 border-r border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-950/30 pt-6">
            {hoursList.map((hour) => (
              <div 
                key={hour} 
                className="text-[10px] font-black text-gray-300 dark:text-gray-600 text-center relative"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="-translate-y-3 block italic tracking-tighter">{hour.toString().padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {/* GRID PRINCIPAL */}
          <div 
            className="flex-1 relative pt-6"
            style={{ 
              backgroundImage: `linear-gradient(to bottom, #f9fafb 1px, transparent 1px)`,
              backgroundSize: `100% ${HOUR_HEIGHT}px`,
              backgroundPositionY: '24px' 
            }}
          >
            {/* LINHA DO TEMPO ATUAL (REAL-TIME) */}
            {isSameDay(selectedDate, new Date()) && (
              <div 
                className="absolute w-full border-t-2 border-rose-500 z-30 pointer-events-none opacity-100 flex items-center"
                style={{ 
                  top: `${((new Date().getHours() * 60 + new Date().getMinutes()) - (START_HOUR * 60)) / 60 * HOUR_HEIGHT + 24}px` 
                }}
              >
                <div className="absolute -left-1 w-3 h-3 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                <div className="ml-4 px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded uppercase tracking-widest">Agora</div>
              </div>
            )}

            {/* CARDS DE AGENDAMENTO */}
            <div className="relative mr-8 ml-2">
                {appointments.map((apt) => {
                  const pos = getPositionStyles(apt.start_time, apt.end_time);
                  
                  return (
                    <div
                      key={apt.id}
                      onClick={() => navigate(`/appointments/${apt.id}/edit`)}
                      className={`
                        absolute left-0 right-0 rounded-3xl border-2 p-5 cursor-pointer transition-all 
                        hover:scale-[1.01] hover:z-40 shadow-sm group
                        ${getStatusColor(apt.status)}
                      `}
                      style={{ top: `calc(${pos.top})`, height: pos.height }} 
                    >
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black bg-gray-900 text-white px-3 py-1 rounded-full italic tracking-tighter">
                              {format(new Date(apt.start_time), 'HH:mm')} - {format(new Date(apt.end_time), 'HH:mm')}
                            </span>
                            <Sparkles size={14} className="text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          
                          <h3 className="font-black text-base leading-tight uppercase tracking-tighter italic line-clamp-1">
                            {apt.patient?.name || "Paciente sem nome"}
                          </h3>
                        </div>

                        <div className="flex items-center gap-4 mt-4 opacity-70 group-hover:opacity-100 transition-opacity">
                            {apt.notes && (
                              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest truncate">
                                <MapPin size={12} className="text-pink-500"/> {apt.notes}
                              </span>
                            )}
                            {apt.patient?.phone && (
                              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                                <User size={12} className="text-pink-500"/> {apt.patient.phone}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* EMPTY STATE */}
            {!loading && appointments.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="p-8 rounded-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                    <Clock size={64} className="text-gray-200 dark:text-gray-700"/>
                </div>
                <span className="text-xs font-black text-gray-300 uppercase tracking-[0.4em] mt-6">Agenda Livre</span>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Nenhum atendimento para este dia</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}