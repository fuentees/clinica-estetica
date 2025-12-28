import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  Calendar, Clock, User, TrendingUp, Filter,
  Check, X, AlertCircle
} from 'lucide-react';

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
  resource: {
    id: string;
    patient_id: string;
    professional_id: string;
    treatment_id: string;
    status: string;
    notes: string;
    patientName: string;
    professionalName: string;
    treatmentName: string;
    hasCredit: boolean;
  };
}

export function AdvancedCalendarPage() {
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['calendar-appointments', selectedProfessional],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patient_id (name, profiles (first_name, last_name)),
          professional:professional_id (first_name, last_name),
          treatment:treatment_id (name),
          session_credit_id
        `)
        .gte('start_time', format(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd'))
        .lte('start_time', format(new Date(date.getFullYear(), date.getMonth() + 1, 0), 'yyyy-MM-dd'));

      if (selectedProfessional !== 'all') {
        query = query.eq('professional_id', selectedProfessional);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map((apt: any) => ({
        id: apt.id,
        title: `${apt.patient?.profiles?.first_name || apt.patient?.name} - ${apt.treatment?.name}`,
        start: new Date(apt.start_time),
        end: new Date(apt.end_time),
        resource: {
          id: apt.id,
          patient_id: apt.patient_id,
          professional_id: apt.professional_id,
          treatment_id: apt.treatment_id,
          status: apt.status,
          notes: apt.notes,
          patientName: `${apt.patient?.profiles?.first_name} ${apt.patient?.profiles?.last_name || apt.patient?.name}`,
          professionalName: `${apt.professional?.first_name} ${apt.professional?.last_name}`,
          treatmentName: apt.treatment?.name,
          hasCredit: !!apt.session_credit_id,
        },
      })) as CalendarEvent[];
    },
  });

  const { data: professionals } = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .neq('role', 'patient');

      if (error) throw error;
      return data;
    },
  });

  const moveAppointment = useMutation({
    mutationFn: async ({
      appointmentId,
      newStart,
      newEnd,
    }: {
      appointmentId: string;
      newStart: Date;
      newEnd: Date;
    }) => {
      const { data: conflicts } = await supabase.rpc('check_appointment_conflicts', {
        p_professional_id: appointments?.find((a) => a.id === appointmentId)?.resource
          .professional_id,
        p_start_time: newStart.toISOString(),
        p_end_time: newEnd.toISOString(),
        p_appointment_id: appointmentId,
      });

      if (conflicts) {
        throw new Error('Conflito de horário detectado!');
      }

      const { error } = await supabase
        .from('appointments')
        .update({
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString(),
          date: format(newStart, 'yyyy-MM-dd'),
        })
        .eq('id', appointmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      toast.success('Agendamento movido com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao mover agendamento');
    },
  });

  const handleEventDrop = useCallback(
    ({ event, start, end }: any) => {
      moveAppointment.mutate({
        appointmentId: event.id,
        newStart: start,
        newEnd: end,
      });
    },
    [moveAppointment]
  );

  const handleSelectSlot = useCallback(
    ({ start, professional }: any) => {
      const professionalId = selectedProfessional !== 'all' ? selectedProfessional : professional;
      window.location.href = `/appointments/new?date=${format(
        start,
        'yyyy-MM-dd'
      )}&professionalId=${professionalId}`;
    },
    [selectedProfessional]
  );

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6';
    let borderColor = '#2563eb';

    switch (event.resource.status) {
      case 'completed':
        backgroundColor = '#22c55e';
        borderColor = '#16a34a';
        break;
      case 'cancelled':
        backgroundColor = '#ef4444';
        borderColor = '#dc2626';
        break;
      case 'confirmed':
        backgroundColor = '#8b5cf6';
        borderColor = '#7c3aed';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
        fontWeight: event.resource.hasCredit ? 'bold' : 'normal',
      },
    };
  };

  const stats = {
    total: appointments?.length || 0,
    completed: appointments?.filter((a) => a.resource.status === 'completed').length || 0,
    pending: appointments?.filter((a) => a.resource.status === 'scheduled').length || 0,
    withCredits: appointments?.filter((a) => a.resource.hasCredit).length || 0,
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Calendar className="text-blue-600" size={36} />
            Calendário Avançado
          </h1>
          <p className="text-gray-600">Arraste e solte para reagendar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-semibold">Total</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <Calendar size={32} className="text-blue-400" />
          </div>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-semibold">Concluídos</p>
              <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
            </div>
            <Check size={32} className="text-green-400" />
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-700 text-sm font-semibold">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
            </div>
            <Clock size={32} className="text-yellow-400" />
          </div>
        </div>

        <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-semibold">Com Créditos</p>
              <p className="text-2xl font-bold text-purple-900">{stats.withCredits}</p>
            </div>
            <TrendingUp size={32} className="text-purple-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Filter size={20} className="text-gray-600" />
          <select
            value={selectedProfessional}
            onChange={(e) => setSelectedProfessional(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="all">Todos os Profissionais</option>
            {professionals?.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.first_name} {prof.last_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Agendado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Concluído</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span>Confirmado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Cancelado</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-purple-600" />
            <span className="font-bold">Com Crédito</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6" style={{ height: '700px' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Carregando calendário...</div>
          </div>
        ) : (
          <BigCalendar
            localizer={localizer}
            events={appointments || []}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onEventDrop={handleEventDrop}
            onSelectSlot={handleSelectSlot}
            eventPropGetter={eventStyleGetter}
            selectable
            resizable
            draggableAccessor={() => true}
            style={{ height: '100%' }}
            messages={{
              next: 'Próximo',
              previous: 'Anterior',
              today: 'Hoje',
              month: 'Mês',
              week: 'Semana',
              day: 'Dia',
              agenda: 'Agenda',
            }}
            formats={{
              dayHeaderFormat: (date) => format(date, 'dd/MM', { locale: ptBR }),
              dayRangeHeaderFormat: ({ start, end }) =>
                `${format(start, 'dd/MM', { locale: ptBR })} - ${format(end, 'dd/MM', {
                  locale: ptBR,
                })}`,
            }}
          />
        )}
      </div>
    </div>
  );
}
