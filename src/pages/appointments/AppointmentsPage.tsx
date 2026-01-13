import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    status: string;
    professionalName: string;
    serviceName: string;
    room?: string;
    notes?: string;
  };
}

export function AppointmentsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>(Views.WEEK);

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

      if (!profile?.clinic_id) throw new Error("Clínica não identificada.");

      // ✅ BUSCA AVANÇADA: Trazendo Serviço e Sala
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id, start_time, end_time, status, notes, room,
          patient:patients(name),
          professional:profiles(first_name, last_name),
          service:services(name)
        `)
        .eq('clinic_id', profile.clinic_id);

      if (error) throw error;

      const formattedEvents: CalendarEvent[] = (appointments || []).map((appt: any) => ({
        id: appt.id,
        title: `${appt.patient?.name || 'Paciente'} - ${appt.service?.name || 'Consulta'}`,
        start: new Date(appt.start_time),
        end: new Date(appt.end_time),
        resource: {
          status: appt.status,
          professionalName: `${appt.professional?.first_name || ''} ${appt.professional?.last_name || ''}`.trim(),
          serviceName: appt.service?.name || 'N/A',
          room: appt.room,
          notes: appt.notes
        }
      }));

      setEvents(formattedEvents);
    } catch (error: any) {
      toast.error('Erro ao carregar agenda.');
    } finally {
      setLoading(false);
    }
  }

  // ✅ ESTILIZAÇÃO POR STATUS (Cores Vilagi)
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6'; // Agendado (Azul)
    const status = event.resource?.status;

    if (status === 'completed') backgroundColor = '#10b981'; // Realizado (Verde)
    if (status === 'canceled') backgroundColor = '#ef4444';  // Cancelado (Vermelho)
    if (status === 'confirmed') backgroundColor = '#8b5cf6'; // Confirmado (Roxo)
    if (status === 'no_show') backgroundColor = '#6b7280';  // Faltou (Cinza)

    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        border: 'none',
        color: 'white',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '4px 8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        display: 'block'
      }
    };
  };

  const handleSelectSlot = (slotInfo: { start: Date }) => {
    navigate(`/appointments/new?date=${slotInfo.start.toISOString()}`);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    navigate(`/appointments/${event.id}/edit`);
  };

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Loader2 className="animate-spin text-pink-600 w-12 h-12 mb-4" />
      <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Sincronizando Agenda...</p>
    </div>
  );

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col gap-6 animate-in fade-in duration-700">
      
      {/* HEADER DA AGENDA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-pink-600 shadow-sm border border-gray-100">
              <CalendarIcon size={28}/>
           </div>
           <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Agenda <span className="text-pink-600">Global</span></h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Vilagi Estética Avançada</p>
           </div>
        </div>
        
        <div className="flex gap-3">
            <Button variant="outline" className="h-12 px-6 rounded-xl border-gray-200 font-bold text-gray-600 uppercase text-[10px] tracking-widest hover:bg-gray-50">
                <Filter size={16} className="mr-2"/> Filtrar
            </Button>
            <Button onClick={() => navigate('/appointments/new')} className="bg-gray-900 hover:bg-black text-white h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all hover:scale-105">
                <Plus size={18} className="mr-2" /> Novo Agendamento
            </Button>
        </div>
      </div>

      {/* CALENDÁRIO DESIGN VILAGI */}
      <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-blue-500"></div>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', fontFamily: 'inherit' }}
          culture="pt-BR"
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Agenda",
            noEventsInRange: "Nenhum agendamento para este período."
          }}
          defaultView={Views.WEEK}
          views={['month', 'week', 'day', 'agenda']}
          view={view}
          onView={setView}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          min={new Date(0, 0, 0, 8, 0, 0)} // Início às 08:00
          max={new Date(0, 0, 0, 21, 0, 0)} // Fim às 21:00
          step={30}
          timeslots={2}
          // Personalização de conteúdo do evento
          components={{
            event: ({ event }: any) => (
              <div className="flex flex-col h-full justify-between">
                <span className="truncate">{event.title}</span>
                <div className="flex items-center justify-between mt-1 opacity-80 text-[9px]">
                  <span className="font-black italic">{event.resource?.room || 'S/ SALA'}</span>
                  <span>{event.resource?.professionalName.split(' ')[0]}</span>
                </div>
              </div>
            )
          }}
        />
      </div>

      {/* LEGENDA RÁPIDA */}
      <div className="flex flex-wrap gap-4 px-2">
          <LegendItem color="bg-blue-500" label="Agendado" />
          <LegendItem color="bg-purple-500" label="Confirmado" />
          <LegendItem color="bg-emerald-500" label="Realizado" />
          <LegendItem color="bg-rose-500" label="Cancelado" />
          <LegendItem color="bg-gray-500" label="Faltou" />
      </div>
    </div>
  );
}

const LegendItem = ({ color, label }: { color: string, label: string }) => (
    <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
    </div>
);