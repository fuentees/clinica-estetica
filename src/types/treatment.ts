export interface Treatment {
  id: string;
  name: string;
  description: string;
  /** * ✅ Duração no formato 'interval' do Postgres (ex: "01:30:00") 
   * ou string de exibição (ex: "60 min")
   */
  duration: string; 
  price: number;
  
  // ✅ Adicionado para Inteligência Artificial e Relatórios
  category?: 'facial' | 'corporal' | 'capilar' | 'injetavel' | 'outro';
  isActive?: boolean; // Permite desativar um serviço sem apagar o histórico de quem já fez
  
  created_at: string;
  updated_at: string;
}

// ✅ Interface para criação/edição facilitada
export interface TreatmentFormData {
  name: string;
  description: string;
  duration_minutes: number; // No formulário usamos minutos (número) para facilitar a UX
  price: number;
  category: string;
}