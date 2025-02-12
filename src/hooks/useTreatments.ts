import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Treatment } from '../types/treatment';

export function useTreatments() {
  return useQuery({
    queryKey: ['treatments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Treatment[];
    },
  });
}