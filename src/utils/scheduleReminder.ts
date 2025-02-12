import { supabase } from "../lib/supabase";

/**
 * Agenda um lembrete para a consulta do paciente
 * @param appointment Consulta do paciente
 */
export async function scheduleAppointmentReminder(appointment: {
  id: string;
  patient_id: string;
  start_time: string;
}) {
  try {
    if (!appointment.patient_id || !appointment.start_time) {
      console.warn("⚠️ Dados incompletos para o lembrete.");
      return;
    }

    console.log("📅 Agendando lembrete para:", appointment);

    const { error } = await supabase
      .from("reminders")
      .insert({
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        reminder_time: new Date(new Date(appointment.start_time).getTime() - 30 * 60000), // 30 min antes
        status: "pending",
      });

    if (error) throw error;

    console.log("✅ Lembrete agendado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao agendar lembrete:", error);
  }
}
