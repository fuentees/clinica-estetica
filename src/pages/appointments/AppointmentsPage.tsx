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
      
      // 1. Busca APENAS os dados puros da tabela (SEM RELAÇÃO PARA NÃO DAR ERRO)
      const { data: appointments, error: appError } = await supabase
        .from('appointments')
        .select('*'); // Pega tudo, inclusive patient_id e treatment_id

      if (appError) throw appError;
      if (!appointments) return;

      // 2. Extrai os IDs para buscar os nomes manualmente
      const patientIds = appointments.map(a => a.patient_id).filter(Boolean);
      const treatmentIds = appointments.map(a => a.treatment_id).filter(Boolean);

      // 3. Busca os nomes dos Pacientes (Manual Fetch)
      const { data: patients } = await supabase
        .from('patients')
        .select('id, name')
        .in('id', patientIds);

      // 4. Busca os nomes dos Tratamentos (Manual Fetch)
      const { data: treatments } = await supabase
        .from('treatments')
        .select('id, name')
        .in('id', treatmentIds);

      // 5. CRUZA OS DADOS NO JAVASCRIPT (Manual Join)
      const formattedEvents: CalendarEvent[] = appointments.map((appt: any) => {
        // Encontra o nome na lista que baixamos
        const foundPatient = patients?.find(p => p.id === appt.patient_id);
        const foundTreatment = treatments?.find(t => t.id === appt.treatment_id);

        const patientName = foundPatient?.name || 'Paciente';
        const treatmentName = foundTreatment?.name || 'Consulta';

        return {
            id: appt.id,
            title: `${patientName} - ${treatmentName}`,
            start: new Date(appt.start_time),
            end: new Date(appt.end_time),
            resource: { status: appt.status }
        };
      });

      setEvents(formattedEvents);

    } catch (error: any) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }

  // Estilização condicional dos eventos
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6'; // Azul
    
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
    toast(`Agendamento: ${event.title}`);
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
            noEventsInRange: "Sem agendamentos."
          }}
          defaultView={Views.WEEK}
          views={['month', 'week', 'day', 'agenda']}
          view={view}
          onView={setView}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          min={new Date(0, 0, 0, 8, 0, 0)} 
          max={new Date(0, 0, 0, 20, 0, 0)} 
        />
      </div>
    </div>
  );
}