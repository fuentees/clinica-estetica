import { supabase } from '../lib/supabase';
import { sendNotification } from '../lib/notifications';
import { addMinutes, isPast } from 'date-fns';

async function processReminders() {
  try {
    // Get pending reminders that are due
    const { data: reminders, error } = await supabase
      .from('appointment_reminders')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString());

    if (error) throw error;

    for (const reminder of reminders || []) {
      try {
        await sendNotification({
          to: reminder.to,
          subject: reminder.subject,
          message: reminder.message,
          type: reminder.type,
        });

        // Update reminder status
        await supabase
          .from('appointment_reminders')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', reminder.id);

      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        
        // Mark as failed after 3 retries
        if (reminder.retry_count >= 3) {
          await supabase
            .from('appointment_reminders')
            .update({ 
              status: 'failed',
              error_message: error.message
            })
            .eq('id', reminder.id);
        } else {
          // Schedule retry in 5 minutes
          await supabase
            .from('appointment_reminders')
            .update({ 
              retry_count: (reminder.retry_count || 0) + 1,
              scheduled_for: addMinutes(new Date(), 5).toISOString()
            })
            .eq('id', reminder.id);
        }
      }
    }
  } catch (error) {
    console.error('Error in notification worker:', error);
  }
}

// Run every minute
setInterval(processReminders, 60 * 1000);