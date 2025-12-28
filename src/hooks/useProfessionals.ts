import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { User } from '../types/auth';

export function useProfessionals() {
  return useQuery({
    queryKey: ['professionals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'professional')
        .order('first_name');

      if (error) throw error;
      return data as User[];
    },
  });
}