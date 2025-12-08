import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, Loader2, Plus, Trash2, User, Sparkles, Pencil
} from 'lucide-react';
import { Button } from '../../components/ui/button';

// Utilitários de Data
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

type Appointment = {
  id: string;
  date: string;
  start_time: string;
  status: string;
  patient_name: string;
  treatment_name: string;
  patient_id: string;
};

export default function ProfessionalAgendaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [monthAppointments, setMonthAppointments] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      fetchMonthOverview(id, currentDate);
      fetchDayAppointments(id, selectedDate);
    }
  }, [id, currentDate, selectedDate]);

  // 1. Visão Geral do Mês (Para as bolinhas indicadoras)
  async function fetchMonthOverview(profId: string, date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = `${year}-${String(month).padStart(2, '0')}-31`; 

    const { data } = await supabase
      .from('appointments')
      .select('date')
      .eq('professional_id', profId)
      .gte('date', start)
      .lte('date', end);

    if (data) {
      const dates = Array.from(new Set(data.map(a => a.date)));
      setMonthAppointments(dates);
    }
  }

  // 2. Detalhes do Dia (Lista lateral)
  async function fetchDayAppointments(profId: string, date: Date) {
    setLoading(true);
    const dateStr = date.toLocaleDateString('en-CA'); // Formato YYYY-MM-DD

    try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id, date, start_time, status,
            patient:patient_id (id, name, profiles(first_name, last_name)),
            treatment:treatment_id (name)
          `)
          .eq('professional_id', profId)
          .eq('date', dateStr)
          .order('start_time');

        if (error) throw error;

        if (data) {
            const mapped = data.map((item: any) => {
                const p = Array.isArray(item.patient) ? item.patient[0] : item.patient;
                const t = Array.isArray(item.treatment) ? item.treatment[0] : item.treatment;
                
                // Lógica para pegar o nome correto
                let pName = 'Paciente';
                if (p) {
                    if (p.name && p.name !== 'Paciente') pName = p.name;
                    else if (p.profiles) {
                        const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
                        if (prof?.first_name) pName = `${prof.first_name} ${prof.last_name || ''}`;
                    }
                }

                return {
                    id: item.id,
                    date: item.date,
                    start_time: item.start_time,
                    status: item.status,
                    patient_id: p?.id,
                    patient_name: pName,
                    treatment_name: t?.name || 'Procedimento'
                };
            });
            setAppointments(mapped);
        }
    } catch (err) {
        console.error("Erro ao buscar agenda:", err);
    } finally {
        setLoading(false);
    }
  }

  // --- AÇÃO: EXCLUIR ---
  const handleDeleteAppointment = async (apptId: string) => {
      if (window.confirm("Tem certeza que deseja excluir este agendamento?")) {
          try {
              const { error } = await supabase.from('appointments').delete().eq('id', apptId);
              if (error) throw error;
              
              toast.success("Agendamento excluído.");
              // Recarrega os dados
              if (id) {
                  fetchDayAppointments(id, selectedDate);
                  fetchMonthOverview(id, currentDate);
              }
          } catch (error) {
              toast.error("Erro ao excluir.");
          }
      }
  };

  // --- AÇÃO: EDITAR ---
  const handleEditAppointment = (apptId: string) => {
      navigate(`/appointments/${apptId}/edit`);
  };

  const handleNewAppointment = () => {
    const dateStr = selectedDate.toLocaleDateString('en-CA');
    navigate(`/appointments/new?professionalId=${id}&date=${dateStr}`);
  };

  // Lógica do Calendário
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentDate);
  const changeMonth = (val: number) => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + val)));
  const handleDayClick = (day: number) => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));

  const blanks = Array(firstDay).fill(null);
  const monthDays = Array.from({ length: days }, (_, i) => i + 1);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] animate-in fade-in duration-500">
      
      {/* CALENDÁRIO VISUAL */}
      <div className="lg:w-7/12 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
            {MONTHS[currentDate.getMonth()]} <span className="text-pink-600">{currentDate.getFullYear()}</span>
          </h2>
          <div className="flex gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><ChevronLeft size={20}/></button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><ChevronRight size={20}/></button>
          </div>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold text-gray-400 uppercase">
            {DAYS.map(d => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2 h-full auto-rows-fr">
            {blanks.map((_, i) => <div key={`b-${i}`}/>)}
            {monthDays.map(day => {
              const isSel = day === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth();
              const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
              const hasAppt = monthAppointments.includes(`${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`);

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`relative flex flex-col items-center justify-center rounded-2xl transition-all aspect-square sm:aspect-auto sm:h-20 
                    ${isSel ? 'bg-pink-600 text-white shadow-md shadow-pink-200 dark:shadow-none scale-105 z-10' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'} 
                    ${isToday && !isSel ? 'bg-pink-50 text-pink-700 border border-pink-100' : ''}`}
                >
                  <span className={`text-lg ${isSel || isToday ? 'font-bold' : ''}`}>{day}</span>
                  {hasAppt && <div className={`mt-1 w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white' : 'bg-pink-500'}`} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* LISTA DE AGENDAMENTOS */}
      <div className="lg:w-5/12 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CalendarIcon className="text-pink-600" size={20}/>
            {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
        </h3>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-pink-600"/></div> : 
             appointments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 opacity-60">
                    <CalendarIcon size={48} className="mb-2 stroke-1"/>
                    <p>Agenda livre neste dia.</p>
                </div>
            ) : appointments.map(appt => (
                <div key={appt.id} className="group flex gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-white dark:hover:bg-gray-700 transition-all shadow-sm">
                    {/* Hora */}
                    <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-gray-200 dark:border-gray-600 pr-4">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {appt.start_time.slice(0, 5)}
                        </span>
                        <Clock size={12} className="text-gray-400 mt-1"/>
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <User size={14} className="text-pink-500"/>
                            {appt.patient_name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Sparkles size={12}/> {appt.treatment_name}
                        </p>
                    </div>

                    {/* BOTÕES DE AÇÃO: EDITAR E EXCLUIR */}
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => handleEditAppointment(appt.id)}
                            className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                            title="Editar"
                        >
                            <Pencil size={16} />
                        </button>
                        <button 
                            onClick={() => handleDeleteAppointment(appt.id)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                            title="Excluir"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button onClick={handleNewAppointment} className="w-full bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-pink-200 dark:shadow-none">
                <Plus size={18} /> Novo Agendamento
            </Button>
        </div>
      </div>

    </div>
  );
}