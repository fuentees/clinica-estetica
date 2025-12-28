import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useAppointmentReminders(appointmentId: string) {
  return useQuery({
    queryKey: ['appointment-reminders', appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointment_reminders')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!appointmentId,
  });
}