import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import 'react-big-calendar/lib/css/react-big-calendar.css';

import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';

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
  
  // --- CARREGAMENTO DA AGENDA ---
  useEffect(() => {
    let isMounted = true;

    const timeout = setTimeout(() => {
        if (isMounted && loading) {
            setLoading(false);
            // toast.error("Demora na resposta do servidor."); // Opcional
        }
    }, 10000);

    async function fetchAppointments() {
      try {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Pega ClinicId (snake_case)
        const { data: profile } = await supabase
            .from('profiles')
            .select('clinic_id:clinic_id')
            .eq('id', user.id)
            .single();
            
        if (!profile?.clinic_id) {
            toast.error("Clínica não encontrada.");
            return;
        }

        // 2. Busca Agendamentos (JOIN CORRIGIDO)
        // O Supabase precisa saber qual FK usar. Usamos !professional_id e !patient_id
        const { data: appointments, error } = await supabase
          .from('appointments')
          .select(`
            id, start_time, end_time, status, notes,
            patient:patients!patient_id ( name ),
            professional:profiles!professional_id ( first_name, last_name )
          `) 
          .eq('clinic_id', profile.clinic_id);

        if (error) throw error;
        if (!appointments) return;

        // 3. Formata para o Calendário
        const formattedEvents: CalendarEvent[] = appointments.map((appt: any) => {
          // Tratamento seguro para relacionamentos
          const patientName = appt.patient?.name || 'Paciente';
          
          const profName = appt.professional 
            ? `${appt.professional.first_name} ${appt.professional.last_name || ''}`.trim()
            : '?';

          return {
            id: appt.id,
            title: `${patientName} (${profName})`,
            // O Banco retorna ISO String (ex: "2023-10-05T09:00:00")
            // O Calendar precisa de Objeto Date
            start: new Date(appt.start_time), 
            end: new Date(appt.end_time),
            resource: { 
              status: appt.status,
              professionalName: profName,
              notes: appt.notes
            }
          };
        });

        if (isMounted) setEvents(formattedEvents);

      } catch (error: any) {
        console.error('Erro:', error);
        toast.error('Erro ao carregar agenda.');
      } finally {
        if (isMounted) setLoading(false);
        clearTimeout(timeout);
      }
    }

    fetchAppointments();

    return () => { isMounted = false; clearTimeout(timeout); };
  }, []);

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6'; // Azul padrão
    const status = event.resource?.status;
    
    // Cores baseadas no status
    if (status === 'confirmed') backgroundColor = '#10b981'; // Verde
    if (status === 'completed') backgroundColor = '#8b5cf6'; // Roxo
    if (status === 'canceled') backgroundColor = '#ef4444';  // Vermelho
    if (status === 'no_show') backgroundColor = '#6b7280';   // Cinza
    if (status === 'scheduled') backgroundColor = '#3b82f6'; // Azul

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        border: 'none',
        color: 'white',
        fontSize: '0.75rem', // text-xs
        fontWeight: '600',
        padding: '2px 6px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    };
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    // Redireciona para criação com a data pré-selecionada
    // ISOString é seguro para passar na URL
    navigate(`/appointments/new?date=${slotInfo.start.toISOString()}`);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    // Redireciona para edição
    navigate(`/appointments/${event.id}/edit`);
  };

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 gap-4">
        <Loader2 className="animate-spin text-pink-600 w-10 h-10" />
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">Carregando Agenda...</p>
    </div>
  );

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col gap-6 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/20 rounded-2xl flex items-center justify-center text-pink-600 shadow-sm">
              <CalendarIcon size={24}/>
           </div>
           <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda Geral</h1>
              <p className="text-gray-500 text-sm font-medium">Visão global da clínica</p>
           </div>
        </div>
        
        <Link to="/appointments/new">
            <Button className="bg-gray-900 hover:bg-black text-white h-12 px-6 rounded-xl font-bold shadow-lg transition-all hover:scale-105 flex items-center gap-2">
                <Plus size={18} /> Novo Agendamento
            </Button>
        </Link>
      </div>

      {/* Calendário Container */}
      <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
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
            agenda: "Lista",
            date: "Data",
            time: "Hora",
            event: "Paciente",
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
          min={new Date(0, 0, 0, 7, 0, 0)} // Começa as 07:00
          max={new Date(0, 0, 0, 21, 0, 0)} // Termina as 21:00
          step={30} // Blocos de 30 min
          timeslots={2}
        />
      </div>
    </div>
  );
}