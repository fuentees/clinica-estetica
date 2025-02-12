/*
  # Treatment Progress Tracking

  1. New Tables
    - `treatment_progress`
      - Records detailed progress notes for each treatment session
      - Stores measurements, side effects, and recommendations
      - Tracks progress over time
    
  2. Security
    - Enable RLS on new table
    - Add policies for professionals to manage progress records
    - Add policies for patients to view their own progress
*/

-- Create treatment_progress table
CREATE TABLE IF NOT EXISTS treatment_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id uuid REFERENCES patient_treatments(id) ON DELETE CASCADE,
  progress_notes text NOT NULL,
  measurements text,
  side_effects text,
  recommendations text,
  next_session_notes text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE treatment_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Professionals can manage treatment progress"
  ON treatment_progress FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'professional'
  ));

CREATE POLICY "Patients can view their own treatment progress"
  ON treatment_progress FOR SELECT
  USING (
    treatment_id IN (
      SELECT pt.id 
      FROM patient_treatments pt
      JOIN patients p ON pt.patient_id = p.id
      WHERE p.profile_id = auth.uid()
    )
  );

-- Create trigger for updating timestamps
CREATE TRIGGER update_treatment_progress_updated_at
  BEFORE UPDATE ON treatment_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Add storage bucket for treatment photos
INSERT INTO storage.buckets (id, name)
VALUES ('treatment-photos', 'treatment-photos')
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Professionals can upload treatment photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'treatment-photos'
    AND (EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'professional'
    ))
  );

CREATE POLICY "Users can view treatment photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'treatment-photos'
    AND (EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('professional', 'admin')
    ) OR (
      EXISTS (
        SELECT 1 FROM patient_treatments pt
        JOIN patients p ON pt.patient_id = p.id
        WHERE p.profile_id = auth.uid()
        AND (storage.foldername(name))[1] = pt.id::text
      )
    ))
  );