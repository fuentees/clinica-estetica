/*
  # Security Enhancements

  1. Changes
    - Add encryption for sensitive data
    - Add backup status monitoring
    - Add security settings table

  2. Security
    - Enable RLS on all new tables
    - Add policies for admin access
*/

-- Create security_settings table
CREATE TABLE IF NOT EXISTS security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- Create backup_status table
CREATE TABLE IF NOT EXISTS backup_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type text NOT NULL,
  status text NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  size_bytes bigint,
  error_message text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('running', 'completed', 'failed'))
);

-- Enable RLS
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_status ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only admins can view security settings"
  ON security_settings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ));

CREATE POLICY "Only admins can manage security settings"
  ON security_settings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ));

CREATE POLICY "Only admins can view backup status"
  ON backup_status FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ));

-- Create function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data text)
RETURNS text AS $$
BEGIN
  RETURN pgp_sym_encrypt(
    data,
    current_setting('app.encryption_key'),
    'compress-algo=2, cipher-algo=aes256'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data text)
RETURNS text AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    encrypted_data::bytea,
    current_setting('app.encryption_key')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add encrypted columns to existing tables
ALTER TABLE patients 
  ADD COLUMN encrypted_medical_history text,
  ADD COLUMN encrypted_allergies text;

-- Create trigger to automatically encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_patient_data()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.medical_history IS NOT NULL THEN
    NEW.encrypted_medical_history = encrypt_sensitive_data(NEW.medical_history);
    NEW.medical_history = NULL;
  END IF;
  
  IF NEW.allergies IS NOT NULL THEN
    NEW.encrypted_allergies = encrypt_sensitive_data(NEW.allergies);
    NEW.allergies = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER encrypt_patient_data_trigger
  BEFORE INSERT OR UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_patient_data();