export interface Patient {
  id: string;
  profile_id: string;
  first_name?: string; // ✅ Tornado opcional para evitar erro caso não venha da API
  last_name?: string;  // ✅ Tornado opcional para evitar erro caso não venha da API
  email?: string;      // ✅ Tornado opcional para evitar erro caso não venha da API
  phone?: string;      // ✅ Tornado opcional para evitar erro caso não venha da API
  date_of_birth: string;
  cpf: string;
  address?: string | null;
  medical_history?: string | null;
  allergies?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { // ✅ Adicionado para suportar relacionamento com 'profiles'
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
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
