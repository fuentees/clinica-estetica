import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { InventoryItem } from '../types/inventory';

export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as InventoryItem[];
    },
  });
}