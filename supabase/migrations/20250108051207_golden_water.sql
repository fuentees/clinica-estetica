/*
  # Criar tabelas para formulários e termos de consentimento

  1. Novas Tabelas
    - `treatment_forms`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, referência para patients)
      - `treatment_id` (uuid, referência para treatments)
      - `professional_notes` (text)
      - `skin_type` (text)
      - `current_medications` (text)
      - `treatment_area` (text)
      - `treatment_plan` (text)
      - `observations` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `consent_forms`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, referência para patients)
      - `treatment_id` (uuid, referência para treatments)
      - `consent_text` (text)
      - `signature` (text)
      - `signed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS em ambas as tabelas
    - Adicionar políticas para leitura e escrita
*/

-- Create treatment_forms table
CREATE TABLE IF NOT EXISTS treatment_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id uuid REFERENCES treatments(id),
  professional_notes text,
  skin_type text NOT NULL,
  current_medications text,
  treatment_area text NOT NULL,
  treatment_plan text NOT NULL,
  observations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create consent_forms table
CREATE TABLE IF NOT EXISTS consent_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id uuid REFERENCES treatments(id),
  consent_text text NOT NULL,
  signature text NOT NULL,
  signed_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE treatment_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_forms ENABLE ROW LEVEL SECURITY;

-- Create policies for treatment_forms
CREATE POLICY "Staff can view treatment forms"
  ON treatment_forms FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'professional')
  ));

CREATE POLICY "Professionals can insert treatment forms"
  ON treatment_forms FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'professional'
  ));

-- Create policies for consent_forms
CREATE POLICY "Staff can view consent forms"
  ON consent_forms FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'professional')
  ));

CREATE POLICY "Patients can view their own consent forms"
  ON consent_forms FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert consent forms"
  ON consent_forms FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'professional')
  ));