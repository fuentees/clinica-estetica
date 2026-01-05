export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  category: string; // Adicionado: Essencial para organizar (Injetáveis, Descartáveis, Home Care)
  quantity: number;
  minimum_quantity: number;
  unit_price: number;
  unit_type: 'ml' | 'un' | 'cx' | 'mg'; // Adicionado: Para saber se são 10ml ou 10 unidades
  location?: string; // Adicionado: Para clínicas com mais de uma sala ou armário
  created_at: string;
  updated_at: string;
}

export interface InventoryFormData {
  name: string;
  description?: string;
  category: string;
  quantity: number;
  minimum_quantity: number;
  unit_price: number;
  unit_type: 'ml' | 'un' | 'cx' | 'mg';
  location?: string;
}

// Helper para UI: Útil para disparar alertas no dashboard
export interface InventoryAlert {
  item_id: string;
  item_name: string;
  current_quantity: number;
  minimum_quantity: number;
  status: 'low_stock' | 'out_of_stock';
}