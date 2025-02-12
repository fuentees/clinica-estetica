import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Appointment } from '../types/appointment';

export function useAppointments() {
  return useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(
          "*, " +
          "patient:patient_id (*, profiles:profile_id (first_name, last_name)), " +
          "professional:professional_id (first_name, last_name), " +
          "treatment:treatment_id (name, description, duration)"
        )
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    },
  });
}
