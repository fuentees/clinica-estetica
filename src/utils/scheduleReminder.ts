import { supabase } from "../lib/supabase";

/**
 * Interface para garantir tipagem forte
 */
interface AppointmentReminderData {
  id: string;
  patient_id: string;
  start_time: string;
  minutes_before?: number; // Permite customizar a antecedência
}

/**
 * Agenda um lembrete automatizado para a consulta
 */
export async function scheduleAppointmentReminder(appointment: AppointmentReminderData) {
  try {
    const { id, patient_id, start_time, minutes_before = 30 } = appointment;

    if (!patient_id || !start_time) {
      console.warn("⚠️ Dados incompletos para o lembrete.");
      return;
    }

    // 1. Calcula o horário do lembrete (Data do agendamento - X minutos)
    const reminderDate = new Date(new Date(start_time).getTime() - minutes_before * 60000);
    
    // Evita agendar lembretes para o passado
    if (reminderDate.getTime() <= Date.now()) {
      console.warn("⏰ O horário do lembrete já passou.");
      return;
    }

    console.log(`📅 Agendando lembrete para ${minutes_before}min antes de:`, start_time);

    // 2. Insere no Supabase usando upsert para evitar duplicidade no mesmo appointment
    const { error } = await supabase
      .from("reminders")
      .upsert({
        appointment_id: id,
        patient_id: patient_id,
        reminder_time: reminderDate.toISOString(),
        status: "pending",
        metadata: {
          scheduled_at: new Date().toISOString(),
          type: "appointment_notification"
        }
      }, { onConflict: 'appointment_id' });

    if (error) throw error;

    console.log("✅ Lembrete registrado/atualizado com sucesso!");
    
  } catch (error) {
    console.error("❌ Erro técnico ao agendar lembrete:", error);
  }
}