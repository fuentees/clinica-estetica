import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface PatientTreatment {
  id: string;
  patient_id: string;
  treatment_id: string;
  professional_id: string;
  appointment_id: string;
  notes: string | null;
  photos: string[];
  created_at: string;
  treatments: {
    name: string;
    description: string;
  };
  appointments: {
    start_time: string;
    end_time: string;
    status: string;
  };
}

export function usePatientTreatments(patientId: string) {
  return useQuery({
    queryKey: ['patient-treatments', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_treatments')
        .select(`
          *,
          treatments (
            name,
            description
          ),
          appointments (
            start_time,
            end_time,
            status
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PatientTreatment[];
    },
    enabled: !!patientId,
  });
}