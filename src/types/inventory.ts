export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  minimum_quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryFormData {
  name: string;
  description?: string;
  quantity: number;
  minimum_quantity: number;
  unit_price: number;
}