import { supabase } from './supabase';
import { sendEmail } from './email';
import { sendSMS } from './sms';
import { sendWhatsApp } from './whatsapp';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationOptions {
  to: string;
  subject?: string;
  message: string;
  type: 'email' | 'sms' | 'whatsapp';
}

export async function sendNotification({ to, subject, message, type }: NotificationOptions) {
  try {
    switch (type) {
      case 'email':
        await sendEmail(to, subject!, message);
        break;
      case 'sms':
        await sendSMS(to, message);
        break;
      case 'whatsapp':
        await sendWhatsApp(to, message);
        break;
    }

    const { error } = await supabase
      .from('appointment_reminders')
      .insert({
        type,
        status: 'sent',
        sent_at: new Date().toISOString(),
        scheduled_for: new Date().toISOString(),
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(\`Error sending \${type} notification:\`, error);
    throw error;
  }
}

export async function scheduleAppointmentReminder(
  appointmentId: string,
  patientEmail: string,
  patientPhone: string,
  appointmentDate: Date,
  patientName: string,
  treatmentName: string
) {
  const formattedDate = format(appointmentDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  
  const oneDayBefore = new Date(appointmentDate);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);

  const twoHoursBefore = new Date(appointmentDate);
  twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);

  const emailMessage = \`Olá \${patientName},\n\nLembramos que você tem uma consulta agendada para \${formattedDate} - \${treatmentName}.\n\nAtenciosamente,\nClínica Estética\`;
  const whatsappMessage = \`Olá \${patientName}! Lembramos que você tem uma consulta agendada para \${formattedDate} - \${treatmentName}. Confirme sua presença respondendo esta mensagem.`;

  const { error } = await supabase
    .from('appointment_reminders')
    .insert([
      {
        appointment_id: appointmentId,
        type: 'email',
        status: 'pending',
        scheduled_for: oneDayBefore.toISOString(),
        message: emailMessage,
        to: patientEmail,
        subject: 'Lembrete de Consulta',
      },
      {
        appointment_id: appointmentId,
        type: 'whatsapp',
        status: 'pending',
        scheduled_for: twoHoursBefore.toISOString(),
        message: whatsappMessage,
        to: patientPhone,
      },
    ]);

  if (error) {
    console.error('Error scheduling reminders:', error);
    throw error;
  }
}