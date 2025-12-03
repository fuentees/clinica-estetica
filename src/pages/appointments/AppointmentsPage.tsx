import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
// --- CORREÇÃO DOS IMPORTS DATE-FNS ---
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// --------------------------------------
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';

// Configuração de idioma (Português)
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

// Interface do Evento
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
  const [view, setView] = useState<View>(Views.WEEK); // Começa na visão Semanal

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      setLoading(true);
      
      // Busca agendamentos com dados do paciente e tratamento
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          patients ( first_name, last_name ),
          treatments ( name )
        `);

      if (error) throw error;

      // Transforma os dados do Supabase para o formato do Calendário
      const formattedEvents: CalendarEvent[] = (data || []).map((appt: any) => ({
        id: appt.id,
        title: `${appt.patients?.first_name || 'Paciente'} - ${appt.treatments?.name || 'Consulta'}`,
        start: new Date(appt.start_time),
        end: new Date(appt.end_time),
        resource: { status: appt.status }
      }));

      setEvents(formattedEvents);

    } catch (error) {
      console.error('Erro ao buscar agenda:', error);
      toast.error('Erro ao carregar agenda.');
    } finally {
      setLoading(false);
    }
  }

  // Estilização condicional dos eventos (Cores por status)
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6'; // Azul padrão
    
    if (event.resource?.status === 'completed') backgroundColor = '#22c55e'; // Verde
    if (event.resource?.status === 'cancelled') backgroundColor = '#ef4444'; // Vermelho
    if (event.resource?.status === 'waiting') backgroundColor = '#f59e0b'; // Laranja

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    // Ao clicar num horário vazio, vai para a criação já com a data pré-selecionada
    navigate(`/appointments/new?date=${slotInfo.start.toISOString()}`);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    // Ao clicar no evento, mostra quem é
    toast(`Paciente: ${event.title}`);
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-pink-600" /></div>;

  return (
    <div className="p-6 h-screen flex flex-col space-y-4">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Agenda</h1>
        <Link to="/appointments/new">
          <Button className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-2">
            <Plus size={18} /> Novo Agendamento
          </Button>
        </Link>
      </div>

      {/* O Calendário */}
      <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', minHeight: '500px' }}
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
          defaultView={Views.WEEK} // Visão padrão: Semana
          views={['month', 'week', 'day', 'agenda']} // Opções de visão
          view={view} // Estado controlado da visão
          onView={setView} // Atualiza estado ao trocar visão
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          min={new Date(0, 0, 0, 8, 0, 0)} // Começa a mostrar às 08:00
          max={new Date(0, 0, 0, 20, 0, 0)} // Termina de mostrar às 20:00
        />
      </div>
    </div>
  );
}