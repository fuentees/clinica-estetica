/*
  # Sistema Financeiro

  1. Novas Tabelas
    - `payments`
      - `id` (uuid, primary key)
      - `appointment_id` (uuid, referência para appointments)
      - `amount` (decimal)
      - `payment_method` (text) - 'credit_card', 'debit_card', 'pix', 'cash'
      - `installments` (integer)
      - `status` (text) - 'pending', 'paid', 'overdue', 'cancelled'
      - `due_date` (date)
      - `paid_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `payment_installments`
      - `id` (uuid, primary key)
      - `payment_id` (uuid, referência para payments)
      - `installment_number` (integer)
      - `amount` (decimal)
      - `due_date` (date)
      - `status` (text)
      - `paid_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `expenses`
      - `id` (uuid, primary key)
      - `description` (text)
      - `amount` (decimal)
      - `category` (text)
      - `due_date` (date)
      - `paid_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Adicionar políticas para controle de acesso
*/

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  payment_method text NOT NULL,
  installments integer DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  due_date date NOT NULL,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('credit_card', 'debit_card', 'pix', 'cash')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  CONSTRAINT valid_installments CHECK (installments >= 1)
);

-- Create payment_installments table
CREATE TABLE IF NOT EXISTS payment_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES payments(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  amount decimal(10,2) NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled'))
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  category text NOT NULL,
  due_date date NOT NULL,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Staff can view payments"
  ON payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'receptionist')
  ));

CREATE POLICY "Staff can manage payments"
  ON payments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'receptionist')
  ));

-- Create policies for payment_installments
CREATE POLICY "Staff can view installments"
  ON payment_installments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'receptionist')
  ));

CREATE POLICY "Staff can manage installments"
  ON payment_installments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'receptionist')
  ));

-- Create policies for expenses
CREATE POLICY "Admin can view expenses"
  ON expenses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ));

CREATE POLICY "Admin can manage expenses"
  ON expenses FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ));