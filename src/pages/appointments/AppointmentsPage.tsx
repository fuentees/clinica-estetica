import { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { useAppointments } from "../../hooks/useAppointments";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "pt-BR": ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export function AppointmentsPage() {
  const [date, setDate] = useState(new Date());
  const { data: appointments, isLoading } = useAppointments();

  const events =
    appointments?.map((appointment) => ({
      id: appointment.id,
      title: `${appointment.patient?.profiles.first_name} - ${appointment.treatment?.name}`,
      start: new Date(appointment.start_time),
      end: new Date(appointment.end_time),
      resource: appointment,
    })) || [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Agenda</h1>
      <Link to="/appointments/new">
        <Button>Nova Consulta</Button>
      </Link>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "calc(100vh - 250px)" }}
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
      />
    </div>
  );
}
