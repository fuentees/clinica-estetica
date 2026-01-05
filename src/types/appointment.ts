import { Treatment } from './treatment';
import { Patient } from './patient';
import { User } from './auth';

// Adicionado 'blocked' para suportar a funcionalidade de trava de agenda que criamos
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'blocked';

export interface Appointment {
  id: string;
  patient_id: string;
  professional_id: string;
  treatment_id: string | null; // Pode ser nulo em caso de bloqueios de agenda
  date: string; // Adicionado: Campo YYYY-MM-DD essencial para filtros de banco de dados
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos para queries com JOIN do Supabase
  patients?: Patient; 
  profiles?: User; // No banco costuma ser a tabela profiles vinculada ao profissional
  treatments?: Treatment;
}

export interface AppointmentFormData {
  patient_id: string;
  professional_id: string;
  treatment_id: string;
  date: string; // Obrigatório para facilitar a busca por dia
  start_time: string;
  end_time: string;
  notes?: string;
  status?: AppointmentStatus;
}