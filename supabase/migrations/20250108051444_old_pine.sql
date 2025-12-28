/*
  # Inventory Tracking System

  1. New Tables
    - `product_consumption`
      - `id` (uuid, primary key)
      - `inventory_id` (uuid, reference to inventory)
      - `appointment_id` (uuid, reference to appointments)
      - `professional_id` (uuid, reference to profiles)
      - `quantity` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on new table
    - Add policies for staff access
*/

-- Create product_consumption table
CREATE TABLE IF NOT EXISTS product_consumption (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid REFERENCES inventory(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id),
  professional_id uuid REFERENCES profiles(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_consumption ENABLE ROW LEVEL SECURITY;

-- Create policies for product_consumption
CREATE POLICY "Staff can view product consumption"
  ON product_consumption FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'professional', 'receptionist')
  ));

CREATE POLICY "Staff can record product consumption"
  ON product_consumption FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'professional')
  ));