import { Treatment } from './treatment';
import { Patient } from './patient';
import { User } from './auth';

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patient_id: string;
  professional_id: string;
  treatment_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  professional?: User;
  treatment?: Treatment;
}

export interface AppointmentFormData {
  patient_id: string;
  professional_id: string;
  treatment_id: string;
  start_time: string;
  end_time: string;
  notes?: string;
}