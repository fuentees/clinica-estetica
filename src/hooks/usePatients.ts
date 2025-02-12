import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Patient } from '../types/patient';

export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select(\`
          *,
          profiles:profile_id (
            first_name,
            last_name
          )
        \`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Patient[];
    },
  });
}