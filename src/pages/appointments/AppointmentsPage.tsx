import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import 'react-big-calendar/lib/css/react-big-calendar.css';

import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';

// Configuração de localização (Português)
const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    status: string;
    professionalName?: string;
    notes?: string;
  };
}

export function AppointmentsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>(Views.WEEK);
  
  // REMOVIDO: const [clinicId, setClinicId] = useState... (Não era usado)

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      setLoading(true);
      
      // 1. Identificar a Clínica
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('clinicId').eq('id', user.id).single();
      
      // Se não tiver clínica, para por aqui
      if (!profile?.clinicId) return;

      // 2. Buscar Agendamentos (JA COM OS RELACIONAMENTOS)
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
            id, 
            startAt, 
            endAt, 
            status, 
            notes,
            patient:patientId ( name ),
            service:serviceId ( name ),
            professional:professionalId ( firstName )
        `)
        .eq('clinicId', profile.clinicId); // Filtra usando a variável local 'profile'

      if (error) throw error;
      if (!appointments) return;

      // 3. Formata para o Calendário
      const formattedEvents: CalendarEvent[] = appointments.map((appt: any) => {
        const patientName = Array.isArray(appt.patient) ? appt.patient[0]?.name : appt.patient?.name;
        const serviceName = Array.isArray(appt.service) ? appt.service[0]?.name : appt.service?.name;
        const profName = Array.isArray(appt.professional) ? appt.professional[0]?.firstName : appt.professional?.firstName;

        return {
            id: appt.id,
            title: `${patientName || 'Paciente'} - ${serviceName || 'Consulta'}`,
            start: new Date(appt.startAt),
            end: new Date(appt.endAt),
            resource: { 
                status: appt.status,
                professionalName: profName,
                notes: appt.notes
            }
        };
      });

      setEvents(formattedEvents);

    } catch (error: any) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar agenda.');
    } finally {
      setLoading(false);
    }
  }

  // Estilização condicional dos eventos
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6'; // Azul (Scheduled)
    
    const status = event.resource?.status;
    if (status === 'completed') backgroundColor = '#10b981'; // Verde
    if (status === 'cancelled') backgroundColor = '#ef4444'; // Vermelho
    if (status === 'no_show') backgroundColor = '#6b7280';   // Cinza

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.95,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.80rem',
        padding: '2px 5px'
      }
    };
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    navigate(`/appointments/new?date=${slotInfo.start.toISOString()}`);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    navigate(`/appointments/edit/${event.id}`);
  };

  if (loading) return <div className="flex justify-center items-center h-full p-10"><Loader2 className="animate-spin text-pink-600 w-8 h-8" /></div>;

  return (
    <div className="p-6 h-screen flex flex-col gap-4">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Agenda</h1>
          <p className="text-gray-500 text-sm">Gerencie os horários da clínica.</p>
        </div>
        
        <div className="flex gap-2">
            <Link to="/appointments/new">
            <Button className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-2 shadow-md transition-all hover:scale-105">
                <Plus size={18} /> Novo Agendamento
            </Button>
            </Link>
        </div>
      </div>

      {/* Calendário Visual */}
      <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', minHeight: '600px' }}
          culture="pt-BR"
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Lista",
            date: "Data",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "Sem agendamentos nesta data."
          }}
          defaultView={Views.WEEK}
          views={['month', 'week', 'day', 'agenda']}
          view={view}
          onView={setView}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          min={new Date(0, 0, 0, 7, 0, 0)} 
          max={new Date(0, 0, 0, 21, 0, 0)} 
        />
      </div>
    </div>
  );
}