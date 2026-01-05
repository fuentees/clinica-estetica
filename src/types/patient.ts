// ✅ Interface principal do Paciente refletindo o Schema do Banco
export interface Patient {
  id: string;
  profile_id: string;
  
  // Dados fundamentais da ficha clínica
  date_of_birth: string;
  cpf: string;
  address?: string | null;
  medical_history?: string | null;
  allergies?: string | null;
  
  // Metadados
  created_at: string;
  updated_at: string;

  /**
   * ✅ Suporte ao Relacionamento com a tabela 'profiles'
   * No Supabase, ao buscar o paciente, você fará algo como:
   * .select('*, profiles:profile_id(*)')
   */
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    avatar_url?: string | null; // Adicionado para suportar fotos de perfil
  };

  // ✅ Getters virtuais (opcionais para facilitar a UI)
  first_name?: string; 
  last_name?: string;  
  email?: string;      
  phone?: string;      
}

// ✅ Interface para o Formulário de Cadastro/Edição
export interface PatientFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  cpf: string;
  date_of_birth: string;
  address: string;
  medical_history: string;
  allergies: string;
}

// ✅ Interface Útil para Listagens (Otimizada)
export interface PatientListItem extends Pick<Patient, 'id' | 'cpf' | 'created_at'> {
  profiles: {
    first_name: string;
    last_name: string;
    phone: string;
  }
}