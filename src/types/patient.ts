export interface Patient {
  id: string;
  profile_id: string;
  first_name: string; // ✅ Adicionado para compatibilidade
  last_name: string;  // ✅ Adicionado para compatibilidade
  email: string;      // ✅ Adicionado para compatibilidade
  phone: string;      // ✅ Adicionado para compatibilidade
  date_of_birth: string;
  cpf: string;
  address: string | null;
  medical_history: string | null;
  allergies: string | null;
  created_at: string;
  updated_at: string;
}

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
