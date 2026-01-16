// --- TIPOS DE ATENDIMENTO CLÍNICO ---

export interface Service {
  id: string;
  name: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  batch?: string;
}

export interface UsedProduct {
  inventoryId: string;
  name: string;
  batch: string;
  quantity: string;
}

export interface PrescriptionItem {
  drug: string;
  dosage: string;
  instructions: string;
}

export interface Attachment {
  usedProducts?: UsedProduct[];
  photos?: string[];
  nextSession?: string;
  prescription?: PrescriptionItem[];
}

export interface Profile {
  first_name: string;
  last_name: string;
  role: string;
  fullName?: string; 
}

// ✅ Interface de Metadados Atualizada
export interface RecordMetadata {
  patient_name?: string;
  professional_name?: string;
  clinic_id?: string;
  clinic_name?: string;  // ✅ Adicionado para suportar o nome da clínica no laudo
  subject_name?: string; // ✅ Adicionado para histórico do procedimento
}

export interface ClinicalRecord {
  id: string;
  date: string;
  subject: string;
  description: string;
  attachments: Attachment;
  created_at: string;
  deleted_at?: string | null;
  profiles?: Profile; 
  metadata?: RecordMetadata; 
  professional?: {
    fullName: string;
  };
}

// --- TIPOS DE CONSENTIMENTO ---

export interface ConsentTemplate {
  id: string;
  title: string;
  content: string;
  procedure_keywords: string[];
}

// --- TIPOS DE CONTEXTO ---

export interface PatientContext {
  clinicId: string | null;
  clinicName: string;      // ✅ Adicionado para o contexto multiclínica
  professionalId: string | null;
  professionalName: string;
  patientName: string;
}