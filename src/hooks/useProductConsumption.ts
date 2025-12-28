import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface ProductConsumption {
  id: string;
  inventory_id: string;
  appointment_id: string;
  professional_id: string;
  quantity: number;
  created_at: string;
  inventory: {
    name: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
  };
}

export function useProductConsumption() {
  return useQuery({
    queryKey: ['product-consumption'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_consumption')
        .select(`
          *,
          inventory (name),
          profiles:professional_id (first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProductConsumption[];
    },
  });
}