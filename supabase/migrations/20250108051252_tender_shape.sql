/*
  # Sistema de Agendamento Inteligente

  1. Novas Tabelas
    - `waiting_list`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, referência para patients)
      - `treatment_id` (uuid, referência para treatments)
      - `preferred_dates` (jsonb) - Array de datas/horários preferidos
      - `status` (text) - 'waiting', 'scheduled', 'cancelled'
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `appointment_reminders`
      - `id` (uuid, primary key)
      - `appointment_id` (uuid, referência para appointments)
      - `type` (text) - 'email', 'sms', 'whatsapp'
      - `status` (text) - 'pending', 'sent', 'failed'
      - `scheduled_for` (timestamptz)
      - `sent_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `check_ins`
      - `id` (uuid, primary key)
      - `appointment_id` (uuid, referência para appointments)
      - `arrived_at` (timestamptz)
      - `status` (text) - 'waiting', 'in_service', 'completed'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Adicionar políticas para leitura e escrita
*/

-- Create waiting_list table
CREATE TABLE IF NOT EXISTS waiting_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id uuid REFERENCES treatments(id),
  preferred_dates jsonb NOT NULL,
  status text NOT NULL DEFAULT 'waiting',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('waiting', 'scheduled', 'cancelled'))
);

-- Create appointment_reminders table
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_type CHECK (type IN ('email', 'sms', 'whatsapp')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed'))
);

-- Create check_ins table
CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  arrived_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('waiting', 'in_service', 'completed'))
);

-- Enable RLS
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Create policies for waiting_list
CREATE POLICY "Staff can view waiting list"
  ON waiting_list FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'professional', 'receptionist')
  ));

CREATE POLICY "Staff can manage waiting list"
  ON waiting_list FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'receptionist')
  ));

-- Create policies for appointment_reminders
CREATE POLICY "Staff can view reminders"
  ON appointment_reminders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'receptionist')
  ));

-- Create policies for check_ins
CREATE POLICY "Staff can view check-ins"
  ON check_ins FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'professional', 'receptionist')
  ));

CREATE POLICY "Staff can manage check-ins"
  ON check_ins FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'receptionist')
  ));