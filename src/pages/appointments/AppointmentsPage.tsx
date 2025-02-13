import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, EventPropGetter } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { useAppointments } from "../../hooks/useAppointments";
import { Modal } from "../../components/ui/modal";
import "react-big-calendar/lib/css/react-big-calendar.css";
import type { Appointment } from "../../types/appointment";

const locales = { "pt-BR": ptBR };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export function AppointmentsPage() {
  const [date, setDate] = useState(new Date());
  const { data: appointments, isLoading, error } = useAppointments();
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);

  useEffect(() => {
    console.log("Compromissos recebidos:", appointments);
  }, [appointments]);

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-md">
        <h1 className="text-2xl font-bold">Erro ao carregar a agenda ❌</h1>
        <p>Não foi possível carregar os compromissos. Tente novamente mais tarde.</p>
      </div>
    );
  }

  const events =
    appointments?.map((appointment) => ({
      id: appointment.id,
      title: `${appointment.patient?.first_name || "Paciente"} - ${appointment.treatment?.name || "Sem Tratamento"}`,
      start: appointment.start_time ? new Date(appointment.start_time) : new Date(),
      end: appointment.end_time ? new Date(appointment.end_time) : new Date(),
      resource: appointment,
    })) || [];

  const eventStyleGetter: EventPropGetter<any> = () => {
    return {
      style: {
        backgroundColor: "#3b82f6",
        color: "white",
        borderRadius: "5px",
        padding: "5px",
      },
    };
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📅 Agenda</h1>

      <div className="flex justify-between mb-4">
        <Link to="/appointments/new">
          <Button variant="primary">➕ Nova Consulta</Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Carregando agenda...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500">Nenhum compromisso encontrado.</p>
      ) : (
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "calc(100vh - 250px)", borderRadius: "8px" }}
          date={date}
          onNavigate={setDate}
          defaultView="week"
          views={["month", "week", "day"]}
          step={30}
          timeslots={2}
          culture="pt-BR"
          messages={{
            today: "Hoje",
            previous: "Anterior",
            next: "Próximo",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Agenda",
          }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event) => setSelectedEvent(event.resource || null)}
        />
      )}

      {selectedEvent && (
        <Modal onClose={() => setSelectedEvent(null)} title="Detalhes da Consulta">
          <p>
            <strong>Paciente:</strong> {selectedEvent.patient?.first_name} {selectedEvent.patient?.last_name}
          </p>
          <p><strong>Tratamento:</strong> {selectedEvent.treatment?.name}</p>
          <p>
            <strong>Início:</strong> {selectedEvent.start_time ? format(new Date(selectedEvent.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "Não informado"}
          </p>
          <p>
            <strong>Término:</strong> {selectedEvent.end_time ? format(new Date(selectedEvent.end_time), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "Não informado"}
          </p>
          <p><strong>Observações:</strong> {selectedEvent.notes || "Nenhuma"}</p>
        </Modal>
      )}
    </div>
  );
}
