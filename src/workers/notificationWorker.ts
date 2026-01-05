import { supabase } from '../lib/supabase';
import { sendNotification } from '../lib/notifications';
import { addMinutes } from 'date-fns';

/**
 * Worker Inteligente de Notificações
 * Processa a fila de mensagens, gerencia falhas e atualiza status
 */
async function processReminders() {
  try {
    // 1. Busca lembretes pendentes que já atingiram o horário de envio
    // lte = Less Than or Equal (Menor ou igual ao horário atual)
    const { data: reminders, error } = await supabase
      .from('appointment_reminders')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(20); // Processa em lotes para não sobrecarregar a memória

    if (error) throw error;
    if (!reminders || reminders.length === 0) return;

    console.log(`🚀 Processando lote de ${reminders.length} lembretes...`);

    // 2. Processamento em paralelo com controle de erro individual
    await Promise.all(reminders.map(async (reminder) => {
      try {
        // Marca como 'processing' imediatamente para evitar envios duplicados por outros workers
        await supabase
          .from('appointment_reminders')
          .update({ status: 'processing' })
          .eq('id', reminder.id);

        // Disparo da notificação (WhatsApp, E-mail ou SMS via seu provedor)
        await sendNotification({
          to: reminder.to,
          subject: reminder.subject,
          message: reminder.message,
          type: reminder.type,
        });

        // Atualização para sucesso
        await supabase
          .from('appointment_reminders')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', reminder.id);

        console.log(`✅ Notificação ${reminder.id} enviada para ${reminder.to}`);

      } catch (err: any) {
        console.error(`❌ Erro no lembrete ${reminder.id}:`, err.message);
        
        const currentRetries = reminder.retry_count || 0;

        if (currentRetries >= 3) {
          // Excedeu limite de tentativas: Falha Crítica
          await supabase
            .from('appointment_reminders')
            .update({ 
              status: 'failed',
              error_message: err.message
            })
            .eq('id', reminder.id);
        } else {
          // Agenda nova tentativa em 5 minutos
          await supabase
            .from('appointment_reminders')
            .update({ 
              status: 'pending', // Volta para pendente
              retry_count: currentRetries + 1,
              scheduled_for: addMinutes(new Date(), 5).toISOString()
            })
            .eq('id', reminder.id);
        }
      }
    }));

  } catch (error) {
    console.error('🔥 Erro crítico no Notification Worker:', error);
  }
}

/**
 * EXECUÇÃO DO WORKER
 * Em produção, prefira usar Supabase Edge Functions com CRON jobs.
 * Para desenvolvimento/Node, o setInterval funciona bem.
 */
const RUN_INTERVAL = 60 * 1000; // 1 minuto
setInterval(processReminders, RUN_INTERVAL);

export { processReminders };