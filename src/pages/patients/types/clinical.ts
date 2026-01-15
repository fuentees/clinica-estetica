// --- TIPOS DE ATENDIMENTO CLÍNICO ---

export interface Service {
  id: string;
  name: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  batch?: string; // Adicionado para suportar o lote automático
}

export interface UsedProduct {
  inventoryId: string;
  name: string;
  batch: string;
  quantity: string;
}

// ✅ Nova interface para itens da prescrição
export interface PrescriptionItem {
  drug: string;
  dosage: string;
  instructions: string;
}

export interface Attachment {
  usedProducts?: UsedProduct[];
  photos?: string[];
  nextSession?: string;
  prescription?: PrescriptionItem[]; // ✅ Adicionado ao JSON de anexos
}

export interface Profile {
  first_name: string;
  last_name: string;
  role: string;
}

export interface ClinicalRecord {
  id: string;
  date: string;
  subject: string;
  description: string;
  attachments: Attachment;
  created_at: string;
  deleted_at?: string | null;
  profiles?: Profile; // Relacionamento com a tabela profiles
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
  professionalId: string | null;
  professionalName: string;
  patientName: string;
}