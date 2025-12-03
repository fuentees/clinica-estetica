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
  resource?: any;
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
      
      // CORREÇÃO CRÍTICA AQUI: Usamos a relação profiles(first_name, last_name)
      // para puxar o nome do paciente pelo ID do Perfil.
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          patients:patient_id (
            profiles:profile_id (first_name, last_name)
          ),
          treatments ( name )
        `);

      if (error) throw error;

      // Mapeia os dados do Supabase para o formato do Calendário
      const formattedEvents: CalendarEvent[] = (data || []).map((appt: any) => {
        
        // Extrai o nome do perfil do paciente (com segurança)
        const patientProfile = appt.patients?.profiles;
        const patientName = patientProfile
          ? `${patientProfile.first_name || 'Sem Nome'} ${patientProfile.last_name || ''}`
          : 'Paciente Desconhecido';
          
        const treatmentName = appt.treatments?.name || 'Consulta';

        return {
            id: appt.id,
            title: `${patientName} - ${treatmentName}`,
            start: new Date(appt.start_time),
            end: new Date(appt.end_time),
            resource: { status: appt.status }
        };
      });

      setEvents(formattedEvents);

    } catch (error) {
      console.error('Erro ao buscar agenda:', error);
      toast.error('Erro ao carregar agenda. Verifique o console (F12).');
    } finally {
      setLoading(false);
    }
  }

  // Estilização condicional dos eventos (Cores por status)
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6'; // Azul (Padrão)
    
    if (event.resource?.status === 'completed') backgroundColor = '#22c55e'; // Verde
    if (event.resource?.status === 'cancelled') backgroundColor = '#ef4444'; // Vermelho
    if (event.resource?.status === 'waiting') backgroundColor = '#f59e0b'; // Laranja

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.85rem'
      }
    };
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    navigate(`/appointments/new?date=${slotInfo.start.toISOString()}`);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    toast(`Paciente: ${event.title}`);
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
        <Link to="/appointments/new">
          <Button className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-2 shadow-md transition-all hover:scale-105">
            <Plus size={18} /> Novo Agendamento
          </Button>
        </Link>
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
            noEventsInRange: "Sem agendamentos neste período."
          }}
          defaultView={Views.WEEK}
          views={['month', 'week', 'day', 'agenda']}
          view={view}
          onView={setView}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          min={new Date(0, 0, 0, 8, 0, 0)} // Início do dia (08:00)
          max={new Date(0, 0, 0, 20, 0, 0)} // Fim do dia (20:00)
        />
      </div>
    </div>
  );
}